import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import {
  BlockFigure,
  BlockOver,
  FigureLine,
  InkGlyph,
  MONO,
  PAPER_TYPE,
} from './BlockParts.native';
import { useBlockInk } from './block-ink.native';
import { Growing } from './Growing.native';
import { monthBars } from './ProposalBlocks.logic';
import type { ProposalGenerationBlockProps } from './ProposalBlocks.types';
import { generationView } from './ProposalBlocks.views';

/**
 * A year of generation (`M06-10`): the annual figure with its tier and its source label (`F8-08`),
 * twelve bars with the best month marked and named, and the average month in words. The bars are a
 * picture of the figures beside them; the chart is named whole for a screen reader.
 *
 * WEB → RN MAPPING: the web's bars grow in once; a phone's stand, since a bar's height is layout
 * and the phone animates transform and opacity alone. The web's two-colour bar is the first chart
 * colour here.
 */
export function ProposalGenerationBlock({
  mode,
  generation,
  tier,
  words,
}: ProposalGenerationBlockProps) {
  const ink = useBlockInk(mode);
  const format = useFormat();
  const view = generationView(generation, format);
  const paper = mode === 'paper';
  const months = format.monthNames(paper ? 'short' : 'narrow');
  const { peak } = view;
  const bars = monthBars(generation.monthlyKwh, peak);
  return (
    <View>
      <BlockOver mode={mode} overline={words.overline} tier={tier} />
      <View style={styles.top}>
        <View style={styles.figure}>
          <BlockFigure mode={mode} figure={view.annual} />
          <Text variant="body" style={{ color: ink.secondary }}>
            {words.perYear}
          </Text>
        </View>
        {words.source === undefined ? null : (
          <View style={styles.source}>
            <InkGlyph name="sun" color={ink.sun} />
            <Text variant="caption" style={[styles.sourceWords, { color: ink.secondary }]}>
              {words.source}
            </Text>
          </View>
        )}
      </View>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={words.chart(format.monthNames('long')[peak] ?? '')}
        style={[styles.bars, paper ? styles.barsPaper : undefined]}
      >
        {bars.map((bar, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: twelve months in calendar order
          <View key={index} style={styles.bar}>
            <View style={styles.column}>
              {bar.peak ? (
                <Text
                  variant="mono"
                  style={[
                    MONO,
                    styles.value,
                    { color: ink.text },
                    paper ? styles.valuePaper : undefined,
                  ]}
                >
                  {view.monthly[index]?.text}
                </Text>
              ) : null}
              <Growing
                axis="y"
                order={index}
                style={[
                  styles.fill,
                  { height: `${bar.height}%`, backgroundColor: ink.chart1 },
                  bar.peak ? undefined : styles.quiet,
                ]}
              />
            </View>
            <Text
              variant="caption"
              style={[{ color: ink.tertiary }, paper ? styles.namePaper : undefined]}
            >
              {months[index]}
            </Text>
          </View>
        ))}
      </View>
      <Text
        variant="body-sm"
        style={[styles.sub, { color: ink.secondary }, paper ? PAPER_TYPE.sub : undefined]}
      >
        <FigureLine
          sentence={words.average(view.average.text)}
          figure={view.average.text}
          figureColor={ink.text}
        />
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    marginTop: theme.spacing['sp-2'],
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
  figure: { flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing['sp-2'] },
  source: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  sourceWords: { flexShrink: 1 },
  bars: { marginTop: theme.spacing['sp-5'], height: 150, flexDirection: 'row', gap: 5 },
  barsPaper: { height: 330, gap: 12, marginTop: 44 },
  bar: { flex: 1, flexBasis: 0, minWidth: 0, alignItems: 'center', gap: 6 },
  column: { flex: 1, alignSelf: 'stretch', justifyContent: 'flex-end', alignItems: 'center' },
  fill: { width: '72%', borderTopLeftRadius: 6, borderTopRightRadius: 6, borderRadius: 3 },
  quiet: { opacity: 0.42 },
  value: { marginBottom: 6, fontWeight: '500', fontSize: 12, lineHeight: 16 },
  valuePaper: { fontSize: 15, lineHeight: 18 },
  namePaper: { fontSize: 13, lineHeight: 16 },
  sub: { marginTop: 6 },
});
