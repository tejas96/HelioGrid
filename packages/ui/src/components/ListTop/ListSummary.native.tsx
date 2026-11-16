import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { HueTile } from '../HueTile/HueTile.native';
import { SegmentBar } from '../SegmentBar/SegmentBar.native';
import { StageMeter } from '../StageMeter/StageMeter.native';
import { FIGURE_TILE } from './ListTop.logic';
import type { ListFigure, ListRoom, ListSummaryProps } from './ListTop.types';

/** How a figure's count and word are set: the main one large, a pill's as running text. */
function faceLookOf(lead: boolean, narrow: boolean, pill: boolean) {
  if (lead) {
    return {
      value: 'hero',
      word: 'body',
      strongValue: false,
      strongWord: !narrow,
      wordColor: narrow ? 'secondary' : 'primary',
    } as const;
  }
  return {
    value: pill ? 'body' : 'figure',
    word: 'body-sm',
    strongValue: pill,
    strongWord: false,
    wordColor: 'secondary',
  } as const;
}

/**
 * A figure: its count over its word; a pressable where it narrows or opens what it counts. In the
 * narrow room a side figure that presses is a small pill ending in a chevron, so it reads as a way
 * in, and the main figure's word sits quiet under its count.
 */
function Figure({ figure, lead, room }: { figure: ListFigure; lead: boolean; room: ListRoom }) {
  const pill = room === 'narrow' && !lead && figure.onPress !== undefined;
  const look = faceLookOf(lead, room === 'narrow', pill);
  const face = (
    <View style={lead ? styles.lead : styles.side}>
      {figure.glyph === undefined ? null : (
        <HueTile glyph={figure.glyph.name} hue={figure.glyph.hue} {...FIGURE_TILE} />
      )}
      <Text variant={look.value} bold={look.strongValue}>
        {figure.value}
      </Text>
      <Text
        variant={look.word}
        bold={look.strongWord}
        color={look.wordColor}
        style={pill ? styles.pillWord : undefined}
      >
        {figure.label}
      </Text>
      {pill ? (
        <View style={styles.pillEnd}>
          <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
        </View>
      ) : null}
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
      style={[
        pill ? styles.pill : styles.press,
        figure.pressed === true ? styles.pressed : undefined,
      ]}
    >
      {face}
    </Pressable>
  );
}

/** The list's one hero on the phone: the main figure large, the others stacked beside it. */
export function ListSummary({ summary, room }: { summary: ListSummaryProps; room: ListRoom }) {
  return (
    <HeroPanel name={summary.name} {...(room === 'wide' ? { label: summary.label } : {})}>
      <View style={styles.summary}>
        <View style={styles.figures}>
          <Figure figure={summary.lead} lead room={room} />
          {room === 'wide' ? <View style={styles.rule} /> : null}
          <View style={room === 'wide' ? styles.sideList : styles.pillList}>
            {summary.side.map((figure) => (
              <Figure key={figure.label} figure={figure} lead={false} room={room} />
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
          <SegmentBar
            parts={summary.stages.stages.map((one) => ({ key: one.stage, count: one.count }))}
            fade
            label={summary.stages.words.heading}
          />
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  /* A figure whose filter is on is drawn in an ink outline, as a chosen chip is. */
  pressed: { borderWidth: 1, borderColor: colors['text-primary'] },
  rule: {
    alignSelf: 'stretch',
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors['line-soft'],
  },
  sideList: { flexShrink: 1, gap: theme.spacing['sp-0-5'] },
  pillList: { flexShrink: 1, gap: theme.spacing['sp-2'], alignItems: 'stretch' },
  /* A side figure as a way in: a lit pill on the glass, its chevron at the end. */
  pill: {
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingLeft: theme.spacing['sp-1'],
    paddingRight: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
  },
  pillWord: { flexShrink: 1 },
  pillEnd: { marginLeft: 'auto' },
});
