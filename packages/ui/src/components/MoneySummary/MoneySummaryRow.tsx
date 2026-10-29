/* One member of the equation (web) — its label, whatever qualifies it, and its amount.

   AN UNRESOLVED LINE IS NOT A ZERO. It says so in the amount's own footprint, and the summary
   withholds the payable on the strength of it. */

import type { TranslatedText } from '@heliogrid/contracts';
import { useFormat } from '../MarketProvider';
import { signedLineAmount } from './MoneySummary.logic';
import type { MoneyLine } from './MoneySummary.types';

export function MoneySummaryRow({
  line,
  unresolved,
}: {
  line: MoneyLine;
  /** What an unresolved amount says in its own footprint — *not resolved yet*. */
  unresolved: TranslatedText;
}) {
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
          <span className="hg-money-summary-unresolved">{unresolved}</span>
        ) : (
          signedLineAmount(line.kind, line.amount, mkt)
        )}
      </span>
    </div>
  );
}
