import type { CalendarDate } from '../format/holidays';
import { BLOCKER_PARTIES, type BlockerParty, type BlockerReason } from './vocabulary';

/**
 * What needs a person (ruling 2026-11-10, `M08-23`): the acts only they can do — an early proof
 * to confirm, a proof missing, a promised install date passed — and, apart from them, the waits,
 * grouped by who the company waits on with its own first and each group oldest first. Nothing
 * here is on a clock: an old project is the days figure, never a "stuck" flag (`M08-12`).
 */

/** Why a project is on a person's list, in the order the list shows them. */
export const TODO_KINDS = ['proof_early', 'proof_missing', 'install_date_passed'] as const;
export type TodoKind = (typeof TODO_KINDS)[number];

/** A project's facts as the list reads them. */
export interface NeedsYouFacts {
  readonly id: string;
  /** The company day the project entered its stage. */
  readonly enteredOn: CalendarDate;
  readonly earlyProof: boolean;
  readonly missingProof: boolean;
  readonly installDatePassed: boolean;
  readonly wait: {
    readonly party: BlockerParty;
    readonly reason: BlockerReason;
    readonly startedOn: CalendarDate;
  } | null;
}

/** The one act a project asks of a person now, or null. */
export function todoOf(facts: NeedsYouFacts): TodoKind | null {
  if (facts.earlyProof) return 'proof_early';
  if (facts.missingProof) return 'proof_missing';
  if (facts.installDatePassed) return 'install_date_passed';
  return null;
}

export interface NeedsYou<T extends NeedsYouFacts> {
  readonly todo: readonly { readonly project: T; readonly kind: TodoKind }[];
  readonly waits: readonly { readonly party: BlockerParty; readonly projects: readonly T[] }[];
}

/**
 * The list: to-dos by kind, oldest in its stage first; then each party's waits, the company's own
 * first, the longest wait first. A party with no wait is left out.
 */
export function needsYouOf<T extends NeedsYouFacts>(projects: readonly T[]): NeedsYou<T> {
  const todo = projects
    .flatMap((project) => {
      const kind = todoOf(project);
      return kind === null ? [] : [{ project, kind }];
    })
    .sort(
      (a, b) =>
        TODO_KINDS.indexOf(a.kind) - TODO_KINDS.indexOf(b.kind) ||
        a.project.enteredOn.localeCompare(b.project.enteredOn) ||
        a.project.id.localeCompare(b.project.id),
    );
  const waits = BLOCKER_PARTIES.map((party) => ({
    party,
    projects: projects
      .filter((project) => project.wait?.party === party)
      .sort(
        (a, b) =>
          (a.wait?.startedOn ?? '').localeCompare(b.wait?.startedOn ?? '') ||
          a.id.localeCompare(b.id),
      ),
  })).filter((group) => group.projects.length > 0);
  return { todo, waits };
}
