/* What the summary SAYS when it will not print a price — platform-neutral, so both halves say it
   in the same words.

   SCR-M06-14: a disagreement between the BOM total and the price is a DEFECT, not a display
   difference, so the payable is withheld and the two figures are named with the distance between
   them. An unresolved line is the other reason, and it is not a zero. Either way the sentence names
   the gap rather than leaving a reader to spot it. */

import type { MarketFormat } from '../../utils/format';
import type { ResolvedMoney } from '../../utils/money-lines';

export function noPriceSentence(money: ResolvedMoney, mkt: MarketFormat): string {
  const rec = money.reconciliation;
  if (rec !== null && !rec.agrees) {
    return `${rec.label} totals ${mkt.money(rec.amount)} and ${rec.againstLabel} is ${mkt.money(rec.target)} — ${mkt.money(Math.abs(rec.delta))} apart. A disagreement is a defect, so no price is shown until the two reconcile.`;
  }
  const count =
    money.unresolved.length === 1 ? 'One line has' : `${money.unresolved.length} lines have`;
  return `${count} no resolved amount yet, so the payable is not shown. Nothing here is an estimate standing in for a figure.`;
}
