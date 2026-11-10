import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { stageSharesOf } from './StageMeter.logic';
import type { StageMeterProps, StageMeterStage } from './StageMeter.types';

/**
 * The pipeline by stage on the phone: the card's overline, the one bar of every stage's share and
 * the counts in rows of four under it; the band's stages each over their own share. Each count is
 * a button that filters to its stage.
 */
export function StageMeter({ stages, chosen, onPick, form, words }: StageMeterProps) {
  const shares = stageSharesOf(stages);
  const stageButtons = stages.map((one, index) => (
    <StageButton
      key={one.stage}
      one={one}
      share={form === 'band' ? (shares[index] ?? 0) : null}
      chosen={chosen === one.stage}
      onPick={onPick}
      words={words}
    />
  ));
  return (
    <View style={[tileSurface, styles.meter]}>
      <GroundProvider ground="tile">
        {form === 'card' ? (
          <>
            <View style={styles.head}>
              <Text variant="overline" color="secondary">
                {words.heading}
              </Text>
              <Text variant="caption" color="secondary">
                {words.hint}
              </Text>
            </View>
            <View style={styles.bar} importantForAccessibility="no-hide-descendants">
              {stages.map((one, index) => (
                <View key={one.stage} style={[styles.share, { flexGrow: shares[index] ?? 0 }]} />
              ))}
            </View>
            <View style={styles.cardStages}>{stageButtons}</View>
          </>
        ) : (
          <View style={styles.bandStages}>{stageButtons}</View>
        )}
      </GroundProvider>
    </View>
  );
}

function StageButton({
  one,
  share,
  chosen,
  onPick,
  words,
}: {
  one: StageMeterStage;
  /** The band's share of the bar this stage stands over; null on the card. */
  share: number | null;
  chosen: boolean;
  onPick: StageMeterProps['onPick'];
  words: StageMeterProps['words'];
}) {
  return (
    <Pressable
      accessibilityLabel={words.spoken(one.stage, one.count)}
      accessibilityState={{ selected: chosen }}
      onPress={() => onPick(one.stage)}
      style={[
        styles.stage,
        share === null ? styles.cardStage : { flexGrow: share, flexBasis: 0 },
        chosen ? styles.chosenStage : undefined,
      ]}
    >
      {share === null ? null : <View style={[styles.share, styles.bandShare]} />}
      <Text variant="figure" style={chosen ? styles.chosenWords : undefined}>
        {one.count}
      </Text>
      <Text variant="caption" color="secondary" style={chosen ? styles.chosenWords : undefined}>
        {words.stage(one.stage)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  meter: {
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-card-expressive'],
  },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  bar: { flexDirection: 'row', gap: theme.spacing['sp-0-5'] },
  share: {
    flexBasis: 0,
    minWidth: theme.spacing['sp-1'],
    height: theme.spacing['sp-1'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors.accent,
  },
  bandShare: { alignSelf: 'stretch' },
  /* Rows of four, every stage in view: a sideways scroll cut the sixth in half at the card's edge.
     A stage is at least a quarter and as wide as its name, so a long name wraps the row sooner and
     never breaks inside a word. */
  cardStages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: theme.spacing['sp-1'],
    marginHorizontal: -theme.spacing['sp-2'],
  },
  cardStage: { minWidth: '25%' },
  bandStages: { flexDirection: 'row', gap: theme.spacing['sp-2'] },
  stage: {
    alignItems: 'flex-start',
    gap: theme.spacing['sp-0-5'],
    paddingHorizontal: theme.spacing['sp-2'],
    paddingVertical: theme.spacing['sp-1'],
    borderRadius: theme.radius['r-tile'],
  },
  /* The chosen stage is the accent wash, as every chosen filter is — calm however wide its share. */
  chosenStage: { backgroundColor: colors['accent-subtle'] },
  chosenWords: { color: colors['accent-text'] },
});
