import type { DedupeMatchWire, LeadImportResult, LeadImportVerdict } from '@heliogrid/contracts';
import { activity, leadImport, leadImportRow, type TenantPool } from '@heliogrid/db';
import type { CatalogImportState, LeadImportCells, LeadImportProblem } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, type SQL, sql } from 'drizzle-orm';
import { inBatches } from '../../common/db/in-batches';
import { TENANT_DB } from '../../common/db/tenant.token';
import { lockedLeadImport } from './crm.lead-import.repository';
import { currentHoldersOf, sheetFactsOfCustomers } from './crm.sheet-facts.repository';
import type { LeadReader } from './internal/reader';

/** One row as the preview pass judged it, its number matched against the company, ready to store. */
export interface StagedLeadImportRow {
  readonly rowNumber: number;
  readonly cells: LeadImportCells;
  readonly phoneE164: string | null;
  readonly problems: readonly LeadImportProblem[];
  readonly duplicateOfCustomerId: string | null;
  readonly repeatsRow: number | null;
}

/**
 * One stored row as the preview and the report read it; its problems as stored, a set that grows
 * (`LeadImportProblemsEnvelope`).
 */
export interface StoredLeadImportRow extends Omit<StagedLeadImportRow, 'problems'> {
  readonly problems: readonly string[];
  /** The lead a logged enquiry went on. */
  readonly enquiryLeadId: string | null;
  readonly leadId: string | null;
  readonly enquiryActivityId: string | null;
  readonly ranAt: Date | null;
}

/** The job's figures, read off its rows: the preview's, the run's progress and the report's. */
export interface LeadImportTallies {
  readonly rows: number;
  readonly duplicates: number;
  readonly rejected: number;
  readonly ran: number;
  readonly landed: number;
  readonly logged: number;
  readonly skipped: number;
}

const rejected = sql`jsonb_array_length(${leadImportRow.problems}) > 0`;
const duplicate = sql`(${leadImportRow.duplicateOfCustomerId} is not null or ${leadImportRow.repeatsRow} is not null)`;
const ran = sql`${leadImportRow.ranAt} is not null`;
const landed = sql`${leadImportRow.leadId} is not null`;
const logged = sql`${leadImportRow.enquiryActivityId} is not null`;

/** Each verdict as its clause: what a row names is what it is (0056). */
const VERDICT_CLAUSE: Readonly<Record<LeadImportVerdict, SQL>> = {
  rejected,
  duplicate: sql`not ${rejected} and ${duplicate}`,
  new: sql`not ${rejected} and not ${duplicate}`,
};

/** Each result as its clause: a row the run took, and what it left there. */
const RESULT_CLAUSE: Readonly<Record<LeadImportResult, SQL>> = {
  landed,
  logged,
  rejected: sql`${ran} and ${rejected}`,
  skipped: sql`${ran} and not ${rejected} and not ${landed} and not ${logged}`,
};

const storedColumns = {
  rowNumber: leadImportRow.rowNumber,
  cells: leadImportRow.cells,
  phoneE164: leadImportRow.phoneE164,
  problems: leadImportRow.problems,
  duplicateOfCustomerId: leadImportRow.duplicateOfCustomerId,
  repeatsRow: leadImportRow.repeatsRow,
  leadId: leadImportRow.leadId,
  enquiryActivityId: leadImportRow.enquiryActivityId,
  ranAt: leadImportRow.ranAt,
  enquiryLeadId: activity.leadId,
};

/** The lead import's rows on the runtime pool, inside the tenant transaction. */
@Injectable()
export class CrmLeadImportRowsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /**
   * The pass's rows in place of any earlier mapping's, and the job `previewed` — only while the job
   * is still matching by the mapping this pass read. The job row is locked first, so a mapping
   * confirmed meanwhile waits and then supersedes, or already has and this pass writes nothing.
   * Answers where the job is either way; null when not this company's.
   */
  async replace(
    tenantId: string,
    jobId: string,
    revision: number,
    rows: readonly StagedLeadImportRow[],
    now: number,
  ): Promise<CatalogImportState | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const job = await lockedLeadImport(tx, tenantId, jobId);
      if (job === null) return null;
      if (job.status !== 'matching' || job.mappingRevision !== revision) return job.status;
      await tx.delete(leadImportRow).where(ofImport(tenantId, jobId));
      const at = new Date(now);
      await inBatches(rows, async (batch) => {
        await tx.insert(leadImportRow).values(
          batch.map((row) => ({
            ...row,
            tenantId,
            importId: jobId,
            createdAt: at,
            updatedAt: at,
          })),
        );
      });
      await tx
        .update(leadImport)
        .set({ status: 'previewed', updatedAt: at })
        .where(and(eq(leadImport.tenantId, tenantId), eq(leadImport.id, jobId)));
      return 'previewed';
    });
  }

  /**
   * For each of these numbers someone in the company holds, the customer the sheet would show —
   * a statement per batch of numbers, never one per row.
   */
  async holdersOf(
    tenantId: string,
    phones: readonly string[],
  ): Promise<ReadonlyMap<string, string>> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const held = new Map<string, string>();
      await inBatches([...new Set(phones)], async (batch) => {
        for (const [phone, customerId] of await currentHoldersOf(tx, tenantId, batch)) {
          held.set(phone, customerId);
        }
      });
      return held;
    });
  }

  /** Every figure of the job in one read, with one `where`. */
  async tallies(tenantId: string, jobId: string): Promise<LeadImportTallies> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const count = (clause?: SQL) =>
        clause === undefined
          ? sql<number>`count(*)::int`
          : sql<number>`(count(*) filter (where ${clause}))::int`;
      const [tally] = await tx
        .select({
          rows: count(),
          duplicates: count(VERDICT_CLAUSE.duplicate),
          rejected: count(rejected),
          ran: count(ran),
          landed: count(RESULT_CLAUSE.landed),
          logged: count(RESULT_CLAUSE.logged),
          skipped: count(RESULT_CLAUSE.skipped),
        })
        .from(leadImportRow)
        .where(ofImport(tenantId, jobId));
      return (
        tally ?? { rows: 0, duplicates: 0, rejected: 0, ran: 0, landed: 0, logged: 0, skipped: 0 }
      );
    });
  }

  /**
   * A page of the preview or the report by sheet row, narrowed to one verdict or one result, and the
   * sheet's facts of the customers its duplicates met, as this reader may see them (`M02-20`) — read
   * once for the page, never per row.
   */
  async page(
    reader: LeadReader,
    jobId: string,
    page: {
      readonly verdict: LeadImportVerdict | undefined;
      readonly result: LeadImportResult | undefined;
      readonly limit: number;
      readonly offset: number;
    },
  ): Promise<{
    readonly rows: readonly StoredLeadImportRow[];
    readonly totalCount: number;
    readonly facts: ReadonlyMap<string, DedupeMatchWire>;
  }> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const filter = and(
        ofImport(reader.tenantId, jobId),
        page.verdict === undefined ? undefined : VERDICT_CLAUSE[page.verdict],
        page.result === undefined ? undefined : RESULT_CLAUSE[page.result],
      );
      const rows = await tx
        .select(storedColumns)
        .from(leadImportRow)
        .leftJoin(
          activity,
          and(
            eq(activity.id, leadImportRow.enquiryActivityId),
            eq(activity.tenantId, leadImportRow.tenantId),
          ),
        )
        .where(filter)
        .orderBy(asc(leadImportRow.rowNumber), asc(leadImportRow.id))
        .limit(page.limit)
        .offset(page.offset);
      const [total] = await tx
        .select({ value: sql<number>`count(*)::int` })
        .from(leadImportRow)
        .where(filter);
      const met = rows.flatMap((row) =>
        row.duplicateOfCustomerId === null ? [] : [row.duplicateOfCustomerId],
      );
      const facts = await sheetFactsOfCustomers(tx, reader, [...new Set(met)]);
      return { rows, totalCount: total?.value ?? 0, facts };
    });
  }
}

export const ofImport = (tenantId: string, jobId: string) =>
  and(eq(leadImportRow.tenantId, tenantId), eq(leadImportRow.importId, jobId));
