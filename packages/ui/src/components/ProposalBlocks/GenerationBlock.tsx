import type { CSSProperties } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { useFormat } from '../MarketProvider/market-context';
import { BlockFigure, BlockOver, FigureLine } from './BlockParts';
import { monthBars, riseOrder } from './ProposalBlocks.logic';
import type { ProposalGenerationBlockProps } from './ProposalBlocks.types';
import { generationView } from './ProposalBlocks.views';

/** A bar's own height and place in the stagger ride into the stylesheet as custom properties. */
type BarVars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * A year of generation (`M06-10`): the annual figure with its tier and its source label (`F8-08`),
 * twelve bars with the best month marked and named, and the average month in words. The bars are a
 * picture of the figures beside them; the chart is named whole for a screen reader.
 */
export function ProposalGenerationBlock({
  mode,
  generation,
  tier,
  words,
}: ProposalGenerationBlockProps) {
  const format = useFormat();
  const view = generationView(generation, format);
  /* Twelve columns hold a whole short name on paper and where the block has the room; a phone's
     columns take the month's letter. The stylesheet picks one by the block's own width. */
  const short = format.monthNames('short');
  const narrow = format.monthNames('narrow');
  const { peak } = view;
  const bars = monthBars(generation.monthlyKwh, peak);
  return (
    <div className="hg-pb hg-pb-gen" data-mode={mode}>
      <BlockOver overline={words.overline} tier={tier} />
      <div className="hg-pb-top">
        <div>
          <BlockFigure figure={view.annual} />
          <span className="hg-pb-unit">{words.perYear}</span>
        </div>
        {words.source === undefined ? null : (
          <span className="hg-pb-source">
            <ShellGlyph name="sun" size="sm" />
            {words.source}
          </span>
        )}
      </div>
      <div
        className="hg-pb-bars"
        role="img"
        aria-label={words.chart(format.monthNames('long')[peak] ?? '')}
      >
        {bars.map((bar, index) => {
          const vars: BarVars = { '--hg-pb-bar': `${bar.height}%`, '--i': riseOrder(index) };
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: twelve months in calendar order
            <div className="hg-pb-bar" key={index} data-peak={bar.peak ? '' : undefined}>
              <div className="hg-pb-bar-col" style={vars}>
                {bar.peak ? (
                  <span className="hg-pb-bar-value">{view.monthly[index]?.text}</span>
                ) : null}
                <i className="hg-pb-bar-fill" />
              </div>
              <span className="hg-pb-bar-name">
                <span data-form="short">{short[index]}</span>
                {mode === 'paper' ? null : <span data-form="narrow">{narrow[index]}</span>}
              </span>
            </div>
          );
        })}
      </div>
      <p className="hg-pb-sub">
        <FigureLine sentence={words.average(view.average.text)} figure={view.average.text} />
      </p>
    </div>
  );
}
