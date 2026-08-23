/* The change under a StatCard's figure (web) — TWO FACTS, never conflated.

   `dir` is WHICH WAY the figure moved, carried by the arrow glyph. `sentiment` is WHETHER THAT IS
   GOOD NEWS, carried by the tint AND by a word, because F7-12 forbids a good/bad reading resting on
   colour alone. Neutral makes no claim, which is why it is the default.

   A named gap suppresses the whole chip: a delta of an absent value is arithmetic on nothing. */

import { Text } from '../../primitives/Text';
import type { StatCardDeltaDir, StatCardSentiment } from './StatCard.types';

/** Sentiment: a tint AND a word. Neutral makes no claim, which is why it is the default. */
const SENTIMENT_WORD: Record<StatCardSentiment, string | null> = {
  good: 'better',
  bad: 'worse',
  neutral: null,
};

const DIR_WORD: Record<StatCardDeltaDir, string> = {
  up: 'Up',
  down: 'Down',
  flat: 'No change',
};

const DIR_PATH: Record<StatCardDeltaDir, string> = {
  up: 'M7 17 17 7M17 7H9m8 0v8',
  down: 'M7 7l10 10M17 17H9m8 0V9',
  flat: 'M5 12h14',
};

export function StatCardDelta({
  delta,
  dir,
  sentiment,
  sentimentLabel,
  suppressed,
}: {
  delta?: string;
  dir: StatCardDeltaDir;
  sentiment: StatCardSentiment;
  sentimentLabel?: string;
  /** The figure is a named gap, so there is nothing for a delta to be a change IN. */
  suppressed: boolean;
}) {
  if (delta === undefined || delta === null || suppressed) {
    return null;
  }
  const sentWord = sentimentLabel || SENTIMENT_WORD[sentiment];
  return (
    <span className="hg-stat-card-delta" data-sentiment={sentiment}>
      {/* Direction's channel: the arrow. Sentiment's: the tint AND the word after it. */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={DIR_PATH[dir]} />
      </svg>
      {/* NAME_FROM_CONTENT (check h): the arrow is hidden, so DIRECTION is carried in words — and
          those words are CONTENT here where the native half folds the whole chip into one
          `accessibilityLabel`. Through the DS `Text` primitive so the name source is declared
          rather than left in a clipped `<span>` the parity gate cannot read. */}
      <Text as="span" className="hg-stat-card-sr">{`${DIR_WORD[dir]} `}</Text>
      {delta}
      {sentWord ? (
        <>
          <span aria-hidden="true" className="hg-stat-card-delta-sep">
            ·
          </span>
          <span>{sentWord}</span>
        </>
      ) : null}
    </span>
  );
}
