import type { CSSProperties } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { chartSlot } from '../Charts/chart-palette';
import { useFormat } from '../MarketProvider/market-context';
import { BlockOver } from './BlockParts';
import { riseOrder, slicedParts } from './ProposalBlocks.logic';
import type { ProposalSplitWords } from './ProposalBlocks.parts.types';
import type { ProposalSplitBlockProps } from './ProposalBlocks.types';
import { type SplitView, splitView } from './ProposalBlocks.views';

type RowVars = CSSProperties & Record<`--${string}`, number>;

/** The whole is a hundred percent; a share is printed as it is. */
const WHOLE = 100;
const percentText = (share: number | string): string => `${share}%`;

/** Whether the shares add up, in words beside the head: the whole as its figure, a gap as its line. */
function Verdict({ split, words }: { split: SplitView; words: ProposalSplitWords }) {
  if (split.state === 'met') {
    return (
      <span className="hg-pb-verdict" data-state="met">
        <ShellGlyph name="tick-small" size="sm" tone="success" />
        {percentText(WHOLE)}
      </span>
    );
  }
  const off = percentText(split.offText);
  return (
    <span className="hg-pb-verdict" data-state="off" role="status">
      <ShellGlyph name="alert-circle" size="sm" tone="warning" />
      {split.state === 'under' ? words.under(off) : words.over(off)}
    </span>
  );
}

/**
 * The payment plan (`M06-13`): one bar split by share, each part in its own chart colour, then a
 * row per part — its share, its name and the stage it falls due on, and its amount. Whether the
 * shares add up is said in words beside the head, never left to the bar; a shortfall also shows as
 * a hatched gap. Colour is never the only signal: each row repeats its swatch beside its words.
 */
export function ProposalSplitBlock({
  mode,
  tranches,
  amounts,
  tier,
  slice,
  words,
}: ProposalSplitBlockProps) {
  const split = splitView(tranches, amounts, words, useFormat());
  const { parts, allocatedPercent } = split;
  const head = slice?.head ?? true;
  return (
    <div className="hg-pb hg-pb-split" data-mode={mode}>
      {head ? (
        <>
          <BlockOver
            overline={words.overline}
            {...(tier === undefined || amounts === null ? {} : { tier })}
            aside={<Verdict split={split} words={words} />}
          />
          <div className="hg-pb-split-bar" role="img" aria-label={words.chart}>
            {parts.map((part, index) => (
              <i
                // biome-ignore lint/suspicious/noArrayIndexKey: a plan's parts keep their order and may repeat a name and a share
                key={index}
                className="hg-pb-split-part hg-charts-slot"
                data-slot={chartSlot(index)}
                style={{ flexGrow: part.percent }}
              />
            ))}
            {split.state === 'under' ? (
              <i className="hg-pb-split-gap" style={{ flexGrow: WHOLE - allocatedPercent }} />
            ) : null}
          </div>
        </>
      ) : null}
      <div className="hg-pb-split-rows">
        {slicedParts(parts, slice).map(({ part, index }) => {
          const vars: RowVars = { '--i': riseOrder(index) };
          return (
            <div className="hg-pb-split-row" key={index} style={vars}>
              <i className="hg-pb-split-dot hg-charts-slot" data-slot={chartSlot(index)} />
              <span className="hg-pb-split-share">{percentText(part.percent)}</span>
              <span className="hg-pb-split-words">
                <b>{part.label}</b>
                <span>{part.due}</span>
              </span>
              {part.amount === null ? null : (
                <span className="hg-pb-split-amount hg-pb-mono">{part.amount}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
