import {
  type DbTransaction,
  projectBlocker,
  projectCrewMember,
  projectDocument,
} from '@heliogrid/db';
import { decideWaitEnd, decideWaitStart, type WaitToStart } from '@heliogrid/domain';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { recordActivity } from '../crm/crm.public';
import {
  type ActContext,
  done,
  refusedWith,
  type StepOutcome,
} from './projects.act-kit.repository';
import { type LockedProject, standingOfLocked, todayOfLocked } from './projects.lock.repository';

/*
 * The work beside the stage that is the manager's (`M08-20`…`M08-29`, rulings 2026-11-10): the
 * crew, the waits, the handover's own rows and the project's own facts — each written on the act's
 * locked project with its timeline entry.
 */

const atOf = (context: ActContext) => new Date(context.act.now);

/** Every row of one project's crew. */
export const crewOf = (locked: LockedProject) =>
  and(
    eq(projectCrewMember.tenantId, locked.tenantId),
    eq(projectCrewMember.projectId, locked.projectId),
  );

export function entryBase(locked: LockedProject, context: ActContext) {
  return {
    tenantId: locked.tenantId,
    customerId: locked.customerId,
    leadId: locked.leadId,
    actor: { kind: 'person', userId: context.mover.userId } as const,
    capturedAt: context.capturedAt,
  };
}

/** The crew named at *Dispatched*: the pick replaces whoever was on it. */
export async function replaceCrew(
  tx: DbTransaction,
  locked: LockedProject,
  crew: readonly string[],
  context: ActContext,
): Promise<void> {
  // A new pick replaces the crew; its lead keeps the mark where the pick still names them (`F5-68`).
  const [led] = await tx
    .select({ userId: projectCrewMember.userId })
    .from(projectCrewMember)
    .where(and(crewOf(locked), eq(projectCrewMember.isLead, true)));
  await tx.delete(projectCrewMember).where(crewOf(locked));
  const named = [...new Set(crew)];
  if (named.length > 0) {
    await tx.insert(projectCrewMember).values(
      named.map((userId) => ({
        tenantId: locked.tenantId,
        projectId: locked.projectId,
        userId,
        addedAt: atOf(context),
        addedBy: context.mover.userId,
        isLead: userId === led?.userId,
      })),
    );
  }
  await recordActivity(tx, {
    ...entryBase(locked, context),
    kind: 'project_changed',
    body: { projectId: locked.projectId, field: 'crew' },
  });
}

/**
 * Undo of the move that closed a wait opens that wait again, as it was — unless a new one has been
 * opened since: a project waits on one party at a time, and the newer wait is the truer one.
 */
export async function reopenWaitEndedBy(
  tx: DbTransaction,
  locked: LockedProject,
  movedAt: Date,
): Promise<void> {
  const ofProject = and(
    eq(projectBlocker.tenantId, locked.tenantId),
    eq(projectBlocker.projectId, locked.projectId),
  );
  const [open] = await tx
    .select({ id: projectBlocker.id })
    .from(projectBlocker)
    .where(and(ofProject, isNull(projectBlocker.endedAt)))
    .limit(1);
  if (open !== undefined) return;
  await tx
    .update(projectBlocker)
    .set({ endedAt: null, endedBy: null, endedAs: null })
    .where(
      and(
        ofProject,
        eq(projectBlocker.endedAt, movedAt),
        inArray(projectBlocker.endedAs, ['stage_move', 'cancel']),
      ),
    );
}

/** The rows handover itself makes — the pack — done as it hands over. */
export async function markHandoverRowsDone(
  tx: DbTransaction,
  locked: LockedProject,
  context: ActContext,
): Promise<void> {
  const rows = context.formats.documentChecklist
    .filter((row) => row.madeBy === 'handover')
    .map((row) => row.row);
  if (rows.length === 0) return;
  await tx
    .update(projectDocument)
    .set({ state: 'done', reason: null, changedAt: atOf(context), changedBy: null })
    .where(
      and(
        eq(projectDocument.tenantId, locked.tenantId),
        eq(projectDocument.projectId, locked.projectId),
        inArray(projectDocument.rowKey, rows),
      ),
    );
}

/** A wait starts: one at a time, a reason of its party, never a day ahead (`M08-21`). */
export function startWait(context: ActContext, wait: WaitToStart, note: string | null) {
  return async (tx: DbTransaction, locked: LockedProject): Promise<StepOutcome> => {
    const [open] = await tx
      .select({ id: projectBlocker.id })
      .from(projectBlocker)
      .where(openWaitOf(locked));
    const refusal = decideWaitStart(
      standingOfLocked(locked),
      wait,
      open !== undefined,
      todayOfLocked(locked, context.act),
    );
    if (refusal !== null) return refusedWith(refusal);
    await tx.insert(projectBlocker).values({
      tenantId: locked.tenantId,
      projectId: locked.projectId,
      party: wait.party,
      reason: wait.reason,
      note,
      startedOn: wait.startedOn,
      openedAt: atOf(context),
      openedBy: context.mover.userId,
    });
    await recordActivity(tx, {
      ...entryBase(locked, context),
      kind: 'project_wait',
      body: { projectId: locked.projectId, ...wait, ended: null },
    });
    return done();
  };
}

/** *The wait is over*: who ended it and when are recorded (`M08-21`). */
export function endWait(context: ActContext) {
  return async (tx: DbTransaction, locked: LockedProject): Promise<StepOutcome> => {
    const ended = await tx
      .update(projectBlocker)
      .set({ endedAt: atOf(context), endedBy: context.mover.userId, endedAs: 'person' })
      .where(openWaitOf(locked))
      .returning({
        party: projectBlocker.party,
        reason: projectBlocker.reason,
        startedOn: projectBlocker.startedOn,
      });
    const refusal = decideWaitEnd(ended.length > 0);
    if (refusal !== null) return refusedWith(refusal);
    for (const wait of ended) {
      await recordActivity(tx, {
        ...entryBase(locked, context),
        kind: 'project_wait',
        body: { projectId: locked.projectId, ...wait, ended: 'person' },
      });
    }
    return done();
  };
}

function openWaitOf(locked: LockedProject) {
  return and(
    eq(projectBlocker.tenantId, locked.tenantId),
    eq(projectBlocker.projectId, locked.projectId),
    isNull(projectBlocker.endedAt),
  );
}
