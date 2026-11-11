import {
  type DbTransaction,
  file,
  projectDocument,
  projectFile,
  projectInstallStep,
} from '@heliogrid/db';
import {
  decideNotNeeded,
  isClosedStage,
  type ProjectActRefusal,
  type ProjectChainStage,
  type ProjectFileSlot,
} from '@heliogrid/domain';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { recordActivity } from '../crm/crm.public';
import {
  type ActContext,
  done,
  moveByProof,
  refusedWith,
  type StepOutcome,
  stepsProof,
} from './projects.act-kit.repository';
import { type LockedProject, standingOfLocked } from './projects.lock.repository';

/*
 * The papers and the ticks (`M08-30`…`M08-45`, rulings 2026-11-10): checklist rows, files on the
 * project and install steps. A document or a tick that proves a stage moves it in the same write.
 */

const atOf = (context: ActContext) => new Date(context.act.now);

function entryBase(locked: LockedProject, context: ActContext) {
  return {
    tenantId: locked.tenantId,
    customerId: locked.customerId,
    leadId: locked.leadId,
    actor: { kind: 'person', userId: context.mover.userId } as const,
    capturedAt: context.capturedAt,
  };
}

function rowOf(locked: LockedProject, row: string) {
  return and(
    eq(projectDocument.tenantId, locked.tenantId),
    eq(projectDocument.projectId, locked.projectId),
    eq(projectDocument.rowKey, row),
  );
}

/** *Not needed* on a row, with its reason. */
export function documentNotNeeded(context: ActContext, row: string, reason: string) {
  return async (tx: DbTransaction, locked: LockedProject): Promise<StepOutcome> => {
    const refusal = decideNotNeeded(standingOfLocked(locked), reason);
    if (refusal !== null) return refusedWith(refusal);
    const changed = await tx
      .update(projectDocument)
      .set({
        state: 'not_needed',
        reason,
        changedAt: atOf(context),
        changedBy: context.mover.userId,
      })
      .where(and(rowOf(locked, row), eq(projectDocument.state, 'pending')))
      .returning({ row: projectDocument.rowKey });
    if (changed.length === 0) return refusedWith(await unchangedRowRefusal(tx, locked, row));
    await recordActivity(tx, {
      ...entryBase(locked, context),
      kind: 'project_document',
      body: { projectId: locked.projectId, row, state: 'not_needed', fileName: null },
    });
    return done();
  };
}

/** A row marked not needed by mistake goes back to waiting. */
export function documentReopen(context: ActContext, row: string) {
  return async (tx: DbTransaction, locked: LockedProject): Promise<StepOutcome> => {
    if (isClosedStage(locked.stage)) return refusedWith('project_closed');
    const changed = await tx
      .update(projectDocument)
      .set({
        state: 'pending',
        reason: null,
        changedAt: atOf(context),
        changedBy: context.mover.userId,
      })
      .where(and(rowOf(locked, row), eq(projectDocument.state, 'not_needed')))
      .returning({ row: projectDocument.rowKey });
    if (changed.length === 0) return refusedWith(await unchangedRowRefusal(tx, locked, row));
    await recordActivity(tx, {
      ...entryBase(locked, context),
      kind: 'project_document',
      body: { projectId: locked.projectId, row, state: 'pending', fileName: null },
    });
    return done();
  };
}

/** A stored file put on the project; a row's document makes the row done, and may prove a stage. */
export function attachFile(
  context: ActContext,
  attach: { fileId: string; slot: ProjectFileSlot; slotKey: string | null; name: string },
) {
  return async (tx: DbTransaction, locked: LockedProject): Promise<StepOutcome> => {
    if (isClosedStage(locked.stage)) return refusedWith('project_closed');
    const placed = await placeOf(tx, locked, context, attach);
    if ('refusal' in placed) return refusedWith(placed.refusal);
    const { slotKey } = placed;
    await tx.insert(projectFile).values({
      tenantId: locked.tenantId,
      projectId: locked.projectId,
      fileId: attach.fileId,
      slot: attach.slot,
      slotKey,
      name: attach.name,
      addedAt: atOf(context),
      addedBy: context.mover.userId,
    });
    if (attach.slot !== 'document' || slotKey === null) return done();
    return done(await documentLanded(tx, locked, context, slotKey, attach.name));
  };
}

/** Where the file goes — a row, a step, or with the other files — or why it cannot go there. */
async function placeOf(
  tx: DbTransaction,
  locked: LockedProject,
  context: ActContext,
  attach: { fileId: string; slot: ProjectFileSlot; slotKey: string | null },
): Promise<{ slotKey: string | null } | { refusal: ProjectActRefusal }> {
  if (attach.slot !== 'other' && attach.slotKey === null) return { refusal: 'row_unknown' };
  if (!(await isUploadedFor(tx, locked, attach.fileId))) return { refusal: 'file_not_ready' };
  if (attach.slot === 'other' || attach.slotKey === null) return { slotKey: null };
  if (attach.slot === 'document' && isMadeAtHandover(context, attach.slotKey)) {
    return { refusal: 'made_at_handover' };
  }
  const refusal = await placeRefusalOf(tx, locked, context, attach.slot, attach.slotKey);
  return refusal === null ? { slotKey: attach.slotKey } : { refusal };
}

/** The row handover itself fills — its pack (ruling 2026-11-10); no person puts a file on it. */
function isMadeAtHandover(context: ActContext, row: string): boolean {
  return context.formats.documentChecklist.find((one) => one.row === row)?.madeBy === 'handover';
}

/** The file finished uploading, and it was stored for this project — never another's. */
async function isUploadedFor(
  tx: DbTransaction,
  locked: LockedProject,
  fileId: string,
): Promise<boolean> {
  const [stored] = await tx
    .select({ id: file.id })
    .from(file)
    .where(
      and(
        eq(file.tenantId, locked.tenantId),
        eq(file.id, fileId),
        eq(file.subjectKind, 'project'),
        eq(file.subjectRef, locked.projectId),
        isNotNull(file.uploadedAt),
      ),
    );
  return stored !== undefined;
}

/** Where the file goes must be the project's own: a step it has, or a row — which it makes done. */
async function placeRefusalOf(
  tx: DbTransaction,
  locked: LockedProject,
  context: ActContext,
  slot: 'document' | 'step',
  slotKey: string,
): Promise<ProjectActRefusal | null> {
  if (slot === 'step') {
    const [step] = await tx
      .select({ id: projectInstallStep.id })
      .from(projectInstallStep)
      .where(stepOf(locked, slotKey));
    return step === undefined ? 'step_unknown' : null;
  }
  const changed = await tx
    .update(projectDocument)
    .set({ state: 'done', reason: null, changedAt: atOf(context), changedBy: context.mover.userId })
    .where(rowOf(locked, slotKey))
    .returning({ row: projectDocument.rowKey });
  return changed.length === 0 ? 'row_unknown' : null;
}

/** A row's document landed: the timeline says so, and the row may prove its stage. */
async function documentLanded(
  tx: DbTransaction,
  locked: LockedProject,
  context: ActContext,
  row: string,
  fileName: string,
) {
  await recordActivity(tx, {
    ...entryBase(locked, context),
    kind: 'project_document',
    body: { projectId: locked.projectId, row, state: 'done', fileName },
  });
  const movesTo = context.formats.documentChecklist.find(
    (declared) => declared.row === row,
  )?.movesTo;
  const target = movesTo === undefined ? null : { stage: movesTo as ProjectChainStage, proof: row };
  return moveByProof(tx, locked, context, target);
}

/**
 * Why a row did not change: the project has no such row, or another person changed it first —
 * the second of two taps on one screen.
 */
async function unchangedRowRefusal(
  tx: DbTransaction,
  locked: LockedProject,
  row: string,
): Promise<ProjectActRefusal> {
  const [found] = await tx
    .select({ row: projectDocument.rowKey })
    .from(projectDocument)
    .where(rowOf(locked, row));
  return found === undefined ? 'row_unknown' : 'already_moved';
}

/** *Show to customer* on an other file — never on a closed project, whose pack is made. */
export function showFile(context: ActContext, projectFileId: string, shown: boolean) {
  return async (tx: DbTransaction, locked: LockedProject): Promise<StepOutcome> => {
    if (isClosedStage(locked.stage)) return refusedWith('project_closed');
    const changed = await tx
      .update(projectFile)
      .set({ shownToCustomer: shown })
      .where(
        and(
          eq(projectFile.tenantId, locked.tenantId),
          eq(projectFile.projectId, locked.projectId),
          eq(projectFile.id, projectFileId),
          eq(projectFile.slot, 'other'),
        ),
      )
      .returning({ id: projectFile.id });
    if (changed.length === 0) return refusedWith('file_unknown');
    await recordActivity(tx, {
      ...entryBase(locked, context),
      kind: 'project_changed',
      body: { projectId: locked.projectId, field: 'file_shown' },
    });
    return done();
  };
}

function stepOf(locked: LockedProject, step: string) {
  return and(
    eq(projectInstallStep.tenantId, locked.tenantId),
    eq(projectInstallStep.projectId, locked.projectId),
    eq(projectInstallStep.stepKey, step),
  );
}

/** A tick, named for the ticker (`M08-42`); the first and the last move the project. */
export function tickStep(context: ActContext, step: string, doneBy: string | null) {
  return async (tx: DbTransaction, locked: LockedProject): Promise<StepOutcome> => {
    if (isClosedStage(locked.stage)) return refusedWith('project_closed');
    const [known] = await tx
      .select({ id: projectInstallStep.id })
      .from(projectInstallStep)
      .where(stepOf(locked, step));
    if (known === undefined) return refusedWith('step_unknown');
    const ticked = await tx
      .update(projectInstallStep)
      .set({ tickedAt: atOf(context), tickedBy: context.mover.userId, doneBy })
      .where(and(stepOf(locked, step), isNull(projectInstallStep.tickedAt)))
      .returning({ id: projectInstallStep.id });
    if (ticked.length === 0) return refusedWith('step_ticked');
    await recordActivity(tx, {
      ...entryBase(locked, context),
      kind: 'project_step',
      body: { projectId: locked.projectId, step, ticked: true, doneBy },
    });
    return done(await moveByProof(tx, locked, context, await stepsProof(tx, locked)));
  };
}

/** A tick taken back; it moves no stage back — a person does that. */
export function untickStep(context: ActContext, step: string) {
  return async (tx: DbTransaction, locked: LockedProject): Promise<StepOutcome> => {
    if (isClosedStage(locked.stage)) return refusedWith('project_closed');
    const unticked = await tx
      .update(projectInstallStep)
      .set({ tickedAt: null, tickedBy: null, doneBy: null })
      .where(and(stepOf(locked, step), isNotNull(projectInstallStep.tickedAt)))
      .returning({ id: projectInstallStep.id });
    if (unticked.length === 0) return refusedWith('step_not_ticked');
    await recordActivity(tx, {
      ...entryBase(locked, context),
      kind: 'project_step',
      body: { projectId: locked.projectId, step, ticked: false, doneBy: null },
    });
    return done();
  };
}
