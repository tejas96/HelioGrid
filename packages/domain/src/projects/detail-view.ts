import type { CalendarDate } from '../format/holidays';
import { chainIndexOf, chainOf, isClosedStage, nextStageOf } from './machine';
import { PROJECT_STAGE_CHAIN, type ProjectChainStage, type ProjectStage } from './stages';
import { daysFrom } from './waits';

/**
 * One project as both platforms draw it (`SCR-M08-02`, rulings 2026-11-10): the days it has stood
 * where it is — the hero's figure — the one next step and what moves it on, the journey with its
 * dates and who or what moved each stage, and the checklist counted. A stage the deal does not walk
 * shows as passed over, never removed (`M08-09`).
 */

/** The project as the detail reads it — the wire's detail, by shape. */
export interface DetailFacts {
  readonly stage: string;
  readonly enteredOn: CalendarDate;
  readonly today: CalendarDate;
  readonly incentiveApplies: boolean;
  readonly todo: string | null;
  readonly earlyProofTo: string | null;
  readonly missingProofRow: string | null;
  readonly journey: readonly {
    readonly from: string | null;
    readonly to: string;
    readonly cause: string;
    readonly proof: string | null;
    readonly movedAt: string;
    /** The company day the stage began — the day the person gave, else the day it was recorded. */
    readonly enteredOn: CalendarDate;
    readonly movedBy: { readonly userId: string; readonly name: string } | null;
  }[];
  readonly documents: readonly {
    readonly row: string;
    readonly state: string;
    readonly movesTo: string | null;
    readonly madeBy: string | null;
  }[];
  readonly steps: readonly { readonly tickedAt: string | null }[];
}

/** The one thing the project asks next, and what moves it on. */
export type NextStep =
  | { readonly kind: 'confirm_proof'; readonly to: ProjectChainStage }
  | { readonly kind: 'upload_missing'; readonly row: string }
  | { readonly kind: 'install_date_passed' }
  | { readonly kind: 'move'; readonly to: ProjectChainStage }
  | { readonly kind: 'dispatch' }
  | {
      readonly kind: 'steps';
      readonly to: ProjectChainStage;
      readonly ticked: number;
      readonly total: number;
    }
  | { readonly kind: 'upload_proof'; readonly row: string; readonly to: ProjectChainStage }
  | { readonly kind: 'handover' }
  | { readonly kind: 'handed_over' }
  | { readonly kind: 'cancelled' };

/**
 * One stage on the journey: done (with its day and how), where it stands, ahead, passed — a proof
 * that came early moved the project over it — or skipped, a stage this deal does not walk.
 */
export interface JourneyRow {
  readonly stage: ProjectChainStage;
  /** `not_reached`: a stage a cancelled project stopped short of — never ahead of it. */
  readonly state: 'done' | 'now' | 'next' | 'passed' | 'skipped' | 'not_reached';
  /** The company day it entered the stage. */
  readonly on: CalendarDate | null;
  readonly by: string | null;
  /** `proof` when the proof moved it, with the proof's key. */
  readonly cause: string | null;
  readonly proof: string | null;
}

/**
 * Whether handover can be sent: open at the stage before Handed over on the deal's own chain; not
 * yet — naming that stage — before it; closed once the project is handed over or cancelled.
 */
export type HandoverOpening =
  | { readonly kind: 'open' }
  | { readonly kind: 'not_yet'; readonly from: ProjectChainStage }
  | { readonly kind: 'closed' };

export interface ProjectDetailView {
  readonly days: number;
  readonly closed: boolean;
  readonly handover: HandoverOpening;
  readonly next: NextStep;
  readonly journey: readonly JourneyRow[];
  readonly documentsDone: number;
  readonly documentsTotal: number;
  /** The rows still waiting on a person, in the pack's order. */
  readonly documentsWaiting: readonly string[];
  readonly stepsTicked: number;
  readonly stepsTotal: number;
  /** One stage back is there to take — the ⋯ menu's *Move back*. */
  readonly canMoveBack: boolean;
}

function isChainStage(value: string | null): value is ProjectChainStage {
  return value !== null && (PROJECT_STAGE_CHAIN as readonly string[]).includes(value);
}

function nextOf(facts: DetailFacts, stage: ProjectStage, ticked: number, total: number): NextStep {
  if (stage === 'cancelled') return { kind: 'cancelled' };
  if (stage === 'handed_over') return { kind: 'handed_over' };
  if (facts.todo === 'proof_early' && isChainStage(facts.earlyProofTo)) {
    return { kind: 'confirm_proof', to: facts.earlyProofTo };
  }
  if (facts.todo === 'proof_missing' && facts.missingProofRow !== null) {
    return { kind: 'upload_missing', row: facts.missingProofRow };
  }
  if (facts.todo === 'install_date_passed') return { kind: 'install_date_passed' };
  const next = nextStageOf({ stage, incentiveApplies: facts.incentiveApplies });
  if (next === null || next === 'handed_over') return { kind: 'handover' };
  const proving = facts.documents.find((document) => document.movesTo === next);
  if (proving !== undefined) return { kind: 'upload_proof', row: proving.row, to: next };
  if (next === 'installation' || next === 'electrical_metering') {
    return { kind: 'steps', to: next, ticked, total };
  }
  if (next === 'dispatched') return { kind: 'dispatch' };
  return { kind: 'move', to: next };
}

/** The last forward arrival at each stage, as the journey dates it. */
function arrivalOf(facts: DetailFacts, stage: ProjectChainStage) {
  return [...facts.journey].reverse().find((move) => move.to === stage) ?? null;
}

/** Where one walked stage stands against the stage reached; one never entered behind it was passed. */
function journeyStateOf(
  index: number,
  reached: number,
  closed: boolean,
  entered: boolean,
): JourneyRow['state'] {
  if (index > reached) return closed ? 'not_reached' : 'next';
  if (index === reached && !closed) return 'now';
  return entered ? 'done' : 'passed';
}

function handoverOf(
  walked: readonly ProjectChainStage[],
  standing: { readonly stage: ProjectStage; readonly incentiveApplies: boolean },
  closed: boolean,
): HandoverOpening {
  if (closed) return { kind: 'closed' };
  if (nextStageOf(standing) === 'handed_over') return { kind: 'open' };
  return { kind: 'not_yet', from: walked[walked.length - 2] ?? 'won' };
}

export function projectDetailViewOf(facts: DetailFacts): ProjectDetailView {
  const stage = facts.stage as ProjectStage;
  const ticked = facts.steps.filter((step) => step.tickedAt !== null).length;
  const total = facts.steps.length;
  const walked = chainOf({ stage, incentiveApplies: facts.incentiveApplies });
  const at = chainIndexOf(stage);
  const closed = isClosedStage(stage);
  const cancelledFrom = facts.journey.find((move) => move.to === 'cancelled')?.from ?? null;
  // A cancelled project stopped where it was cancelled from; the journey shows how far it got.
  const reached =
    stage === 'cancelled' ? chainIndexOf((cancelledFrom ?? 'won') as ProjectStage) : at;
  const journey = PROJECT_STAGE_CHAIN.map((chainStage): JourneyRow => {
    const index = chainIndexOf(chainStage);
    if (!walked.includes(chainStage)) {
      return { stage: chainStage, state: 'skipped', on: null, by: null, cause: null, proof: null };
    }
    const arrival = index <= reached ? arrivalOf(facts, chainStage) : null;
    return {
      stage: chainStage,
      state: journeyStateOf(index, reached, closed, arrival !== null),
      on: arrival?.enteredOn ?? null,
      by: arrival?.movedBy?.name ?? null,
      cause: arrival?.cause ?? null,
      proof: arrival?.proof ?? null,
    };
  });
  const waiting = facts.documents.filter(
    (document) => document.state === 'pending' && document.madeBy !== 'handover',
  );
  return {
    days: daysFrom(facts.enteredOn, facts.today),
    closed,
    handover: handoverOf(walked, { stage, incentiveApplies: facts.incentiveApplies }, closed),
    next: nextOf(facts, stage, ticked, total),
    journey,
    documentsDone: facts.documents.filter((document) => document.state !== 'pending').length,
    documentsTotal: facts.documents.length,
    documentsWaiting: waiting.map((document) => document.row),
    stepsTicked: ticked,
    stepsTotal: total,
    canMoveBack: !closed && at > 0,
  };
}
