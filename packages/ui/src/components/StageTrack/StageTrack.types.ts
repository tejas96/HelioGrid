import type { TranslatedText } from '@heliogrid/contracts';
import type { LeadStage } from '@heliogrid/domain';

/** `sm` sits inline beside a stage word in a row; `md` spans its column under a lead's hero. */
export type StageTrackSize = 'sm' | 'md';

/** Where one segment stands against the lead's stage: passed, the stage itself, or still ahead. */
export type StageStepStanding = 'done' | 'now' | 'ahead';

/** The track's spoken name, built in `@heliogrid/i18n` (`stageTrackWords`). */
export interface StageTrackWords {
  /** "Step 3 of 8: Qualified" — the stage's place in the funnel, and its word (`M02-41`). */
  stepOf: (stage: LeadStage) => TranslatedText;
}

/**
 * The eight-step funnel as segments (`M02-41`): the passed steps in ink, the lead's own in the
 * accent, the rest on the track. A picture of the stage, never its only carrier — the words beside
 * it say the stage, and the track is one image with its step spoken.
 */
export interface StageTrackProps {
  stage: LeadStage;
  size?: StageTrackSize;
  words: StageTrackWords;
}
