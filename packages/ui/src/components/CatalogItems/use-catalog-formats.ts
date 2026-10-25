import { useMemo } from 'react';
import { useFormat } from '../MarketProvider/market-context';

/**
 * The market's number, money and percent formats as the catalog's words take them — bound once,
 * so neither app re-binds them. A percent is the market's number with the % sign, never translated.
 */
export function useCatalogFormats() {
  const format = useFormat();
  return useMemo(
    () => ({
      number: (value: number) => format.number(value),
      money: (amount: string) => format.money(Number(amount)),
      percent: (pct: string) => `${format.number(Number(pct))}%`,
      /** A margin keeps its tenth even when whole — the boards write *18.0%*. */
      margin: (pct: string) =>
        `${format.number(Number(pct), { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`,
      date: (value: string) => format.date(value),
      /** The calendar year a date falls in — a version list's group. */
      year: (value: string) => String(new Date(value).getFullYear()),
    }),
    [format],
  );
}
