import type { TranslatedText } from '@heliogrid/contracts';
import type { LeadStage } from '@heliogrid/domain';

/** One stage of the open funnel and how many leads stand in it. */
export interface StageMeterStage {
  readonly stage: LeadStage;
  readonly count: number;
}

/** The meter's words, built in `@heliogrid/i18n` (`leadsListWords`). */
export interface StageMeterWords {
  /** The meter's name, and the card's overline — "Pipeline · 46 open". */
  heading: TranslatedText;
  /** Beside it on the card — "Tap a stage to filter". */
  hint: TranslatedText;
  /** A stage's word — "Qualified". */
  stage: (stage: LeadStage) => TranslatedText;
  /** A stage's button, spoken — "Qualified, 12 leads". */
  spoken: (stage: LeadStage, count: number) => TranslatedText;
}

/**
 * `card`: the phone's card — its overline, the one bar of every stage's share, then the stages as
 * counts in rows of four, every one in view. `band`: the desktop's row of stages, each over its
 * share of the bar.
 */
export type StageMeterForm = 'card' | 'band';

/**
 * **The pipeline by stage** (`SCR-M02-03`, `M02-41`): the shape of the open funnel at a glance, each
 * stage's count a button that filters the list to it — pressed again, it lets go. The chosen stage
 * is the accent wash; the bar is a picture of the counts beside it, never their only carrier.
 */
export interface StageMeterProps {
  /** The open funnel in order, a stage with none counted 0 — the caller never drops one. */
  stages: readonly StageMeterStage[];
  /** The stage the list is filtered to; none when it is not. */
  chosen: LeadStage | null;
  onPick: (stage: LeadStage) => void;
  form: StageMeterForm;
  words: StageMeterWords;
}
