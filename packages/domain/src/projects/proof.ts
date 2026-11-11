import type { CalendarDate } from '../format/holidays';
import { chainIndexOf, chainOf, isClosedStage, type ProjectStanding } from './machine';
import { PROJECT_STAGE_CHAIN, type ProjectChainStage } from './stages';
import type { DocumentState } from './vocabulary';

/**
 * What proves a stage (owner ruling 2026-11-10): the first install step ticked proves
 * Installation, the last one Electrical metering, and a checklist row the pack marks `movesTo`
 * proves its stage once its document is in. Proof is read from what is on file, never stored as a
 * second fact — a proof that is ahead of the project is what *Proof came early* asks about.
 */

/** The step key a tick moves on as, when the move names its proof. */
export const FIRST_STEP_PROOF = 'first_install_step';
export const LAST_STEP_PROOF = 'last_install_step';

/** What the ticks on file prove, or null with none ticked. */
export function stepsProve(
  ticked: number,
  total: number,
): { readonly stage: ProjectChainStage; readonly proof: string } | null {
  if (total <= 0 || ticked <= 0) return null;
  if (ticked >= total) return { stage: 'electrical_metering', proof: LAST_STEP_PROOF };
  return { stage: 'installation', proof: FIRST_STEP_PROOF };
}

/** A checklist row as proof reads it: its key, its state, and the stage it proves, if any. */
export interface ProofRow {
  readonly row: string;
  readonly state: DocumentState;
  readonly movesTo: string | null;
}

function isChainStage(value: string | null): value is ProjectChainStage {
  return value !== null && (PROJECT_STAGE_CHAIN as readonly string[]).includes(value);
}

/** Every stage the project's files prove, with the proof that shows it. */
export function provenStages(
  rows: readonly ProofRow[],
  stepsTicked: number,
  stepsTotal: number,
): readonly { readonly stage: ProjectChainStage; readonly proof: string }[] {
  const steps = stepsProve(stepsTicked, stepsTotal);
  const documents = rows.flatMap((row) =>
    row.state === 'done' && isChainStage(row.movesTo)
      ? [{ stage: row.movesTo, proof: row.row }]
      : [],
  );
  return steps === null ? documents : [steps, ...documents];
}

/**
 * The farthest stage on file that the project has not reached — what *Proof came early* offers one
 * tap to move to — or null. A closed project and handover itself never ask.
 */
export function earlyProofOf(
  standing: ProjectStanding,
  proven: readonly { readonly stage: ProjectChainStage; readonly proof: string }[],
): { readonly stage: ProjectChainStage; readonly proof: string } | null {
  if (isClosedStage(standing.stage)) return null;
  const chain = chainOf(standing);
  const ahead = proven.filter(
    (one) =>
      one.stage !== 'handed_over' &&
      chain.includes(one.stage) &&
      chainIndexOf(one.stage) > chainIndexOf(standing.stage),
  );
  return ahead.reduce<(typeof ahead)[number] | null>(
    (far, one) => (far === null || chainIndexOf(one.stage) > chainIndexOf(far.stage) ? one : far),
    null,
  );
}

/**
 * A stage reached without its proof — moved by hand past a row that proves it, the row still
 * waiting — as the first such row, or null. A cancelled project asks for nothing.
 */
export function missingProofOf(
  standing: ProjectStanding,
  rows: readonly ProofRow[],
): string | null {
  if (standing.stage === 'cancelled') return null;
  const missing = rows.find(
    (row) =>
      row.state === 'pending' &&
      isChainStage(row.movesTo) &&
      chainIndexOf(row.movesTo) <= chainIndexOf(standing.stage),
  );
  return missing?.row ?? null;
}

/**
 * The promise missed (`M07-62`, ruling 2026-11-10): the expected install date is behind the
 * company's today and the crew has not started.
 */
export function isInstallDatePassed(
  standing: ProjectStanding,
  expectedInstallOn: CalendarDate | null,
  today: CalendarDate,
): boolean {
  if (expectedInstallOn === null || isClosedStage(standing.stage)) return false;
  return expectedInstallOn < today && chainIndexOf(standing.stage) < chainIndexOf('installation');
}
