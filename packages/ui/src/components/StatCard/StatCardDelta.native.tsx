/* The change under a StatCard's figure (native) — the same two facts as the web half.

   `dir` is WHICH WAY the figure moved, carried by the arrow glyph. `sentiment` is WHETHER THAT IS
   GOOD NEWS, carried by the tint AND by a word (F7-12). The web half's sr-only direction word is
   the chip's `accessibilityLabel` here, which is the same sentence read the same way.

   A named gap suppresses the whole chip: a delta of an absent value is arithmetic on nothing. */

import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { TONE, type Tone } from '../../primitives/Tone/tone.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { StatCardDeltaProps, StatCardSentiment } from './StatCard.types';
import { DELTA_DIR_GLYPH, deltaChipOf } from './StatCardDelta.logic';

const SENTIMENT_TONE: Record<StatCardSentiment, Tone> = {
  good: 'success',
  bad: 'danger',
  neutral: 'neutral',
};

const styles = StyleSheet.create({
  delta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.spacing['sp-1'],
    marginTop: theme.spacing['sp-3'],
    height: 24,
    paddingHorizontal: 10,
    borderRadius: theme.radius['r-pill'],
  },
  deltaWord: { fontWeight: '500' },
  deltaSep: { opacity: 0.5 },
});

export function StatCardDelta({ dir, ...chipFacts }: StatCardDeltaProps) {
  const chip = deltaChipOf(chipFacts);
  if (chip === null) return null;
  const { sentiment, words } = chipFacts;
  const { delta, verdict: sentWord } = chip;
  const tone = TONE[SENTIMENT_TONE[sentiment]];
  /* The two phrases a sighted reader sees either side of the dot: the move, then the verdict. */
  const moved = words.moved(dir, delta);
  const spoken = sentWord ? [moved, sentWord].join(' · ') : moved;
  return (
    <View
      accessible
      accessibilityLabel={spoken}
      style={[styles.delta, { backgroundColor: tone.tint }]}
    >
      {/* Direction's channel: the arrow. Sentiment's: the tint AND the word after it. */}
      <ShellGlyph name={DELTA_DIR_GLYPH[dir]} size="xs" ink={tone.ink} />
      <Text variant="caption" style={[styles.deltaWord, { color: tone.ink }]}>
        {delta}
      </Text>
      {sentWord ? (
        <>
          <Text variant="caption" style={[styles.deltaSep, { color: tone.ink }]}>
            {'·'}
          </Text>
          <Text variant="caption" style={[styles.deltaWord, { color: tone.ink }]}>
            {sentWord}
          </Text>
        </>
      ) : null}
    </View>
  );
}
