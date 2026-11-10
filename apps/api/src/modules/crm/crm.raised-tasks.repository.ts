import { type DbTransaction, task, tenant } from '@heliogrid/db';
import {
  callBackDueAt,
  type MessagingWindow,
  type TaskKind,
  type TaskProvenance,
} from '@heliogrid/domain';
import { and, eq, inArray } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import type { CreationKey } from '../../common/creation-key';

/*
 * The follow-up tasks a rule or a person raises on a lead (`M07-05`), written on the
 * CALLER's transaction so a task commits with the act that raised it. A task lands on a named person,
 * never a pool (`M07-06`); overdue is derived from `due_at` and never stored.
 */

/** One task to write: whose, what, when it falls due, and the rule or person that raised it. */
export interface TaskToRaise {
  readonly tenantId: string;
  readonly leadId: string;
  readonly assigneeUserId: string;
  readonly kind: TaskKind;
  readonly provenance: TaskProvenance;
  readonly dueAt: Date;
  /** A custom task's words. */
  readonly title?: string | null;
  /** The person whose act raised it; `null` when a rule did with no person behind it (the sweep). */
  readonly raisedBy: string | null;
  readonly at: Date;
  readonly retryKey?: CreationKey | null;
}

/** Writes one open task and answers its id. */
export async function raiseTask(tx: DbTransaction, raised: TaskToRaise): Promise<string> {
  const [written] = await tx
    .insert(task)
    .values({
      tenantId: raised.tenantId,
      leadId: raised.leadId,
      assigneeUserId: raised.assigneeUserId,
      kind: raised.kind,
      title: raised.title ?? null,
      dueAt: raised.dueAt,
      status: 'open',
      provenance: raised.provenance,
      createdAt: raised.at,
      createdBy: raised.raisedBy,
      creationKey: raised.retryKey?.key,
      creationFingerprint: raised.retryKey?.fingerprint,
    })
    .returning({ id: task.id });
  if (written === undefined) throw new Error('the task insert returned no row');
  return written.id;
}

/** A call-back the clock may hold: the lead, its holder, when it was raised and the window. */
export interface CallBack {
  readonly tenantId: string;
  readonly leadId: string;
  readonly assigneeUserId: string;
  readonly raisedBy: string;
  readonly at: Date;
  readonly timeZone: string;
  readonly window: MessagingWindow;
}

/**
 * A lead captured outside the market's calling window (`M02-15`): its first call-back waits for the
 * window's next opening, due then and never earlier. Captured inside it, the lead is called from
 * the inbox now, so no task is raised — one due at once would be overdue the moment it was written.
 */
async function raiseCallBackOutsideWindow(tx: DbTransaction, callBack: CallBack): Promise<void> {
  const raisedAt = callBack.at.getTime();
  const due = callBackDueAt(raisedAt, callBack.timeZone, callBack.window);
  if (due === raisedAt) return;
  await raiseTask(tx, {
    ...callBack,
    kind: 'call',
    provenance: 'call_back_window',
    dueAt: new Date(due),
  });
}

/**
 * The capture's hook (`M02-15`): the new lead has no owner yet, so its first call-back goes to the
 * person who took the enquiry — the one colleague who has spoken to the customer.
 */
export async function raiseFirstCallBack(
  tx: DbTransaction,
  captured: {
    readonly tenantId: string;
    readonly leadId: string;
    readonly act: Act;
    readonly window: MessagingWindow;
  },
): Promise<void> {
  const [company] = await tx
    .select({ timeZone: tenant.timezone })
    .from(tenant)
    .where(eq(tenant.id, captured.tenantId));
  if (company === undefined) throw new Error(`no company ${captured.tenantId} to call back for`);
  await raiseCallBackOutsideWindow(tx, {
    tenantId: captured.tenantId,
    leadId: captured.leadId,
    assigneeUserId: captured.act.actorUserId,
    raisedBy: captured.act.actorUserId,
    at: new Date(captured.act.now),
    timeZone: company.timeZone,
    window: captured.window,
  });
}

/**
 * The one retry an unanswered call schedules (`M02-43`), due at the next moment inside the calling
 * window: a retry still open is moved to that moment rather than joined by a second, so a lead
 * never holds two retries at once.
 */
export async function keepOneRetry(tx: DbTransaction, callBack: CallBack): Promise<void> {
  const dueAt = new Date(callBackDueAt(callBack.at.getTime(), callBack.timeZone, callBack.window));
  const moved = await tx
    .update(task)
    .set({ dueAt, assigneeUserId: callBack.assigneeUserId })
    .where(
      and(
        eq(task.tenantId, callBack.tenantId),
        eq(task.leadId, callBack.leadId),
        eq(task.provenance, 'retry_after_no_answer'),
        eq(task.status, 'open'),
      ),
    )
    .returning({ id: task.id });
  if (moved.length > 0) return;
  await raiseTask(tx, { ...callBack, kind: 'call', provenance: 'retry_after_no_answer', dueAt });
}

/**
 * Cancels the open tasks of these kinds on these leads — a dial no surface may offer any more
 * (`M02-44`), a visit a reschedule replaced. A cancelled task is kept as history, never deleted.
 */
export async function cancelOpenTasks(
  tx: DbTransaction,
  tenantId: string,
  leadIds: readonly string[],
  kinds: readonly TaskKind[],
): Promise<void> {
  if (leadIds.length === 0) return;
  await tx
    .update(task)
    .set({ status: 'cancelled' })
    .where(
      and(
        eq(task.tenantId, tenantId),
        inArray(task.leadId, [...leadIds]),
        inArray(task.kind, [...kinds]),
        eq(task.status, 'open'),
      ),
    );
}

/** The tasks that are the lead holder's own work; a site visit is its surveyor's. */
const FOLLOWS_THE_OWNER = ['call', 'follow_up'] as const satisfies readonly TaskKind[];

/**
 * The work an assignment hands over with the lead: the open calls and follow-ups its holder kept
 * for it move to the new owner, so none is left with a person who no longer holds the lead. A site
 * visit stays with its surveyor, and a custom task with the person it was written for.
 */
export async function handOverOpenTasks(
  tx: DbTransaction,
  handOver: {
    readonly tenantId: string;
    readonly leadId: string;
    readonly fromUserId: string;
    readonly toUserId: string;
  },
): Promise<void> {
  const { tenantId, leadId, fromUserId, toUserId } = handOver;
  if (fromUserId === toUserId) return;
  await tx
    .update(task)
    .set({ assigneeUserId: toUserId })
    .where(
      and(
        eq(task.tenantId, tenantId),
        eq(task.leadId, leadId),
        eq(task.assigneeUserId, fromUserId),
        eq(task.status, 'open'),
        inArray(task.kind, [...FOLLOWS_THE_OWNER]),
      ),
    );
}
