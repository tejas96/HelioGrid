import type { LeadDetail } from '@heliogrid/contracts';
import { customer, type DbTransaction, lead, type TenantPool } from '@heliogrid/db';
import {
  type LeadActContext,
  type LeadActRefusal,
  type LeadActResult,
  type LeadLifecycle,
  TASK_KINDS,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';
import {
  detailAfterAct,
  type LockedLead,
  lockLeadInScope,
  personOf,
  todayOf,
} from './crm.lead-lock.repository';
import { cancelOpenTasks } from './crm.raised-tasks.repository';
import { recordLeadMoves } from './crm.timeline.repository';
import type { LeadMoney } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

/** One lifecycle act: domain's decision on the locked lead, and what follows a decision it allows. */
export interface LeadActPlan {
  decide(lead: LeadLifecycle, context: LeadActContext): LeadActResult;
  /** Written in the same transaction after the moves — a wrong number's block (`M02-44`). */
  readonly follows?: (tx: DbTransaction, locked: LockedLead, act: Act) => Promise<void>;
}

export type LeadActOutcome =
  | { readonly outcome: 'done'; readonly detail: LeadDetail }
  | { readonly outcome: 'refused'; readonly refusal: LeadActRefusal }
  | { readonly outcome: 'not-found' };

/**
 * The R9 acts and *Mark qualified* (`M02-45`, `M02-49`…`M02-56`) on the runtime pool: the lead is
 * locked, domain decides on what it finds, and the moves, their history and their timeline entries
 * commit together — or a refusal writes nothing.
 */
@Injectable()
export class CrmLifecycleRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async act(
    reader: LeadReader,
    leadId: string,
    plan: LeadActPlan,
    capturedAt: Date,
    money: LeadMoney,
    act: Act,
  ): Promise<LeadActOutcome> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const locked = await lockLeadInScope(tx, reader, leadId);
      if (locked === null) return { outcome: 'not-found' };
      const context = { today: todayOf(locked, act), at: act.now, by: act.actorUserId };
      const result = plan.decide(locked.lifecycle, context);
      if (result.kind === 'refused') return { outcome: 'refused', refusal: result.refusal };
      await recordLeadMoves(tx, locked, result, personOf(act), capturedAt);
      await plan.follows?.(tx, locked, act);
      return { outcome: 'done', detail: await detailAfterAct(tx, reader, leadId, money) };
    });
  }
}

/** Call tasks are dials; a number no one may dial has none left open (`M02-44`). */
const DIAL_TASKS = ['call'] as const;

/**
 * A wrong number (`M02-44`): every customer of this company holding the number — a duplicate kept
 * beside it shares it — is marked, so no lead of theirs offers a dial, and every call task still
 * open on those leads is cancelled, so none is scheduled either.
 */
export async function blockWrongNumber(
  tx: DbTransaction,
  locked: LockedLead,
  act: Act,
): Promise<void> {
  const { tenantId } = locked;
  const [own] = await tx
    .select({ phoneE164: customer.phoneE164 })
    .from(customer)
    .where(and(eq(customer.tenantId, tenantId), eq(customer.id, locked.customerId)));
  if (own === undefined)
    throw new Error(`lead ${locked.leadId} names a customer its company lacks`);
  const holders = await tx
    .update(customer)
    .set({ wrongNumberAt: new Date(act.now) })
    .where(
      and(
        eq(customer.tenantId, tenantId),
        eq(customer.phoneE164, own.phoneE164),
        isNull(customer.wrongNumberAt),
      ),
    )
    .returning({ id: customer.id });
  const customerIds = [locked.customerId, ...holders.map((holder) => holder.id)];
  const leads = await tx
    .select({ id: lead.id })
    .from(lead)
    .where(and(eq(lead.tenantId, tenantId), inArray(lead.customerId, customerIds)));
  await cancelOpenTasks(
    tx,
    tenantId,
    leads.map((one) => one.id),
    DIAL_TASKS,
  );
}

/**
 * A loss (`M07-63`): every task still open on the lead is cancelled — kept as history — and the
 * close is audited (`F2-22`), both with the loss or neither.
 */
export async function closeLost(tx: DbTransaction, locked: LockedLead, act: Act): Promise<void> {
  await cancelOpenTasks(tx, locked.tenantId, [locked.leadId], TASK_KINDS);
  await recordAuditEntry(
    tx,
    memberAct('crm.lead_lost', locked.tenantId, { kind: 'lead', ref: locked.leadId }, act),
  );
}
