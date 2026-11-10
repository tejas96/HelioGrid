import type { Activity, ActivityActor, ActivityKind, ActivityPage } from '@heliogrid/contracts';
import { activity, type DbTransaction, lead, type TenantPool, userAccount } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, exists, inArray, isNull, or, type SQL } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { customerNamesInScope } from './crm.customer-record.repository';
import { customerIdsOf, customerInScope } from './crm.customers.repository';
import { findLeadInScope } from './crm.lead-detail.repository';
import { leadScopeWhere } from './crm.scope.repository';
import type { Page } from './internal/page';
import type { LeadReader } from './internal/reader';

const entryColumns = {
  id: activity.id,
  leadId: activity.leadId,
  kind: activity.kind,
  actorKind: activity.actorKind,
  actorRef: activity.actorRef,
  actorName: userAccount.name,
  capturedAt: activity.capturedAt,
  appliedAt: activity.appliedAt,
  body: activity.body,
};

interface EntryRow {
  readonly id: string;
  readonly leadId: string | null;
  readonly kind: ActivityKind;
  readonly actorKind: ActivityActor;
  readonly actorRef: string | null;
  readonly actorName: string | null;
  readonly capturedAt: Date;
  readonly appliedAt: Date;
  readonly body: Readonly<Record<string, unknown>>;
}

/** The customer a `duplicate_kept` entry was kept beside; `null` on any other entry. */
function keptBesideOf(row: EntryRow): string | null {
  const id = row.body.otherCustomerId;
  return row.kind === 'duplicate_kept' && typeof id === 'string' ? id : null;
}

/**
 * The stored entry on the wire; a kind a newer server learned reads as its plain body (`M02-35`).
 * The retry key a create kept is a column of its own, never part of the body a reader sees. A
 * customer kept beside is named as `names` allows this reader — any name stored earlier is not read.
 */
function entryOf(row: EntryRow, names: ReadonlyMap<string, string | null>): Activity {
  const keptBeside = keptBesideOf(row);
  return {
    id: row.id,
    leadId: row.leadId,
    actor: { kind: row.actorKind, id: row.actorRef, name: row.actorName },
    capturedAt: row.capturedAt.toISOString(),
    appliedAt: row.appliedAt.toISOString(),
    kind: row.kind,
    body:
      keptBeside === null ? row.body : { ...row.body, otherName: names.get(keptBeside) ?? null },
  };
}

/**
 * The timeline's reads (`M02-35`, T-M02-012) on the runtime pool: newest first by the server's
 * apply order, each page counted with its own `where`.
 */
@Injectable()
export class CrmActivitiesRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** One lead's entries; `null` when the lead is not one the reader may see. */
  async leadTimeline(reader: LeadReader, leadId: string, page: Page): Promise<ActivityPage | null> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      if ((await findLeadInScope(tx, reader, leadId)) === null) return null;
      return pageOf(
        tx,
        reader,
        and(eq(activity.tenantId, reader.tenantId), eq(activity.leadId, leadId)),
        page,
      );
    });
  }

  /**
   * A customer's one stream — theirs and every customer's merged into them — keeping only the
   * entries of leads the reader may see, and the customer-level ones; `null` for a customer outside
   * the reader's scope.
   */
  async customerTimeline(
    reader: LeadReader,
    customerId: string,
    page: Page,
  ): Promise<ActivityPage | null> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      if (!(await customerInScope(tx, reader, customerId))) return null;
      const customerIds = await customerIdsOf(tx, reader.tenantId, customerId);
      const visibleLead = exists(
        tx
          .select({ id: lead.id })
          .from(lead)
          .where(
            and(
              eq(lead.tenantId, activity.tenantId),
              eq(lead.id, activity.leadId),
              leadScopeWhere(reader.scope, reader.actorId),
            ),
          ),
      );
      const where = and(
        eq(activity.tenantId, reader.tenantId),
        inArray(activity.customerId, customerIds),
        or(isNull(activity.leadId), visibleLead),
      );
      return pageOf(tx, reader, where, page);
    });
  }
}

async function pageOf(
  tx: DbTransaction,
  reader: LeadReader,
  where: SQL | undefined,
  page: Page,
): Promise<ActivityPage> {
  const rows = await tx
    .select(entryColumns)
    .from(activity)
    .leftJoin(userAccount, eq(userAccount.id, activity.actorRef))
    .where(where)
    .orderBy(desc(activity.sequence), desc(activity.id))
    .limit(page.limit)
    .offset(page.offset);
  const [total] = await tx.select({ n: count() }).from(activity).where(where);
  const keptBeside = rows.flatMap((row) => keptBesideOf(row) ?? []);
  const names = await customerNamesInScope(tx, reader, keptBeside);
  return { items: rows.map((row) => entryOf(row, names)), totalCount: total?.n ?? 0 };
}
