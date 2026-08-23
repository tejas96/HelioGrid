/* The change under a StatCard's figure (native) — the same two facts as the web half.

   `dir` is WHICH WAY the figure moved, carried by the arrow glyph. `sentiment` is WHETHER THAT IS
   GOOD NEWS, carried by the tint AND by a word (F7-12). The web half's sr-only direction word is
   the chip's `accessibilityLabel` here, which is the same sentence read the same way.

   A named gap suppresses the whole chip: a delta of an absent value is arithmetic on nothing. */

import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import type { StatCardDeltaDir, StatCardSentiment } from './StatCard.types';

const SENTIMENT_WORD: Record<StatCardSentiment, string | null> = {
  good: 'better',
  bad: 'worse',
  neutral: null,
};

const SENTIMENT_TONE: Record<StatCardSentiment, { bg: string; fg: string }> = {
  good: { bg: theme.colors['success-bg'], fg: theme.colors['success-text'] },
  bad: { bg: theme.colors['danger-bg'], fg: theme.colors['danger-text'] },
  neutral: { bg: theme.colors['neutral-bg'], fg: theme.colors['neutral-text'] },
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
  const tone = SENTIMENT_TONE[sentiment];
  return (
    <View
      accessible
      accessibilityLabel={`${DIR_WORD[dir]} ${delta}${sentWord ? ` · ${sentWord}` : ''}`}
      style={[styles.delta, { backgroundColor: tone.bg }]}
    >
      {/* Direction's channel: the arrow. Sentiment's: the tint AND the word after it. */}
      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
        <Path
          d={DIR_PATH[dir]}
          stroke={tone.fg}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text variant="caption" style={[styles.deltaWord, { color: tone.fg }]}>
        {delta}
      </Text>
      {sentWord ? (
        <>
          <Text variant="caption" style={[styles.deltaSep, { color: tone.fg }]}>
            ·
          </Text>
          <Text variant="caption" style={[styles.deltaWord, { color: tone.fg }]}>
            {sentWord}
          </Text>
        </>
      ) : null}
    </View>
  );
}
