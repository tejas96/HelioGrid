import type { ProjectCard } from '@heliogrid/contracts';
import {
  type BlockerParty,
  type BlockerReason,
  type CalendarDate,
  type DocumentState,
  earlyProofOf,
  type FormatPack,
  isInstallDatePassed,
  missingProofOf,
  type ProjectStage,
  type ProjectStanding,
  provenStages,
  type TodoKind,
  todoOf,
} from '@heliogrid/domain';

/*
 * What a project asks of a person, worked out once from what is on file (rulings 2026-11-10): the
 * proof ahead of it, the proof a hand move skipped, the promised date passed. The board, the
 * detail and the acts all read it from here, so the three can only agree.
 */

/** The facts the asks are read from. */
export interface StandingFacts {
  readonly stage: ProjectStage;
  readonly incentiveApplies: boolean;
  readonly expectedInstallOn: CalendarDate | null;
  readonly enteredOn: CalendarDate;
  readonly documents: readonly { readonly row: string; readonly state: DocumentState }[];
  readonly stepsTicked: number;
  readonly stepsTotal: number;
  readonly wait: {
    readonly party: BlockerParty;
    readonly reason: BlockerReason;
    readonly startedOn: CalendarDate;
  } | null;
  /** A part of the price is due and not fully paid — for a reader who may see money (`M11-53`). */
  readonly moneyDue?: boolean;
}

export interface Asks {
  readonly todo: TodoKind | null;
  readonly earlyProof: { readonly stage: ProjectStage; readonly proof: string } | null;
  readonly missingProofRow: string | null;
}

/** The stage each checklist row proves, as the company's pack declares it. */
function movesToOf(formats: FormatPack, row: string): string | null {
  return formats.documentChecklist.find((declared) => declared.row === row)?.movesTo ?? null;
}

export function standingOf(
  facts: Pick<StandingFacts, 'stage' | 'incentiveApplies'>,
): ProjectStanding {
  return { stage: facts.stage, incentiveApplies: facts.incentiveApplies };
}

/** The asks, read from the facts and the pack. */
export function asksOf(formats: FormatPack, facts: StandingFacts, today: CalendarDate): Asks {
  const standing = standingOf(facts);
  const rows = facts.documents.map((document) => ({
    row: document.row,
    state: document.state,
    movesTo: movesToOf(formats, document.row),
  }));
  const earlyProof = earlyProofOf(
    standing,
    provenStages(rows, facts.stepsTicked, facts.stepsTotal),
  );
  const missingProofRow = missingProofOf(standing, rows);
  const installDatePassed = isInstallDatePassed(standing, facts.expectedInstallOn, today);
  const todo = todoOf({
    id: '',
    enteredOn: facts.enteredOn,
    earlyProof: earlyProof !== null,
    missingProof: missingProofRow !== null,
    installDatePassed,
    moneyDue: facts.moneyDue ?? false,
    wait: facts.wait,
  });
  return { todo, earlyProof, missingProofRow };
}

/** The asks as the card and the detail carry them. */
export function askFieldsOf(
  asks: Asks,
): Pick<ProjectCard, 'todo' | 'earlyProofTo' | 'earlyProofBy' | 'missingProofRow'> {
  return {
    todo: asks.todo,
    earlyProofTo: asks.earlyProof?.stage ?? null,
    earlyProofBy: asks.earlyProof?.proof ?? null,
    missingProofRow: asks.missingProofRow,
  };
}
