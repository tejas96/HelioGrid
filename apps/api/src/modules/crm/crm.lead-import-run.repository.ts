import {
  type DbTransaction,
  leadImport,
  leadImportRow,
  type TenantPool,
  userAccount,
} from '@heliogrid/db';
import type {
  CatalogImportState,
  FormatPack,
  ImportDuplicateChoice,
  LeadImportCells,
  LeadImportProblem,
} from '@heliogrid/domain';
import { readLeadImportRow } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { TENANT_DB } from '../../common/db/tenant.token';
import { currentLeadOf, lockPhone } from './crm.customers.repository';
import { memberNameOf } from './crm.lead-columns.repository';
import { handOff, lockedLeadImport } from './crm.lead-import.repository';
import {
  type ImportEnquiryNotice,
  noticeEnquiryOwners,
} from './crm.lead-import-notices.repository';
import { ofImport } from './crm.lead-import-rows.repository';
import { writeNewLead } from './crm.new-lead.repository';
import { currentHoldersOf } from './crm.sheet-facts.repository';
import { recordActivity } from './crm.timeline.repository';

/** A started run, and the event to dispatch after the commit — or where the job already is. */
export type StartedLeadImportRun =
  | { readonly eventId: string }
  | { readonly status: CatalogImportState };

/** Who pressed import, the choice every duplicate follows, and the market a row is read in. */
export interface LeadImportRunner {
  readonly runBy: string;
  readonly duplicateChoice: ImportDuplicateChoice;
  readonly formats: FormatPack;
}

/** What one row's write changes on it besides being taken. */
type RowOutcome = Partial<
  Pick<
    typeof leadImportRow.$inferInsert,
    'problems' | 'duplicateOfCustomerId' | 'repeatsRow' | 'leadId' | 'enquiryActivityId'
  >
>;

const NOT_WRITTEN_PROBLEMS: readonly LeadImportProblem[] = ['not_written'];

/** A row taken as not written: rejected, naming nothing it would have met or landed. */
const NOT_WRITTEN = {
  problems: NOT_WRITTEN_PROBLEMS,
  duplicateOfCustomerId: null,
  repeatsRow: null,
} as const;

/**
 * The lead import's run on the runtime pool (`M02-20`, `M02-21`): each row lands in its own small
 * transaction under its number's lock, so a row that fails rolls back alone and every row already
 * landed stays landed.
 */
@Injectable()
export class CrmLeadImportRunRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /**
   * The job `running` with who ran it, when and the duplicate choice, and the handoff to the run —
   * committed together. A job that is not previewed is answered where it is, and nothing is
   * written; null when not this company's.
   */
  async start(
    tenantId: string,
    jobId: string,
    duplicateChoice: ImportDuplicateChoice,
    act: Act,
  ): Promise<StartedLeadImportRun | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const job = await lockedLeadImport(tx, tenantId, jobId);
      if (job === null) return null;
      if (job.status !== 'previewed') return { status: job.status };
      const at = new Date(act.now);
      await tx
        .update(leadImport)
        .set({
          status: 'running',
          duplicateChoice,
          runAt: at,
          runBy: act.actorUserId,
          updatedAt: at,
        })
        .where(and(eq(leadImport.tenantId, tenantId), eq(leadImport.id, jobId)));
      return { eventId: await handOff(tx, tenantId, jobId, 'run') };
    });
  }

  /** How the person who pressed import is named on the notices it sends. */
  async nameOf(tenantId: string, userId: string): Promise<string> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [found] = await tx
        .select({ name: memberNameOf(userAccount) })
        .from(userAccount)
        .where(eq(userAccount.id, userId));
      if (found?.name == null) throw new Error(`no account ${userId} ran lead import`);
      return found.name;
    });
  }

  /** The next rows the run has not taken, in sheet order. */
  async untaken(tenantId: string, jobId: string, limit: number): Promise<readonly number[]> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const rows = await tx
        .select({ rowNumber: leadImportRow.rowNumber })
        .from(leadImportRow)
        .where(and(ofImport(tenantId, jobId), isNull(leadImportRow.ranAt)))
        .orderBy(asc(leadImportRow.rowNumber))
        .limit(limit);
      return rows.map((row) => row.rowNumber);
    });
  }

  /**
   * One row taken, in its own transaction under its number's lock: a rejected row is taken as it
   * stands; a number nobody holds lands a customer and an unassigned lead (source `import`); a
   * number someone holds — another customer, a contact, or the lead an earlier row of this file
   * just landed — follows the duplicate choice, and never makes a second customer. A row already
   * taken, by a step run again, is left alone.
   */
  async takeRow(
    tenantId: string,
    jobId: string,
    rowNumber: number,
    runner: LeadImportRunner,
    now: number,
  ): Promise<void> {
    await this.db.withTenantTransaction(tenantId, async (tx) => {
      const thisRow = and(ofImport(tenantId, jobId), eq(leadImportRow.rowNumber, rowNumber));
      const [row] = await tx
        .select({
          cells: leadImportRow.cells,
          problems: leadImportRow.problems,
          repeatsRow: leadImportRow.repeatsRow,
        })
        .from(leadImportRow)
        .where(and(thisRow, isNull(leadImportRow.ranAt)))
        .for('update');
      if (row === undefined) return;
      const outcome = await outcomeOf(tx, tenantId, row, runner, now);
      const at = new Date(now);
      await tx
        .update(leadImportRow)
        .set({ ...outcome, ranAt: at, updatedAt: at })
        .where(thisRow);
    });
  }

  /**
   * A row whose write failed, taken on its own as not written — in a transaction of its own, the
   * failed one having rolled back — so the rows after it still run. A row already taken is left.
   */
  async rejectUnwritten(
    tenantId: string,
    jobId: string,
    rowNumber: number,
    now: number,
  ): Promise<void> {
    await this.db.withTenantTransaction(tenantId, async (tx) => {
      const at = new Date(now);
      await tx
        .update(leadImportRow)
        .set({ ...NOT_WRITTEN, ranAt: at, updatedAt: at })
        .where(
          and(
            ofImport(tenantId, jobId),
            eq(leadImportRow.rowNumber, rowNumber),
            isNull(leadImportRow.ranAt),
          ),
        );
    });
  }

  /**
   * The run ends: on a failure past every retry, every row still untaken is rejected as not
   * written; then each owner whose leads took an enquiry is told once for the batch (`F6-12`), and
   * the job completes — in one transaction, so the notices are written once. Answers where the job
   * is and the notices written; null when not this company's.
   */
  async complete(
    tenantId: string,
    jobId: string,
    endedEarly: boolean,
    notice: ImportEnquiryNotice,
    now: number,
  ): Promise<{ readonly status: CatalogImportState; readonly notified: readonly string[] } | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const job = await lockedLeadImport(tx, tenantId, jobId);
      if (job === null) return null;
      if (job.status !== 'running') return { status: job.status, notified: [] };
      const at = new Date(now);
      if (endedEarly) {
        await tx
          .update(leadImportRow)
          .set({ ...NOT_WRITTEN, ranAt: at, updatedAt: at })
          .where(and(ofImport(tenantId, jobId), isNull(leadImportRow.ranAt)));
      }
      const notified = await noticeEnquiryOwners(tx, tenantId, jobId, notice, at);
      await tx
        .update(leadImport)
        .set({ status: 'completed', updatedAt: at })
        .where(and(eq(leadImport.tenantId, tenantId), eq(leadImport.id, jobId)));
      return { status: 'completed', notified };
    });
  }
}

/** What taking one row does, under its number's lock; the row's own update follows. */
async function outcomeOf(
  tx: DbTransaction,
  tenantId: string,
  row: {
    readonly cells: LeadImportCells;
    readonly problems: readonly string[];
    readonly repeatsRow: number | null;
  },
  runner: LeadImportRunner,
  now: number,
): Promise<RowOutcome> {
  if (row.problems.length > 0) return {};
  const read = readLeadImportRow(row.cells, runner.formats);
  // The market's pack moved under a previewed row: it is rejected with the reasons it now has.
  if (!read.landable) {
    return { problems: read.problems, duplicateOfCustomerId: null, repeatsRow: null };
  }
  await lockPhone(tx, tenantId, read.phoneE164);
  const holder = (await currentHoldersOf(tx, tenantId, [read.phoneE164])).get(read.phoneE164);
  const act = { actorUserId: runner.runBy, now };
  const at = new Date(now);
  if (holder === undefined) {
    const made = await writeNewLead(
      tx,
      {
        tenantId,
        phoneE164: read.phoneE164,
        name: read.lead.name,
        city: read.lead.city,
        segment: read.lead.segment,
        monthlyBillMinor: read.lead.monthlyBill,
        source: 'import',
        referredByName: null,
        capturedAt: at,
        key: null,
      },
      act,
    );
    return { leadId: made.leadId, duplicateOfCustomerId: null, repeatsRow: null };
  }
  // A repeat names the earlier row it repeats; any other duplicate names the customer it met.
  const duplicate = row.repeatsRow === null ? { duplicateOfCustomerId: holder } : {};
  if (runner.duplicateChoice === 'skip') return duplicate;
  const leadId = await currentLeadOf(tx, tenantId, holder);
  if (leadId === null) throw new Error(`customer ${holder} holds a number and no lead`);
  const enquiry = await recordActivity(tx, {
    tenantId,
    customerId: holder,
    leadId,
    kind: 'enquiry',
    body: {
      channel: 'import',
      name: read.lead.name,
      city: read.lead.city,
      segment: read.lead.segment,
      phoneE164: read.phoneE164,
      askedBy: null,
    },
    actor: { kind: 'person', userId: runner.runBy },
    capturedAt: at,
  });
  return { ...duplicate, enquiryActivityId: enquiry.id };
}
