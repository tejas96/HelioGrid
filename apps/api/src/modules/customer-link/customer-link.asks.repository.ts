import {
  callbackRequest,
  customerQuestion,
  type DbTransaction,
  type TenantPool,
} from '@heliogrid/db';
import {
  callBackDueAt,
  callRequestDueAt,
  consentedCallTime,
  type MessagingWindow,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { TENANT_DB } from '../../common/db/tenant.token';
import { moveTaskDue, openTaskRaisedBy, raiseTask, recordActivity } from '../crm/crm.public';
import {
  customerActor,
  gone,
  heldVisit,
  type LinkActOutcome,
  type LinkNotice,
  leadOf,
  notifyAbout,
  refused,
  respondRefusal,
  viaOf,
  wakeParked,
} from './customer-link.act-effects.repository';
import { CustomerProjectsRegistry } from './customer-link.projects.repository';
import type { PresentedToken } from './customer-link.token.admin.repository';
import type { LinkVisit } from './customer-link.visit.repository';

/**
 * What the customer asks on their link, in any phase (`F5-52`…`F5-54`): a question, or a call. Each
 * is their own words or their own consent, kept untouched; each raises a call task on the person
 * the page names, so the reply has an owner — and the page never shows an answer.
 */
@Injectable()
export class CustomerLinkAsksRepository {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TENANT_DB) private readonly db: TenantPool,
    @Inject(CustomerProjectsRegistry) private readonly projects: CustomerProjectsRegistry,
  ) {}

  /** A question (`F5-53`): the words as written, a timeline entry, a notice and a call task. */
  question(
    token: PresentedToken,
    text: string,
    notice: LinkNotice,
    window: MessagingWindow,
    now: number,
  ): Promise<LinkActOutcome> {
    const at = new Date(now);
    return this.db.withTenantTransaction(token.tenantId, async (tx) => {
      const held = await heldVisit(tx, token, this.projects, now);
      if (held === null) return gone();
      const { visit, locked } = held;
      const refusal = respondRefusal(visit, 'ask');
      if (refusal !== null || visit.serving.kind !== 'serves')
        return refused(refusal ?? 'link_off');
      const dueAt = new Date(callBackDueAt(now, locked.timeZone, window));
      const taskId =
        visit.person === null
          ? null
          : await raiseTask(tx, {
              tenantId: visit.tenantId,
              leadId: visit.leadId,
              assigneeUserId: visit.person.userId,
              kind: 'call',
              provenance: 'customer_question',
              dueAt,
              raisedBy: null,
              at,
            });
      await tx.insert(customerQuestion).values({
        tenantId: visit.tenantId,
        linkId: visit.linkId,
        leadId: visit.leadId,
        phase: visit.serving.phase,
        questionText: text,
        askedAt: at,
        taskId,
      });
      await recordActivity(tx, {
        ...leadOf(visit),
        kind: 'customer_question',
        body: { ...viaOf(visit), text },
        actor: customerActor(),
        capturedAt: at,
      });
      await wakeParked(tx, locked, at);
      const about = { kind: 'lead', ref: visit.leadId } as const;
      const notified = await notifyAbout(tx, visit, 'customer_question', about, notice, at);
      return { outcome: 'done', notified };
    });
  }

  /**
   * A call asked for (`F5-54`): the request is the customer's timestamped consent. A lead holds one
   * open call task for it — a second request moves that task — due at the time they named, or at
   * the next lawful moment.
   */
  callRequest(
    token: PresentedToken,
    namedAt: number | null,
    notice: LinkNotice,
    window: MessagingWindow,
    now: number,
  ): Promise<LinkActOutcome> {
    const at = new Date(now);
    return this.db.withTenantTransaction(token.tenantId, async (tx) => {
      const held = await heldVisit(tx, token, this.projects, now);
      if (held === null) return gone();
      const { visit, locked } = held;
      const refusal = respondRefusal(visit, 'ask');
      if (refusal !== null || visit.serving.kind !== 'serves')
        return refused(refusal ?? 'link_off');
      const consented = consentedCallTime(namedAt, now);
      const named = consented === null ? null : new Date(consented);
      const dueAt = new Date(callRequestDueAt(namedAt, now, locked.timeZone, window));
      await tx.insert(callbackRequest).values({
        tenantId: visit.tenantId,
        linkId: visit.linkId,
        leadId: visit.leadId,
        phase: visit.serving.phase,
        requestedAt: at,
        namedAt: named,
        dueAt,
        taskId: await callTask(tx, visit, dueAt, at),
      });
      await recordActivity(tx, {
        ...leadOf(visit),
        kind: 'customer_call_requested',
        body: {
          ...viaOf(visit),
          namedAt: named?.toISOString() ?? null,
          dueAt: dueAt.toISOString(),
        },
        actor: customerActor(),
        capturedAt: at,
      });
      await wakeParked(tx, locked, at);
      const about = { kind: 'lead', ref: visit.leadId } as const;
      const notified = await notifyAbout(tx, visit, 'customer_call_requested', about, notice, at);
      return { outcome: 'done', notified };
    });
  }
}

/** The lead's one open call task for a request: moved to the new moment, or raised (`F5-54`). */
async function callTask(
  tx: DbTransaction,
  visit: LinkVisit,
  dueAt: Date,
  at: Date,
): Promise<string | null> {
  if (visit.person === null) return null;
  const assigneeUserId = visit.person.userId;
  const open = await openTaskRaisedBy(tx, visit.tenantId, visit.leadId, ['customer_call_request']);
  if (open !== null) {
    await moveTaskDue(tx, visit.tenantId, open.id, { dueAt, assigneeUserId });
    return open.id;
  }
  return raiseTask(tx, {
    tenantId: visit.tenantId,
    leadId: visit.leadId,
    assigneeUserId,
    kind: 'call',
    provenance: 'customer_call_request',
    dueAt,
    raisedBy: null,
    at,
  });
}
