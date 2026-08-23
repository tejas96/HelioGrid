/* How a StatCard's headline number is written — platform-neutral, so both halves print the same
   figure. The market pack formats it (F1 / F3-20) rather than the caller pre-formatting it; a
   STRING value is the one case where the caller genuinely owns the text, and it is passed through
   untouched. */

import type { MarketFormat } from '../../utils/format';

export function formatStatValue(
  value: string | number,
  {
    money,
    compact,
    format,
  }: {
    money: boolean;
    compact: boolean;
    format: MarketFormat;
  },
): string {
  if (typeof value !== 'number') {
    return value;
  }
  if (money) {
    return compact ? format.compactMoney(value) : format.money(value);
  }
  return compact ? format.compact(value) : format.number(value, { maximumFractionDigits: 0 });
}
