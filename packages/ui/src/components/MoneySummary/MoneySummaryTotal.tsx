/* What the lines add up to (web) — or the reason they do not add up to a price.

   NO PRICE. A failed reconciliation is a defect (SCR-M06-14) and an unresolved line is not a zero,
   so on either the payable is not printed at all and `noPriceSentence` names the gap instead.

   Otherwise: the payable — shown even at or below zero, with the warning M06-35 asks for — the
   tier the payable was arrived at, and the reconciliation that agreed. */

import { useFormat } from '../MarketProvider';
import { renderProvenance } from '../Provenance';
import { isPriceWithheld, noPriceSentence } from './MoneySummary.sentences';
import type { MoneySummaryProps, MoneySummaryWords, ResolvedMoney } from './MoneySummary.types';

export function MoneySummaryTotal({
  money,
  words,
  payableLabel,
  provenance,
  note,
}: {
  /** The server's resolved equation — the one money path (`F4-04`). */
  money: ResolvedMoney;
  words: MoneySummaryWords;
  payableLabel: string;
  provenance?: MoneySummaryProps['provenance'];
  note?: MoneySummaryProps['note'];
}) {
  const mkt = useFormat();

  return (
    <div data-keep-together="" className="hg-money-summary-total">
      {isPriceWithheld(money) ? (
        <p role="alert" className="hg-money-summary-defect">
          {noPriceSentence(money, mkt, words)}
        </p>
      ) : (
        <>
          <div className="hg-money-summary-payable">
            <span className="hg-money-summary-payable-label">{payableLabel}</span>
            <span className="hg-money-summary-payable-value">{mkt.amount(money.payable)}</span>
          </div>
          {money.zeroOrBelow ? (
            <p role="alert" className="hg-money-summary-below-zero">
              {words.belowZero(mkt.amount(money.payable))}
            </p>
          ) : null}
          {provenance ? (
            <div className="hg-money-summary-provenance">
              {renderProvenance(provenance, { size: 12 })}
            </div>
          ) : null}
          {money.reconciliation?.agrees ? (
            <p className="hg-money-summary-reconciled">
              {words.reconciles(
                money.reconciliation.label,
                mkt.amount(money.reconciliation.amount),
              )}
            </p>
          ) : null}
        </>
      )}
      {note ? <p className="hg-money-summary-note">{note}</p> : null}
    </div>
  );
}
