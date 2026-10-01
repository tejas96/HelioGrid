import type { CentreVerb } from './centre-verb';

/**
 * `M01-16` — at most three first-run coach marks. A membership records how many it has passed,
 * so the wire's bound, the database's check and the sequence's cap all read this one number:
 * raise it here and a count the wire admits can no longer be one the row refuses. It is the
 * row's cap, never the length of the mark list below — derive it from the list and a dismissal
 * of all three is refused.
 */
export const FIRST_RUN_COACH_MARKS = 3;

/**
 * The marks in the order `SCR-SHELL-01` Frame 7 runs them, each named for the control it points at —
 * the switcher on the title, then the centre verb; the availability pill's mark goes between the two
 * when it lands (`T-M07-027`).
 */
const FIRST_RUN_MARKS = ['switch-home', 'centre-action'] as const;
export type FirstRunMark = (typeof FIRST_RUN_MARKS)[number];

/** What the home in force puts on screen, which is all a mark needs to know. */
export interface MarkedControls {
  readonly homes: number;
  readonly centreVerb: CentreVerb | null;
}

/**
 * The marks whose control is on screen, in run order: the switcher only with two homes or more,
 * the centre only with a verb. The stored count is a position in THIS list, so a list that
 * changes after the first run may skip a new mark or repeat a passed one — accepted, since a
 * person whose roles change is not on a first run.
 */
export function firstRunMarksFor({ homes, centreVerb }: MarkedControls): FirstRunMark[] {
  const shown: Record<FirstRunMark, boolean> = {
    'switch-home': homes > 1,
    'centre-action': centreVerb !== null,
  };
  return FIRST_RUN_MARKS.filter((mark) => shown[mark]);
}

/**
 * The marks still to show: those after the `passed` count, which is a position in `marks`. Nothing
 * while the count is unknown (`null`, still loading), so a mark never flashes up for a person who
 * passed it on another device.
 */
export function marksToShow(
  marks: readonly FirstRunMark[],
  passed: number | null,
): readonly FirstRunMark[] {
  return passed === null ? [] : marks.slice(passed);
}
