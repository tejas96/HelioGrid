/* One member of the equation (web) — its label, whatever qualifies it, and its amount.

   AN UNRESOLVED LINE IS NOT A ZERO. It says so in the amount's own footprint, and the summary
   withholds the payable on the strength of it. A deduction carries its sign here rather than in the
   arithmetic: `amount` is a magnitude and `kind` is what it does to the total. */

import type { MoneyLine } from '../../utils/money-lines';
import { useFormat } from '../MarketProvider';

export function MoneySummaryRow({ line }: { line: MoneyLine }) {
  const mkt = useFormat();
  return (
    <div data-keep-together="" className="hg-money-summary-row">
      <span className="hg-money-summary-label">
        {line.label}
        {line.note ? <span className="hg-money-summary-line-note">{line.note}</span> : null}
      </span>
      <span className="hg-money-summary-amount" data-strong={line.strong ? 'true' : undefined}>
        {line.amount === null ? (
          /* An unresolved line is not a zero. It says so, in its own footprint. */
          <span className="hg-money-summary-unresolved">not resolved yet</span>
        ) : (
          `${line.kind === 'deduct' ? '− ' : ''}${mkt.money(line.amount)}`
        )}
      </span>
    </div>
  );
}
