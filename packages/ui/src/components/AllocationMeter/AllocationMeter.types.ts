import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';

export interface AllocationPart {
  /** The part's name — a tranche label ("On signing", "On delivery"). Titles its segment. */
  // biome-ignore lint/plugin/copy-prop-type: a tranche's name, as the owner typed it
  label?: string;
  /** The part's size in `unit`. `percent` is accepted as an alias. */
  value?: number;
  percent?: number;
  /** With `variant="split"`: the words under the part's share in the key — the stage it falls due at. */
  caption?: ReactNode;
}

/**
 * `meter` checks the parts against `target`, with the remainder in words. `split` reads a split
 * that was saved already: a strip and a key, nothing in progress.
 */
export type AllocationVariant = 'meter' | 'split';

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
/**
 * The meter's own sentences in the reader's language. Every figure arrives formatted with its
 * unit — "12%", "100%" — so a sentence never joins a number to a word itself.
 */
export interface AllocationMeterWords {
  /** The meter's spoken name: "Payment schedule allocation" — "Allocation" with no `label`. */
  readonly name: (label?: TranslatedText) => TranslatedText;
  /** The figure's denominator, after the sum: "of 100%". */
  readonly ofTarget: (target: string) => TranslatedText;
  /** The whole figure as a screen reader hears it: "62% of 100% — 38% unallocated." */
  readonly figure: (sum: string, target: string, remainder: TranslatedText) => TranslatedText;
  /** "Fully allocated." */
  readonly met: TranslatedText;
  /** "12% unallocated." */
  readonly under: (amount: string) => TranslatedText;
  /** "18% over-allocated." */
  readonly over: (amount: string) => TranslatedText;
  /** `immediate`: "This has to reach 100% before it can be saved." */
  readonly blocksSave: (target: string) => TranslatedText;
  /** `at-generate`: "Generate is blocked until the allocation reaches 100%." */
  readonly blocksGenerate: (target: string) => TranslatedText;
  /** No resolved figure at all: "Nothing allocated yet." */
  readonly unresolved: TranslatedText;
}

interface AllocationMeterBase {
  /** What is being allocated — "Payment schedule", "Tranche allocation". */
  label?: TranslatedText;
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
  targetLabel?: TranslatedText;
  /** Replaces the generated remainder sentence ("12% unallocated."). */
  remainderWords?: TranslatedText;
  /**
   * **Where the rule bites, in words.** `at-generate` (default, `M06-13` post-R12: shown live,
   * enforced only at Generate) · `immediate` · `none` for a meter that blocks nothing.
   */
  enforcement?: AllocationEnforcement;
  /** Replaces the generated enforcement sentence; `null` says none. */
  enforcementNote?: TranslatedText | null;
  /** Force the state. Otherwise derived from the figure against the target. */
  state?: AllocationState;
  /** The words when there is no resolved figure at all, in place of `words.unresolved`. */
  unresolvedNote?: TranslatedText;
  note?: TranslatedText;
  /** Names each segment beside the bar. Off by default: at 375px the bar and the words come first. */
  showLegend?: boolean;
  /**
   * `meter` (default) checks the parts against `target`, with the remainder in words. `split`
   * **reads a saved split**: one segment per part in its own chart colour and, under it, a key of
   * each part's share and `caption` — no label row, no remainder, no rule (`SCR-M01-20`'s list of
   * payment terms). `label` names the section. Never `split` where the parts are being edited.
   */
  variant?: AllocationVariant;
  density?: 'expressive' | 'functional';
}

/** The meter: checks the parts against `target`, and says so in `words`. */
interface AllocationMeterChecking extends AllocationMeterBase {
  variant?: 'meter';
  words: AllocationMeterWords;
}

/** A saved split, read: a strip and a key, no sentence of its own. */
interface AllocationMeterReading extends AllocationMeterBase {
  variant: 'split';
  words?: undefined;
}

export type AllocationMeterProps = AllocationMeterChecking | AllocationMeterReading;

/** One drawn piece of the bar: the part inside the target, or the part beyond it. */
export interface AllocationSpan {
  key: string;
  /** Width as a percentage of the track, which scales to max(allocated, target). */
  width: number;
  /** Past the target line — takes --warning-text, the only warning mark that clears 3:1. */
  over: boolean;
  // biome-ignore lint/plugin/copy-prop-type: a tranche's name, as the owner typed it
  label?: string;
}
