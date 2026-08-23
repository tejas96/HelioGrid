import type { ReactNode } from 'react';

export interface AllocationPart {
  /** The part's name — a tranche label ("On signing", "On delivery"). Titles its segment. */
  label?: string;
  /** The part's size in `unit`. `percent` is accepted as an alias. */
  value?: number;
  percent?: number;
}

/** Three states, because a target is an EQUALITY: under is as wrong as over, and `met` is real. */
export type AllocationState = 'under' | 'met' | 'over';

/** Where the rule bites, in words. Never a silent block. */
export type AllocationEnforcement = 'at-generate' | 'immediate' | 'none';

/**
 * **Parts of a whole that must reach exactly a target, with the shortfall or the excess stated in
 * words** (`M06-13` P0 / `SCR-M06-09`, the payment-schedule step, state
 * `allocation-incomplete-remainder`).
 *
 * **Three states, because a target is an equality.** `under` (neutral words — the rep is mid-edit),
 * `met` (named outright: "Fully allocated."), `over` (**warning, never danger** — nothing is broken
 * and nothing was refused; the block is Generate's to state, which is what `enforcement` writes).
 *
 * **The remainder is content, not a gap in a bar.** `M06-13` quotes the sentence, so the sentence
 * is rendered — "12% unallocated." / "18% over-allocated." — and a reader never has to measure a
 * picture.
 *
 * **Why it is neither existing meter.** `ProgressBar` clamps at 100, so over-allocation could not
 * be drawn at all. `UsageMeter` is the **billing** meter and stays walled off: a bundle limit is a
 * *ceiling you may cross for money*, a target is an *equality*. So: no period, no tier, no billing
 * states.
 */
export interface AllocationMeterProps {
  /** What is being allocated — "Payment schedule", "Tranche allocation". */
  label?: string;
  /**
   * The parts. Their sum is the figure, so a segment per tranche is drawn and a segment that
   * straddles the target is **split at the target line** rather than tinted by its whole.
   */
  parts?: AllocationPart[];
  /**
   * The figure, when the caller has already summed the parts. Ignored if `parts` has entries.
   *
   * **It is not called `total`.** On a meter `total` reads as *the thing being reached* — the
   * denominator — and here it is the opposite side of the comparison: the sum of the parts so far.
   * The denominator is `target`. (Law 16: `total` is only ever a sum of the parts shown.)
   */
  allocated?: number;
  /** The figure it must equal. Default 100. */
  target?: number;
  /** Default `"%"`. Written directly against the numeral, as percentages are. */
  unit?: string;
  /**
   * **How far off `target` still counts as `met`, in `unit`s. Default 0.05.** An unrounded split is
   * the ordinary case — three tranches of 33.33% sum to 99.99% — and an `===` test called that
   * *"0% unallocated"* and added a false *"Generate is blocked"* line. This is the width of a
   * rounding residue and nothing more: 99.99 and 100.01 are met, 99.5 is still half a percent
   * somebody meant to place. Do not widen it to make arithmetic go away.
   */
  tolerance?: number;
  /** The rule, said once above the bar — `M06-13`'s *"Total allocation must = 100%"*. */
  targetLabel?: string;
  /** Replaces the generated remainder sentence ("12% unallocated."). */
  remainderWords?: ReactNode;
  /**
   * **Where the rule bites, in words.** `at-generate` (default, `M06-13` post-R12: shown live,
   * enforced only at Generate) · `immediate` · `none` for a meter that blocks nothing.
   */
  enforcement?: AllocationEnforcement;
  /** Replaces the generated enforcement sentence. */
  enforcementNote?: ReactNode;
  /** Force the state. Otherwise derived from the figure against the target. */
  state?: AllocationState;
  /** The words when there is no resolved figure at all. Default "Nothing allocated yet." */
  unresolvedNote?: ReactNode;
  note?: ReactNode;
  /** Names each segment beside the bar. Off by default: at 375px the bar and the words come first. */
  showLegend?: boolean;
  density?: 'expressive' | 'functional';
}

/** One drawn piece of the bar: the part inside the target, or the part beyond it. */
export interface AllocationSpan {
  key: string;
  /** Width as a percentage of the track, which scales to max(allocated, target). */
  width: number;
  /** Past the target line — takes --warning-text, the only warning mark that clears 3:1. */
  over: boolean;
  label?: string;
}
