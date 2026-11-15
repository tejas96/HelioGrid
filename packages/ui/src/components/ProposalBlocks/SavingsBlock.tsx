import type { CSSProperties } from 'react';
import { useFormat } from '../MarketProvider/market-context';
import { BlockFigure, BlockOver } from './BlockParts';
import { PaybackCurve } from './PaybackCurve';
import { billShare, paybackGeometry } from './ProposalBlocks.logic';
import type { ProposalSavingsBlockProps } from './ProposalBlocks.types';
import { savingsView } from './ProposalBlocks.views';

type BillVars = CSSProperties & Record<`--${string}`, string>;

/**
 * What the system saves (`M06-11`): the month as the one large figure, today's bill beside the bill
 * with solar, the savings adding up until they pass the net cost, and three figures under them.
 * Every figure here is a projection, so its assumptions are printed with it, never on hover
 * (`F8-23`, `F8-07`). A bill nobody gave draws no bars, and a saving that never pays the cost back
 * draws no payback.
 */
export function ProposalSavingsBlock({
  mode,
  savings,
  money,
  monthlyBill,
  words,
}: ProposalSavingsBlockProps) {
  const view = savingsView(savings, money, monthlyBill, useFormat());
  const { bills, payback } = view;
  const geometry = paybackGeometry(view.cumulative, view.netCost.amount, payback?.value ?? null);
  const after: BillVars = {
    '--hg-pb-bill': `${bills === null ? 0 : billShare(bills.withSolar.value, bills.today.value)}%`,
  };
  return (
    <div className="hg-pb hg-pb-save" data-mode={mode}>
      <BlockOver overline={words.overline} tier={view.tier} />
      <div className="hg-pb-top">
        <div>
          <BlockFigure figure={view.monthly} />
          <span className="hg-pb-unit">{words.perMonth}</span>
        </div>
      </div>
      {bills === null ? null : (
        <div className="hg-pb-bill">
          <div className="hg-pb-bill-row">
            <span className="hg-pb-bill-name">{words.billToday}</span>
            <span className="hg-pb-bill-track">
              <i className="hg-pb-bill-now" />
            </span>
            <b className="hg-pb-mono">{bills.today.text}</b>
          </div>
          <div className="hg-pb-bill-row">
            <span className="hg-pb-bill-name">{words.billWithSolar}</span>
            <span className="hg-pb-bill-track">
              <i className="hg-pb-bill-after" style={after} />
            </span>
            <b className="hg-pb-mono">{bills.withSolar.text}</b>
          </div>
        </div>
      )}
      {geometry === null ? null : (
        <div className="hg-pb-payback">
          <PaybackCurve
            geometry={geometry}
            name={payback === null ? words.chartNoPayback : words.chart(payback.text)}
            netCost={words.netCost(view.netCost.text)}
            firstYear={words.firstYear}
            lastYear={words.lastYear(view.horizonYears)}
          />
        </div>
      )}
      <div className="hg-pb-trio">
        {payback === null ? null : (
          <div>
            <span className="hg-pb-trio-value">{words.paybackValue(payback.text)}</span>
            <span className="hg-pb-trio-name">{words.paybackLabel}</span>
          </div>
        )}
        <div>
          <span className="hg-pb-trio-value">{view.lifetime.text}</span>
          <span className="hg-pb-trio-name">{words.lifetimeLabel(view.horizonYears)}</span>
        </div>
        <div>
          <span className="hg-pb-trio-value">{view.yearly.text}</span>
          <span className="hg-pb-trio-name">{words.yearlyLabel}</span>
        </div>
      </div>
      <p className="hg-pb-honest" data-print="always">
        {words.projection}
      </p>
    </div>
  );
}
