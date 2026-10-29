/* The change under a StatCard's figure (web) — TWO FACTS, never conflated.

   `dir` is WHICH WAY the figure moved, carried by the arrow glyph. `sentiment` is WHETHER THAT IS
   GOOD NEWS, carried by the tint AND by a word, because F7-12 forbids a good/bad reading resting on
   colour alone. Neutral makes no claim, which is why it is the default.

   A named gap suppresses the whole chip: a delta of an absent value is arithmetic on nothing. */

import { Text } from '../../primitives/Text';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import type { StatCardDeltaProps } from './StatCard.types';
import { DELTA_DIR_GLYPH, deltaChipOf } from './StatCardDelta.logic';

export function StatCardDelta({ dir, ...chipFacts }: StatCardDeltaProps) {
  const chip = deltaChipOf(chipFacts);
  if (chip === null) return null;
  const { sentiment, words } = chipFacts;
  const { delta, verdict: sentWord } = chip;
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
        <ShellGlyphMarks name={DELTA_DIR_GLYPH[dir]} />
      </svg>
      {/* NAME_FROM_CONTENT (check h): the arrow is hidden, so DIRECTION is carried in words — and
          those words are CONTENT here where the native half folds the whole chip into one
          `accessibilityLabel`. Through the DS `Text` primitive so the name source is declared
          rather than left in a clipped `<span>` the parity gate cannot read. The direction and the
          figure are one phrase, in the order the reader's language says them, so the drawn
          figure is hidden from the screen reader that hears it there. */}
      <Text as="span" spokenOnly>
        {words.moved(dir, delta)}
      </Text>
      <span aria-hidden="true">{delta}</span>
      {sentWord ? (
        <>
          <span aria-hidden="true" className="hg-stat-card-delta-sep">
            {'·'}
          </span>
          <span>{sentWord}</span>
        </>
      ) : null}
    </span>
  );
}
