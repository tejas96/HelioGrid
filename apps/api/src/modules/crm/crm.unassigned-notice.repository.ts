import { customer, type DbTransaction, lead } from '@heliogrid/db';
import { type UiLanguage, UNASSIGNED_ESCALATES_AFTER_MS } from '@heliogrid/domain';
import { and, asc, eq, isNull, lt, type SQL } from 'drizzle-orm';
import {
  type NoticeWords,
  recipientsFor,
  recordNotificationsTo,
  type TenantQuietHours,
} from '../notification/notification.public';
import { leadCustomerJoin } from './crm.lead-columns.repository';
import { leadReadableBy } from './crm.scope.repository';

/** How the sweep words its notice of a lead left unassigned: rendered per lead, in each language. */
export interface UnassignedNotice {
  readonly wordsFor: (lead: {
    readonly name: string | null;
    readonly phoneE164: string;
  }) => Promise<(language: UiLanguage) => NoticeWords>;
  readonly quietHours: TenantQuietHours;
}

/** A lead waiting in the inbox for more than a day, its EPC Owner not told yet (`M02-50`). */
export function waitingUnassignedWhere(clock: { readonly now: number }) {
  const waitingSince = new Date(clock.now - UNASSIGNED_ESCALATES_AFTER_MS);
  return and(
    isNull(lead.ownerUserId),
    isNull(lead.lifecycleState),
    isNull(lead.unassignedEscalatedAt),
    lt(lead.createdAt, waitingSince),
  );
}

/**
 * Leads waiting in the inbox for more than a day (`M02-50`): the EPC Owner is told once per lead,
 * and the lead keeps its state — the notice is the whole act. `held` keeps it to the leads the
 * sweep has locked.
 */
export async function escalateUnassigned(
  tx: DbTransaction,
  clock: { readonly tenantId: string; readonly now: number },
  notice: UnassignedNotice,
  held: SQL,
): Promise<string[]> {
  const waiting = await tx
    .select({ leadId: lead.id, name: customer.name, phoneE164: customer.phoneE164 })
    .from(lead)
    .innerJoin(customer, leadCustomerJoin)
    .where(and(eq(lead.tenantId, clock.tenantId), held, waitingUnassignedWhere(clock)))
    .orderBy(asc(lead.id));
  const notified: string[] = [];
  for (const one of waiting) {
    await tx
      .update(lead)
      .set({ unassignedEscalatedAt: new Date(clock.now) })
      .where(and(eq(lead.tenantId, clock.tenantId), eq(lead.id, one.leadId)));
    const recipients = await recipientsFor(
      tx,
      clock.tenantId,
      'lead_unassigned_24h',
      { ownerUserId: null, assigneeUserId: null, awaits: null },
      leadReadableBy(tx, clock.tenantId, one.leadId),
    );
    const ids = await recordNotificationsTo(
      tx,
      recipients,
      {
        tenantId: clock.tenantId,
        type: 'lead_unassigned_24h',
        subjectKind: 'lead',
        subjectRef: one.leadId,
        emittedAt: new Date(clock.now),
      },
      await notice.wordsFor(one),
      notice.quietHours,
    );
    notified.push(...ids);
  }
  return notified;
}
