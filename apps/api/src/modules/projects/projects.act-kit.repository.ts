import type { ProjectDetail } from '@heliogrid/contracts';
import type { DbTransaction } from '@heliogrid/db';
import {
  decideProof,
  type FormatPack,
  type ProjectActRefusal,
  type ProjectChainStage,
  type ProjectMoveResult,
  stepsProve,
} from '@heliogrid/domain';
import type { Act } from '../../common/auth/session-context';
import type { ProjectReader } from './internal/reader';
import { type LockedProject, proofFactsOf, standingOfLocked } from './projects.lock.repository';
import {
  applyMove,
  type MoveExtras,
  type MoveNotice,
  type Mover,
} from './projects.moves.repository';

/*
 * What every project act is built from: its context, its outcome, a decided move written as the
 * person's, and proof's own move — shared by the stage acts and the work beside the stage.
 */

/** What one act wrote: the notices for their push, or the reason it was refused. */
export type StepOutcome =
  | {
      readonly kind: 'done';
      readonly notified: readonly string[];
      /** Outbox events the act wrote, started after its commit. */
      readonly started: readonly string[];
    }
  | { readonly kind: 'refused'; readonly refusal: ProjectActRefusal };

/** One act: what it writes on the locked project, built from the act's context. */
export type ProjectStep = (
  context: ActContext,
) => (tx: DbTransaction, locked: LockedProject) => Promise<StepOutcome>;

export type ProjectActOutcome =
  | {
      readonly outcome: 'done';
      readonly detail: ProjectDetail;
      readonly notified: readonly string[];
      readonly started: readonly string[];
    }
  | { readonly outcome: 'refused'; readonly refusal: ProjectActRefusal }
  | { readonly outcome: 'not-found' };

/** Everything an act needs besides its own body: who, when, the pack, the notice. */
export interface ActContext {
  readonly reader: ProjectReader;
  readonly act: Act;
  readonly capturedAt: Date;
  readonly formats: FormatPack;
  readonly notice: MoveNotice;
  readonly mover: Extract<Mover, { kind: 'person' }>;
}

export const done = (notified: readonly string[] = []): StepOutcome => ({
  kind: 'done',
  notified,
  started: [],
});
export const refusedWith = (refusal: ProjectActRefusal): StepOutcome => ({
  kind: 'refused',
  refusal,
});

/** A decided move written as the person's, or its refusal. */
export async function movedAs(
  tx: DbTransaction,
  locked: LockedProject,
  context: ActContext,
  result: ProjectMoveResult,
  extras: MoveExtras = {},
): Promise<StepOutcome> {
  if (result.kind === 'refused') return refusedWith(result.refusal);
  const applied = await applyMove(
    tx,
    locked,
    result.move,
    context.mover,
    { now: new Date(context.act.now), capturedAt: context.capturedAt },
    context.notice,
    extras,
  );
  return done(applied.notified);
}

/**
 * Proof landed — a tick or a document: the project moves when it stands directly before what the
 * proof shows, and otherwise waits for the one tap *Proof came early* asks (ruling 2026-11-10).
 */
export async function moveByProof(
  tx: DbTransaction,
  locked: LockedProject,
  context: ActContext,
  target: { readonly stage: ProjectChainStage; readonly proof: string } | null,
): Promise<readonly string[]> {
  if (target === null) return [];
  const outcome = decideProof(standingOfLocked(locked), target.stage, target.proof);
  if (outcome.kind !== 'moved') return [];
  const applied = await applyMove(
    tx,
    locked,
    outcome.move,
    { kind: 'proof', causedBy: context.mover.userId },
    { now: new Date(context.act.now), capturedAt: context.capturedAt },
    context.notice,
  );
  return applied.notified;
}

/** What the ticks on file prove now. */
export async function stepsProof(tx: DbTransaction, locked: LockedProject) {
  const facts = await proofFactsOf(tx, locked);
  return stepsProve(facts.ticked, facts.total);
}
