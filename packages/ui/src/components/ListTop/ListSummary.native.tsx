import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { HueTile } from '../HueTile/HueTile.native';
import { StageMeter } from '../StageMeter/StageMeter.native';
import { ListStageBar } from './ListStageBar.native';
import { FIGURE_TILE } from './ListTop.logic';
import type { ListFigure, ListRoom, ListSummaryProps } from './ListTop.types';

/** A figure: its count over its word; a pressable where it narrows or opens what it counts. */
function Figure({ figure, lead }: { figure: ListFigure; lead: boolean }) {
  const face = (
    <View style={lead ? styles.lead : styles.side}>
      {figure.glyph === undefined ? null : (
        <HueTile glyph={figure.glyph.name} hue={figure.glyph.hue} {...FIGURE_TILE} />
      )}
      <Text variant={lead ? 'hero' : 'figure'}>{figure.value}</Text>
      <Text variant={lead ? 'body' : 'body-sm'} bold={lead} color={lead ? 'primary' : 'secondary'}>
        {figure.label}
      </Text>
    </View>
  );
  if (figure.onPress === undefined) {
    return (
      <View accessible accessibilityLabel={figure.spoken} style={lead ? styles.leadBox : null}>
        {face}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={figure.spoken}
      accessibilityState={figure.pressed === undefined ? undefined : { selected: figure.pressed }}
      onPress={figure.onPress}
      style={[styles.press, figure.pressed === true ? styles.pressed : undefined]}
    >
      {face}
    </Pressable>
  );
}

/** The list's one hero on the phone: the main figure large, the others stacked beside it. */
export function ListSummary({ summary, room }: { summary: ListSummaryProps; room: ListRoom }) {
  return (
    <HeroPanel name={summary.name} label={summary.label}>
      <View style={styles.summary}>
        <View style={styles.figures}>
          <Figure figure={summary.lead} lead />
          <View style={styles.rule} />
          <View style={styles.sideList}>
            {summary.side.map((figure) => (
              <Figure key={figure.label} figure={figure} lead={false} />
            ))}
          </View>
        </View>
        {summary.note === null ? null : (
          <Text variant="body-sm" color="secondary">
            {summary.note}
          </Text>
        )}
        {summary.stages === null ? null : room === 'wide' ? (
          <StageMeter {...summary.stages} />
        ) : (
          <ListStageBar stages={summary.stages} />
        )}
      </View>
    </HeroPanel>
  );
}

const styles = StyleSheet.create({
  summary: { gap: theme.spacing['sp-5'] },
  figures: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-4'] },
  leadBox: { flex: 1, minWidth: 0 },
  lead: { gap: theme.spacing['sp-1'] },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minHeight: theme.layout['touch-min'],
  },
  press: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing['sp-2'],
    marginHorizontal: -theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
  },
  /* A figure whose filter is on is the chosen accent wash, as a chosen chip is. */
  pressed: { backgroundColor: colors['accent-subtle'] },
  rule: {
    alignSelf: 'stretch',
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors['line-soft'],
  },
  sideList: { flexShrink: 1, gap: theme.spacing['sp-0-5'] },
});
