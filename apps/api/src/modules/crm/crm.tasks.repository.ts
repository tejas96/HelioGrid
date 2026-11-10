import type { Task, TaskKind } from '@heliogrid/contracts';
import { type DbTransaction, lead, type TenantPool, task, userAccount } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberNameOf } from './crm.lead-columns.repository';
import { lockLead, lockLeadInScope, personOf } from './crm.lead-lock.repository';
import { activeMemberOf } from './crm.member-roles.repository';
import { raiseTask } from './crm.raised-tasks.repository';
import { leadScopeWhere } from './crm.scope.repository';
import { recordActivity } from './crm.timeline.repository';
import type { LeadReader } from './internal/reader';

/** A task a person adds: its kind, when it falls due, a custom one's words, and whose it is. */
export interface TaskInput {
  readonly kind: TaskKind;
  readonly dueAt: Date;
  readonly title: string | null;
  readonly assigneeId: string | null;
}

export type TaskCreateOutcome =
  | Keyed<Task>
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'assignee-unavailable' }
  | { readonly outcome: 'not-diallable' };

export type TaskActOutcome =
  | { readonly outcome: 'done'; readonly task: Task }
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'cancelled' };

/**
 * Follow-up tasks on a lead (`M07-05`, RFC decision 8) on the runtime pool. A task goes to the
 * lead's owner unless a person is named, and only to an active member; a task is closed by
 * whoever holds it or may work its lead, and a cancelled one is history, never reopened.
 */
@Injectable()
export class CrmTasksRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async create(
    reader: LeadReader,
    leadId: string,
    input: TaskInput,
    act: Act,
    key: CreationKey | null,
  ): Promise<TaskCreateOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      if (key !== null) {
        await lockCreationKey(tx, key);
        const [made] = await tx
          .select({ id: task.id, fingerprint: task.creationFingerprint })
          .from(task)
          .where(and(eq(task.tenantId, tenantId), eq(task.creationKey, key.key)));
        if (made) return replayOf(await taskWireOf(tx, tenantId, made.id), made.fingerprint, key);
      }
      const target = await lockLeadInScope(tx, reader, leadId);
      if (target === null) return { outcome: 'not-found' };
      if (input.kind === 'call' && !target.canDial) return { outcome: 'not-diallable' };
      const assigneeId = input.assigneeId ?? target.lifecycle.ownerId ?? act.actorUserId;
      if ((await activeMemberOf(tx, tenantId, assigneeId)) === null) {
        return { outcome: 'assignee-unavailable' };
      }
      const id = await raiseTask(tx, {
        tenantId,
        leadId,
        assigneeUserId: assigneeId,
        kind: input.kind,
        title: input.title,
        provenance: 'manual',
        dueAt: input.dueAt,
        raisedBy: act.actorUserId,
        at: new Date(act.now),
        retryKey: key,
      });
      return { outcome: 'created', row: await taskWireOf(tx, tenantId, id) };
    });
  }

  /** Done (`M07-05`): the lead's timeline records it; a task already done answers as it stands. */
  async done(
    reader: LeadReader,
    taskId: string,
    capturedAt: Date,
    act: Act,
  ): Promise<TaskActOutcome> {
    return this.closeOrOpen(reader, taskId, async (tx, held) => {
      if (held.status !== 'open') return;
      await tx
        .update(task)
        .set({ status: 'done', doneAt: new Date(act.now), doneBy: act.actorUserId })
        .where(and(eq(task.tenantId, reader.tenantId), eq(task.id, taskId)));
      await recordActivity(tx, {
        tenantId: reader.tenantId,
        customerId: held.customerId,
        leadId: held.leadId,
        kind: 'task_done',
        body: { taskId, kind: held.kind, title: held.title },
        actor: personOf(act),
        capturedAt,
      });
    });
  }

  /** Reopen a done task: open again, and overdue once its due time has passed. */
  async reopen(reader: LeadReader, taskId: string): Promise<TaskActOutcome> {
    return this.closeOrOpen(reader, taskId, async (tx, held) => {
      if (held.status !== 'done') return;
      await tx
        .update(task)
        .set({ status: 'open', doneAt: null, doneBy: null })
        .where(and(eq(task.tenantId, reader.tenantId), eq(task.id, taskId)));
    });
  }

  /**
   * The task locked for its act, when the reader holds it or may work its lead; a cancelled task
   * is answered as such and never changed. Its lead is locked first (`lockLead`'s order): an act on
   * the lead — a hand-over, a wrong number — locks the lead and then changes its tasks.
   */
  private closeOrOpen(
    reader: LeadReader,
    taskId: string,
    change: (tx: DbTransaction, held: HeldTask) => Promise<void>,
  ): Promise<TaskActOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [onLead] = await tx
        .select({ leadId: task.leadId })
        .from(task)
        .where(and(eq(task.tenantId, tenantId), eq(task.id, taskId)));
      if (onLead === undefined || onLead.leadId === null) return { outcome: 'not-found' };
      await lockLead(tx, tenantId, onLead.leadId);
      const [held] = await tx
        .select({
          leadId: task.leadId,
          customerId: lead.customerId,
          kind: task.kind,
          title: task.title,
          status: task.status,
        })
        .from(task)
        .innerJoin(lead, and(eq(lead.id, task.leadId), eq(lead.tenantId, task.tenantId)))
        .where(
          and(
            eq(task.tenantId, tenantId),
            eq(task.id, taskId),
            or(
              eq(task.assigneeUserId, reader.actorId),
              leadScopeWhere(reader.scope, reader.actorId),
            ),
          ),
        )
        .for('update', { of: task });
      if (held === undefined || held.leadId === null) return { outcome: 'not-found' };
      if (held.status === 'cancelled') return { outcome: 'cancelled' };
      await change(tx, { ...held, leadId: held.leadId });
      return { outcome: 'done', task: await taskWireOf(tx, tenantId, taskId) };
    });
  }
}

interface HeldTask {
  readonly leadId: string;
  readonly customerId: string;
  readonly kind: TaskKind;
  readonly title: string | null;
  readonly status: Task['status'];
}

/** One task as the wire states it, read on the caller's transaction. */
export async function taskWireOf(
  tx: DbTransaction,
  tenantId: string,
  taskId: string,
): Promise<Task> {
  const [row] = await tx
    .select({
      id: task.id,
      leadId: task.leadId,
      kind: task.kind,
      title: task.title,
      status: task.status,
      dueAt: task.dueAt,
      assigneeId: task.assigneeUserId,
      assigneeName: memberNameOf(userAccount),
      provenance: task.provenance,
      doneAt: task.doneAt,
    })
    .from(task)
    .innerJoin(userAccount, eq(userAccount.id, task.assigneeUserId))
    .where(and(eq(task.tenantId, tenantId), eq(task.id, taskId)));
  if (row === undefined || row.leadId === null) {
    throw new Error(`task ${taskId} is not a lead's task in its own company`);
  }
  return {
    id: row.id,
    leadId: row.leadId,
    kind: row.kind,
    title: row.title,
    status: row.status,
    dueAt: row.dueAt.toISOString(),
    assignee: { userId: row.assigneeId, name: row.assigneeName ?? '' },
    provenance: row.provenance,
    doneAt: row.doneAt?.toISOString() ?? null,
  };
}
