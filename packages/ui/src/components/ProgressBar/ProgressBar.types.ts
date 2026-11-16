import type { TranslatedText } from '@heliogrid/contracts';

/**
 * **The 6px pill rail, and nothing else.** Accent fill, or brand gradient for AI work.
 *
 * It is a drawing, not an operation: no label, no determinate/indeterminate distinction, no
 * "n of m", no stage, no cancel and no destination. Anything that has those — an import, a
 * solar-access computation, a render — takes **`OperationProgress`**, which draws with this. A
 * long-running operation reduced to a bare rail is the defect that component was raised about;
 * `UsageMeter` owns the billing meter, and this owns the rail.
 */
export interface ProgressBarProps {
  /** 0–100 */
  value?: number;
  /** brand-gradient fill for AI / long-running operations */
  gradient?: boolean;
  /** What the rail measures, for a screen reader — a wizard's name. None leaves it to its holder. */
  label?: TranslatedText;
  /**
   * A rail that counts steps (a wizard's) is said as its step and the count, never a percent: the
   * holder draws the "n of m" words, and this is only the spoken position. None says the percent.
   */
  steps?: { readonly now: number; readonly total: number };
}
