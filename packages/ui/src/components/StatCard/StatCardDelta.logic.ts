import type { TranslatedText } from '@heliogrid/contracts';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type {
  StatCardDeltaDir,
  StatCardDeltaProps,
  StatCardSentiment,
  StatCardWords,
} from './StatCard.types';

/** A caller that states only a direction makes no good/bad claim at all: sentiment is neutral. */
export const DELTA_DEFAULTS = {
  dir: 'up',
  sentiment: 'neutral',
} as const satisfies { dir: StatCardDeltaDir; sentiment: StatCardSentiment };

/** The glyph each direction draws, the same on both halves. */
export const DELTA_DIR_GLYPH: Record<StatCardDeltaDir, ShellGlyphName> = {
  up: 'trend-up',
  down: 'trend-down',
  flat: 'minus',
};

/** Sentiment: a tint AND a word. Neutral makes no claim, which is why it is the default. */
export function sentimentWord(
  sentiment: StatCardSentiment,
  words: StatCardWords,
): TranslatedText | null {
  if (sentiment === 'good') return words.better;
  if (sentiment === 'bad') return words.worse;
  return null;
}

/**
 * **The chip, or null when it has nothing to say.** A named gap suppresses the whole chip: a delta
 * of an absent value is arithmetic on nothing. Its verdict is the caller's word, else the
 * sentiment's — and none for neutral.
 */
export function deltaChipOf({
  delta,
  sentiment,
  sentimentLabel,
  words,
  suppressed,
}: Omit<StatCardDeltaProps, 'dir'>): { delta: string; verdict: TranslatedText | null } | null {
  if (delta === undefined || delta === null || suppressed) return null;
  return { delta, verdict: sentimentLabel || sentimentWord(sentiment, words) };
}
