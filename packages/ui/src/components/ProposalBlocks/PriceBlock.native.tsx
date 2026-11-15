import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import {
  BlockFigure,
  BlockOver,
  BlockTier,
  BlockTile,
  FigureLine,
  InkGlyph,
  MONO,
  PAPER_TYPE,
} from './BlockParts.native';
import { type BlockInk, useBlockInk } from './block-ink.native';
import type { ProposalPriceWords } from './ProposalBlocks.parts.types';
import type { ProposalBlockMode, ProposalPriceBlockProps } from './ProposalBlocks.types';
import { type PriceView, priceView } from './ProposalBlocks.views';

/** The middle dot between two facts of one line: a mark, not a word. */
const DOT = ' · ';

function PriceFacts({
  price,
  words,
  ink,
}: {
  price: PriceView;
  words: ProposalPriceWords;
  ink: BlockInk;
}) {
  return (
    <>
      {price.tax === null ? (
        words.noTax
      ) : (
        <FigureLine
          sentence={words.includesTax(price.tax.text)}
          figure={price.tax.text}
          figureColor={ink.text}
        />
      )}
      {price.discount === null ? null : (
        <>
          {DOT}
          <FigureLine
            sentence={words.discount(price.discount.text)}
            figure={price.discount.text}
            figureColor={ink.text}
          />
        </>
      )}
      {price.perKw === null ? null : (
        <>
          {DOT}
          <FigureLine sentence={words.perKw(price.perKw.text)} figure={price.perKw.text} quiet />
        </>
      )}
    </>
  );
}

function IncentivePair({
  mode,
  incentive,
  words,
  ink,
}: {
  mode: ProposalBlockMode;
  incentive: NonNullable<PriceView['incentive']>;
  words: ProposalPriceWords;
  ink: BlockInk;
}) {
  const paper = mode === 'paper';
  const fact = [styles.fact, { backgroundColor: ink.fill }, paper ? styles.factPaper : undefined];
  const name = [{ color: ink.secondary }, paper ? styles.factNamePaper : undefined];
  const value = [
    MONO,
    styles.factValue,
    { color: ink.text },
    paper ? styles.factValuePaper : undefined,
  ];
  return (
    <View style={styles.pair}>
      <View style={fact}>
        <BlockTile mode={mode} glyph="download" hue="success" size={36} />
        <View style={styles.factWords}>
          <Text variant="caption" style={name}>
            {words.incentive}
          </Text>
          <Text variant="mono" style={value}>
            {incentive.amount.text}
          </Text>
          {incentive.amountTier === null ? null : (
            <BlockTier mode={mode} tier={incentive.amountTier} />
          )}
        </View>
      </View>
      <View style={fact}>
        <BlockTile mode={mode} glyph="house" hue="ocean" size={36} />
        <View style={styles.factWords}>
          <Text variant="caption" style={name}>
            {words.netCost}
          </Text>
          <Text variant="mono" style={value}>
            {incentive.netCost.text}
          </Text>
          {incentive.netCostTier === null ? null : (
            <BlockTier mode={mode} tier={incentive.netCostTier} />
          )}
        </View>
      </View>
    </View>
  );
}

function MarginStrip({
  margin,
  words,
  ink,
}: {
  margin: NonNullable<PriceView['margin']>;
  words: ProposalPriceWords;
  ink: BlockInk;
}) {
  const { loss } = margin;
  const sentence = (loss ? words.loss : words.margin)(margin.amount.text, margin.percentText);
  const color = loss ? ink.dangerText : ink.successText;
  return (
    <View style={[styles.margin, { backgroundColor: loss ? ink.dangerBg : ink.successBg }]}>
      <InkGlyph name="eye-off" color={color} />
      <Text variant="body-sm" style={[styles.marginWords, { color }]}>
        <FigureLine sentence={sentence} figure={margin.amount.text} figureColor={color} />
      </Text>
      <Text variant="caption" style={{ color }}>
        {words.onlyYou}
      </Text>
    </View>
  );
}

/**
 * The price (`M06-35`): what the customer pays the company as the one large figure, its tax, and —
 * as information beside it, never taken off it — the incentive the customer receives and their net
 * cost after it. A payable at or below zero is shown as it is, in the danger ink, with its line
 * (`M06-36`). The margin is drawn only when the caller holds it and hands it over (`M06-37`).
 */
export function ProposalPriceBlock({ mode, money, words }: ProposalPriceBlockProps) {
  const ink = useBlockInk(mode);
  const paper = mode === 'paper';
  const price = priceView(money, mode, useFormat());
  const { bad } = price;
  return (
    <View>
      <BlockOver mode={mode} overline={words.overline} tier={price.tier} />
      <View style={styles.main}>
        <BlockFigure mode={mode} figure={price.payable} color={bad ? ink.dangerText : undefined} />
      </View>
      {bad ? (
        <View style={styles.badLine} accessibilityLiveRegion="polite">
          <InkGlyph name="alert-circle" color={ink.dangerText} />
          <Text variant="body-sm" style={[styles.badWords, { color: ink.dangerText }]}>
            {words.aboveZero}
          </Text>
        </View>
      ) : (
        <Text
          variant="body-sm"
          style={[styles.sub, { color: ink.secondary }, paper ? PAPER_TYPE.sub : undefined]}
        >
          <PriceFacts price={price} words={words} ink={ink} />
        </Text>
      )}
      {price.incentive === null ? null : (
        <IncentivePair mode={mode} incentive={price.incentive} words={words} ink={ink} />
      )}
      {price.margin === null ? null : <MarginStrip margin={price.margin} words={words} ink={ink} />}
      {mode === 'app' || words.basis === undefined ? null : (
        <Text
          variant="body-sm"
          style={[
            styles.honest,
            { borderTopColor: ink.lineSoft, color: paper ? ink.text : ink.secondary },
            paper ? PAPER_TYPE.sub : undefined,
          ]}
        >
          {words.basis}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  main: { marginTop: theme.spacing['sp-2'] },
  sub: { marginTop: 6 },
  badLine: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  badWords: { fontWeight: '500', flexShrink: 1 },
  pair: { marginTop: theme.spacing['sp-4'], flexDirection: 'row', gap: theme.spacing['sp-2'] },
  fact: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-md'],
  },
  factPaper: { paddingVertical: 16, paddingHorizontal: 18 },
  factWords: { flexShrink: 1, minWidth: 0 },
  factNamePaper: { fontSize: 14, lineHeight: 20 },
  factValue: { marginTop: theme.spacing['sp-0-5'], fontWeight: '500' },
  factValuePaper: { fontSize: 20, lineHeight: 28 },
  margin: {
    marginTop: theme.spacing['sp-3'],
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingVertical: 10,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-sm'],
  },
  marginWords: { flexGrow: 1, flexShrink: 1 },
  honest: {
    marginTop: theme.spacing['sp-4'],
    paddingTop: theme.spacing['sp-3'],
    borderTopWidth: 1,
  },
});
