import type { MinorUnits } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import type { MoneyLine } from './MoneySummary.types';

/** A line's key: its own, or its label where the caller gave none. */
export function moneyLineKey(line: MoneyLine): string {
  return line.key || line.label;
}

/**
 * A resolved line's amount as printed. A deduction carries its sign here rather than in the
 * arithmetic: `amount` is a magnitude and `kind` is what it does to the total.
 */
export function signedLineAmount(
  kind: MoneyLine['kind'],
  amount: MinorUnits,
  mkt: MarketFormat,
): string {
  return `${kind === 'deduct' ? '− ' : ''}${mkt.amount(amount)}`;
}
