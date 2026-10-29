/* What the summary SAYS when it will not print a price — platform-neutral, so both halves say it
   in the same words.

   SCR-M06-14: a disagreement between the BOM total and the price is a DEFECT, not a display
   difference, so the payable is withheld and the two figures are named with the distance between
   them. An unresolved line is the other reason, and it is not a zero. Either way the sentence names
   the gap rather than leaving a reader to spot it. */

import type { TranslatedText } from '@heliogrid/contracts';
import { minorUnits } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import type { MoneySummaryWords, ResolvedMoney } from './MoneySummary.types';

export function noPriceSentence(
  money: ResolvedMoney,
  mkt: MarketFormat,
  words: MoneySummaryWords,
): TranslatedText {
  const rec = money.reconciliation;
  if (rec !== null && !rec.agrees) {
    return words.disagrees({
      label: rec.label,
      amount: mkt.amount(rec.amount),
      againstLabel: rec.againstLabel,
      target: mkt.amount(rec.target),
      gap: mkt.amount(minorUnits(Math.abs(rec.delta))),
    });
  }
  return words.unresolved(money.unresolved.length);
}

/** No price prints when the reconciliation failed or a line has not resolved. */
export function isPriceWithheld(money: ResolvedMoney): boolean {
  const defect = money.reconciliation !== null && !money.reconciliation.agrees;
  return defect || money.unresolved.length > 0;
}
