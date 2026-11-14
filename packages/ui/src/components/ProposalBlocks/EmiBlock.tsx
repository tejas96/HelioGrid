import { useFormat } from '../MarketProvider/market-context';
import { ProvenanceTier } from '../Provenance';
import type { ProposalEmiBlockProps } from './ProposalBlocks.types';
import { emiView } from './ProposalBlocks.views';

/**
 * The EMI example (`M06-40`): the monthly payment beside the monthly saving, each with its tier
 * (`F8-01`), and the projection's
 * line — its assumptions, and that it is an example and no loan offer (`F5-42`).
 */
export function ProposalEmiBlock({ mode, emi, savings, words }: ProposalEmiBlockProps) {
  const view = emiView(emi, savings, useFormat());
  return (
    <div className="hg-pb hg-pb-emi" data-mode={mode}>
      <div className="hg-pb-emi-pair">
        <div>
          <span className="hg-pb-trio-value">{view.monthly.text}</span>
          <span className="hg-pb-trio-name">{words.monthlyLabel(view.months)}</span>
          <ProvenanceTier tier={view.monthlyTier} />
        </div>
        {view.monthlySaving === null ? null : (
          <div>
            <span className="hg-pb-trio-value">{view.monthlySaving.text}</span>
            <span className="hg-pb-trio-name">{words.savingLabel}</span>
            {view.savingTier === null ? null : <ProvenanceTier tier={view.savingTier} />}
          </div>
        )}
      </div>
      <p className="hg-pb-honest" data-print="always">
        {words.projection}
      </p>
    </div>
  );
}
