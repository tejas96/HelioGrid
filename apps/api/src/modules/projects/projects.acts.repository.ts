import { handoverPackWorkflow } from '@heliogrid/contracts/workflows';
import { type DbTransaction, type TenantPool, uuidv7 } from '@heliogrid/db';
import {
  type CalendarDate,
  type CancelWhy,
  decideCancel,
  decideDispatch,
  decideEarlyMove,
  decideHandover,
  decideMoveBack,
  decidePersonMove,
  decideUndo,
  type ProjectStage,
  provenStages,
  rowsWaitingForHandover,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { TENANT_DB } from '../../common/db/tenant.token';
import { recordOutboxEvent } from '../../common/temporal/outbox.repository';
import {
  type ActContext,
  movedAs,
  type ProjectActOutcome,
  refusedWith,
  type StepOutcome,
} from './projects.act-kit.repository';
import { loadProjectDetail } from './projects.detail.repository';
import {
  arrivalDayOf,
  type LockedProject,
  lastMoveOf,
  lockProjectInScope,
  proofFactsOf,
  standingOfLocked,
  todayOfLocked,
} from './projects.lock.repository';
import { isTheCrewToName } from './projects.people.repository';
import { markHandoverRowsDone, reopenWaitEndedBy, replaceCrew } from './projects.waits.repository';

/**
 * The project acts (`M08-14`, rulings 2026-11-10) on the runtime pool: the project is locked,
 * domain decides on what it finds, and every write — the move, its ledger row, the waits it
 * closes, its timeline entry, its notice — commits together, or a refusal writes nothing.
 */
@Injectable()
export class ProjectsActsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** Runs one act on the locked project and answers with the project as it now stands. */
  act(
    context: ActContext,
    projectId: string,
    run: (tx: DbTransaction, locked: LockedProject) => Promise<StepOutcome>,
  ): Promise<ProjectActOutcome> {
    const { reader, formats } = context;
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const locked = await lockProjectInScope(tx, reader, projectId);
      if (locked === null) return { outcome: 'not-found' };
      const result = await run(tx, locked);
      if (result.kind === 'refused') return { outcome: 'refused', refusal: result.refusal };
      // The lock proved the reader's reach; the act may end it (a manager handing the project on),
      // so the answer is read with that proven reach, not the reader's scope again.
      const detail = await loadProjectDetail(tx, reader, projectId, formats, 'proven');
      if (detail === null) throw new Error(`project ${projectId} vanished inside its own act`);
      return { outcome: 'done', detail, notified: result.notified, started: result.started };
    });
  }
}

/** A person's forward tap. */
export function moveTo(context: ActContext, to: ProjectStage) {
  return (tx: DbTransaction, locked: LockedProject) =>
    movedAs(tx, locked, context, decidePersonMove(standingOfLocked(locked), to));
}

/**
 * *Dispatched* with its crew and the day the material left: the move, then the crew it names —
 * every one on the installation team. A company with no one on that team yet dispatches with no
 * crew, never stuck at the stage.
 */
export function dispatchWith(context: ActContext, crew: readonly string[], leftOn: CalendarDate) {
  return async (tx: DbTransaction, locked: LockedProject) => {
    if (!(await isTheCrewToName(tx, locked.tenantId, crew))) return refusedWith('not_on_crew');
    const day = { leftOn, enteredOn: locked.enteredOn, today: todayOfLocked(locked, context.act) };
    const decided = decideDispatch(standingOfLocked(locked), day);
    const moved = await movedAs(tx, locked, context, decided, { enteredOn: leftOn });
    if (moved.kind === 'refused') return moved;
    await replaceCrew(tx, locked, crew, context);
    return moved;
  };
}

export function moveBack(context: ActContext, from: ProjectStage) {
  return (tx: DbTransaction, locked: LockedProject) =>
    movedAs(tx, locked, context, decideMoveBack(standingOfLocked(locked), from));
}

/**
 * A person's own last move taken back. The stage it returns to keeps the day it first began — an
 * undo is a slip mended, not a new arrival — so its days and the dispatch day it allows still hold.
 */
export function undoLast(context: ActContext) {
  return async (tx: DbTransaction, locked: LockedProject) => {
    const last = await lastMoveOf(tx, locked);
    const decided = decideUndo(
      standingOfLocked(locked),
      last,
      context.mover.userId,
      context.act.now,
    );
    if (decided.kind === 'refused' || last === null) {
      return refusedWith(decided.kind === 'refused' ? decided.refusal : 'not_undoable');
    }
    const began = await arrivalDayOf(tx, locked, decided.move.to);
    const undone = await movedAs(
      tx,
      locked,
      context,
      decided,
      began === null ? {} : { enteredOn: began },
    );
    // An undo leaves the project as it was before the move, the wait that move closed included.
    if (undone.kind !== 'refused') await reopenWaitEndedBy(tx, locked, new Date(last.at));
    return undone;
  };
}

/** The early proof's one tap: only to a stage the files on the project actually prove. */
export function confirmProof(context: ActContext, to: ProjectStage) {
  return async (tx: DbTransaction, locked: LockedProject) => {
    const facts = await proofFactsOf(tx, locked);
    const proven = provenStages(
      facts.documents.map((document) => ({
        ...document,
        movesTo:
          context.formats.documentChecklist.find((row) => row.row === document.row)?.movesTo ??
          null,
      })),
      facts.ticked,
      facts.total,
    ).find((one) => one.stage === to);
    if (proven === undefined) return refusedWith('no_proof_ahead');
    return movedAs(
      tx,
      locked,
      context,
      decideEarlyMove(standingOfLocked(locked), proven.stage, proven.proof),
    );
  };
}

export function cancelWith(context: ActContext, why: CancelWhy) {
  return (tx: DbTransaction, locked: LockedProject) =>
    movedAs(tx, locked, context, decideCancel(standingOfLocked(locked), why), { cancel: why });
}

/** Handover (`M08-32`): only with no row waiting on a person; the pack's own row is made here. */
export function handOver(context: ActContext) {
  return async (tx: DbTransaction, locked: LockedProject) => {
    const facts = await proofFactsOf(tx, locked);
    const pending = rowsWaitingForHandover(
      facts.documents.map((document) => ({
        ...document,
        madeBy:
          context.formats.documentChecklist.find((row) => row.row === document.row)?.madeBy ?? null,
      })),
    );
    const moved = await movedAs(
      tx,
      locked,
      context,
      decideHandover(standingOfLocked(locked), pending),
    );
    if (moved.kind === 'refused') return moved;
    await markHandoverRowsDone(tx, locked, context);
    // The pack is made after the commit (`handoverPackWorkflow`), never inside the handover.
    const eventId = uuidv7();
    await recordOutboxEvent(tx, locked.tenantId, handoverPackWorkflow, {
      eventId,
      tenantId: locked.tenantId,
      projectId: locked.projectId,
    });
    return { ...moved, started: [eventId] };
  };
}
