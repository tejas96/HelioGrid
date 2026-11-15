import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Rising } from '../../primitives/rising.native';
import { Text } from '../../primitives/Text/Text.native';
import { chartColor } from '../Charts/ChartTokens.native';
import { chartSlot } from '../Charts/chart-palette';
import { useFormat } from '../MarketProvider/market-context';
import { BlockOver, InkGlyph, MONO } from './BlockParts.native';
import { type BlockInk, useBlockInk } from './block-ink.native';
import { Growing } from './Growing.native';
import { slicedParts } from './ProposalBlocks.logic';
import type { ProposalSplitWords } from './ProposalBlocks.parts.types';
import type { ProposalBlockMode, ProposalSplitBlockProps } from './ProposalBlocks.types';
import { type SplitView, splitView } from './ProposalBlocks.views';

const display = theme.type.families.display;
const LIGHT = theme.palettes.light;

/** The whole is a hundred percent; a share is printed as it is. */
const WHOLE = 100;
const percentText = (share: number | string): string => `${share}%`;

/** A part's chart colour: the scheme's on a screen, the light palette's on paper. */
function slotColor(mode: ProposalBlockMode, index: number): BlockInk['text'] {
  if (mode !== 'paper') return chartColor(index);
  const slot = chartSlot(index) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  return LIGHT[`chart-${slot}`];
}

/** Whether the shares add up, in words beside the head: the whole as its figure, a gap as its line. */
function Verdict({
  split,
  words,
  ink,
}: {
  split: SplitView;
  words: ProposalSplitWords;
  ink: BlockInk;
}) {
  const met = split.state === 'met';
  const off = percentText(split.offText);
  const color = met ? ink.successText : ink.warningText;
  return (
    <View style={styles.verdict} accessibilityLiveRegion={met ? 'none' : 'polite'}>
      <InkGlyph name={met ? 'tick-small' : 'alert-circle'} color={color} />
      <Text variant="caption" style={[styles.verdictWords, { color }]}>
        {met ? percentText(WHOLE) : split.state === 'under' ? words.under(off) : words.over(off)}
      </Text>
    </View>
  );
}

/**
 * The payment plan (`M06-13`): one bar split by share, each part in its own chart colour, then a
 * row per part — its share, its name and the stage it falls due on, and its amount. Whether the
 * shares add up is said in words beside the head, never left to the bar; a shortfall also shows as
 * an edged gap. Colour is never the only signal: each row repeats its swatch beside its words.
 */
export function ProposalSplitBlock({
  mode,
  tranches,
  amounts,
  tier,
  slice,
  words,
}: ProposalSplitBlockProps) {
  const ink = useBlockInk(mode);
  const paper = mode === 'paper';
  const split = splitView(tranches, amounts, words, useFormat());
  const { parts, allocatedPercent } = split;
  const head = slice?.head ?? true;
  return (
    <View>
      {head ? (
        <>
          <BlockOver
            mode={mode}
            overline={words.overline}
            {...(tier === undefined || amounts === null ? {} : { tier })}
            aside={<Verdict split={split} words={words} ink={ink} />}
          />
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={words.chart}
            style={[styles.bar, paper ? styles.barPaper : undefined]}
          >
            {parts.map((part, index) => (
              <Growing
                axis="x"
                order={index}
                // biome-ignore lint/suspicious/noArrayIndexKey: a plan's parts keep their order and may repeat a name and a share
                key={index}
                style={[
                  styles.segment,
                  { flexGrow: part.percent, backgroundColor: slotColor(mode, index) },
                ]}
              />
            ))}
            {split.state === 'under' ? (
              <View
                style={[
                  styles.segment,
                  styles.gap,
                  {
                    flexGrow: WHOLE - allocatedPercent,
                    backgroundColor: ink.warningBg,
                    borderColor: ink.warning,
                  },
                ]}
              />
            ) : null}
          </View>
        </>
      ) : null}
      <View style={styles.rows}>
        {slicedParts(parts, slice).map(({ part, index }, offset) => (
          <Rising key={index} order={offset}>
            <View
              style={[
                styles.row,
                paper ? styles.rowPaper : undefined,
                offset === 0 ? undefined : { borderTopWidth: 1, borderTopColor: ink.hairline },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: slotColor(mode, index) }]} />
              <Text
                variant="figure"
                style={[styles.share, { color: ink.text }, paper ? styles.sharePaper : undefined]}
              >
                {percentText(part.percent)}
              </Text>
              <View style={styles.words}>
                <Text
                  variant="body-sm"
                  style={[styles.name, { color: ink.text }, paper ? styles.namePaper : undefined]}
                >
                  {part.label}
                </Text>
                <Text
                  variant="caption"
                  style={[{ color: ink.secondary }, paper ? styles.stagePaper : undefined]}
                >
                  {part.due}
                </Text>
              </View>
              {part.amount === null ? null : (
                <Text
                  variant="mono"
                  style={[
                    MONO,
                    styles.amount,
                    { color: ink.text },
                    paper ? styles.amountPaper : undefined,
                  ]}
                >
                  {part.amount}
                </Text>
              )}
            </View>
          </Rising>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  verdict: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  verdictWords: { fontWeight: '500' },
  bar: { marginTop: theme.spacing['sp-4'], flexDirection: 'row', gap: 3, height: 14 },
  barPaper: { height: 18 },
  segment: { flexBasis: 0, minWidth: 6, borderRadius: 5 },
  gap: { borderWidth: 1 },
  rows: { marginTop: theme.spacing['sp-3'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: 10,
  },
  rowPaper: { paddingVertical: 14 },
  dot: { width: 10, height: 10, borderRadius: 10 },
  share: { minWidth: 46, fontFamily: display, fontSize: 20, lineHeight: 24 },
  sharePaper: { minWidth: 70, fontSize: 26, lineHeight: 30 },
  words: { flex: 1, minWidth: 0 },
  name: { fontWeight: '500' },
  namePaper: { fontSize: 16, lineHeight: 22 },
  stagePaper: { fontSize: 14, lineHeight: 20 },
  amount: { fontWeight: '500' },
  amountPaper: { fontSize: 17, lineHeight: 22 },
});
