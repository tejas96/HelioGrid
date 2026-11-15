import { ShellGlyph } from '../AppShell/ShellGlyph';
import { HueTile } from '../HueTile';
import { useFormat } from '../MarketProvider/market-context';
import { ProvenanceTier } from '../Provenance';
import { BlockFigure, BlockOver, FigureLine } from './BlockParts';
import type { ProposalPriceWords } from './ProposalBlocks.parts.types';
import type { ProposalPriceBlockProps } from './ProposalBlocks.types';
import { type PriceView, priceView } from './ProposalBlocks.views';

/** The middle dot between two facts of one line: a mark, not a word. */
const DOT = ' · ';

function PriceFacts({ price, words }: { price: PriceView; words: ProposalPriceWords }) {
  return (
    <>
      {price.tax === null ? (
        words.noTax
      ) : (
        <FigureLine sentence={words.includesTax(price.tax.text)} figure={price.tax.text} />
      )}
      {price.discount === null ? null : (
        <>
          {DOT}
          <FigureLine sentence={words.discount(price.discount.text)} figure={price.discount.text} />
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
  incentive,
  words,
}: {
  incentive: NonNullable<PriceView['incentive']>;
  words: ProposalPriceWords;
}) {
  return (
    <div className="hg-pb-pair">
      <div className="hg-pb-fact">
        <HueTile glyph="download" hue="success" size={36} stroke={1.7} />
        <span className="hg-pb-fact-words">
          <span className="hg-pb-fact-name">{words.incentive}</span>
          <span className="hg-pb-fact-value hg-pb-mono">{incentive.amount.text}</span>
          {incentive.amountTier === null ? null : <ProvenanceTier tier={incentive.amountTier} />}
        </span>
      </div>
      <div className="hg-pb-fact">
        <HueTile glyph="house" hue="ocean" size={36} stroke={1.7} />
        <span className="hg-pb-fact-words">
          <span className="hg-pb-fact-name">{words.netCost}</span>
          <span className="hg-pb-fact-value hg-pb-mono">{incentive.netCost.text}</span>
          {incentive.netCostTier === null ? null : <ProvenanceTier tier={incentive.netCostTier} />}
        </span>
      </div>
    </div>
  );
}

function MarginStrip({
  margin,
  words,
}: {
  margin: NonNullable<PriceView['margin']>;
  words: ProposalPriceWords;
}) {
  const sentence = (margin.loss ? words.loss : words.margin)(
    margin.amount.text,
    margin.percentText,
  );
  return (
    <div className="hg-pb-margin" data-loss={margin.loss ? '' : undefined}>
      <ShellGlyph name="eye-off" size="sm" />
      <span>
        <FigureLine sentence={sentence} figure={margin.amount.text} />
      </span>
      <span className="hg-pb-margin-aside">{words.onlyYou}</span>
    </div>
  );
}

/**
 * The price (`M06-35`): what the customer pays the company as the one large figure, its tax, and —
 * as information beside it, never taken off it — the incentive the customer receives and their net
 * cost after it. A payable at or below zero is shown as it is, in the danger ink, with its line
 * (`M06-36`). The margin is drawn only when the caller holds it and hands it over (`M06-37`).
 */
export function ProposalPriceBlock({ mode, money, words }: ProposalPriceBlockProps) {
  const price = priceView(money, mode, useFormat());
  const { bad } = price;
  return (
    <div className="hg-pb hg-pb-price" data-mode={mode}>
      <BlockOver overline={words.overline} tier={price.tier} />
      <div className="hg-pb-price-main" data-bad={bad ? '' : undefined}>
        <BlockFigure figure={price.payable} />
      </div>
      <p className="hg-pb-sub">
        {bad ? (
          <span className="hg-pb-bad-line" role="status">
            <ShellGlyph name="alert-circle" size="sm" tone="danger" />
            {words.aboveZero}
          </span>
        ) : (
          <PriceFacts price={price} words={words} />
        )}
      </p>
      {price.incentive === null ? null : (
        <IncentivePair incentive={price.incentive} words={words} />
      )}
      {price.margin === null ? null : <MarginStrip margin={price.margin} words={words} />}
      {mode === 'app' || words.basis === undefined ? null : (
        <p className="hg-pb-honest" data-print="always">
          {words.basis}
        </p>
      )}
    </div>
  );
}
