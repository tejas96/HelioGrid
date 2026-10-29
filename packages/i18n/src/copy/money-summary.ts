/**
 * The `MoneySummary` block's own words (`packages/ui`'s `MoneySummaryWords`): the payable's word,
 * the overline, an unresolved line, and the sentences it says when it will not print a price
 * (`SCR-M06-14`) or prints one at or below zero (`M06-35`). The figures arrive formatted.
 */
import type { Translator } from '../runtime';

const MONEY_SUMMARY = {
  payable: /*i18n*/ { id: 'Payable' },
  overline: /*i18n*/ { id: 'Money summary' },
  unresolvedLine: /*i18n*/ { id: 'not resolved yet' },
  disagrees: /*i18n*/ {
    id: '{label} totals {amount} and {against} is {target} — {gap} apart. A disagreement is a defect, so no price is shown until the two reconcile.',
  },
  unresolved: /*i18n*/ {
    id: '{count, plural, one {One line has no resolved amount yet, so the payable is not shown. Nothing here is an estimate standing in for a figure.} other {# lines have no resolved amount yet, so the payable is not shown. Nothing here is an estimate standing in for a figure.}}',
  },
  belowZero: /*i18n*/ {
    id: 'The deductions bring the payable to {payable}. A figure at or below zero is not a refund — a warning here, a block at Generate.',
  },
  reconciles: /*i18n*/ { id: '{label} reconciles · {amount}' },
} as const;

/** The two figures a failed reconciliation names — the server's names, the pack's formatting. */
interface MoneyDisagreement {
  readonly label: string;
  readonly amount: string;
  readonly againstLabel: string;
  readonly target: string;
  readonly gap: string;
}

/** Every word `MoneySummary` says itself, in the reader's language. */
export function moneySummaryWords(t: Translator['t']) {
  return {
    payable: t(MONEY_SUMMARY.payable),
    overline: t(MONEY_SUMMARY.overline),
    unresolvedLine: t(MONEY_SUMMARY.unresolvedLine),
    disagrees: (figures: MoneyDisagreement) =>
      t(MONEY_SUMMARY.disagrees, {
        label: figures.label,
        amount: figures.amount,
        against: figures.againstLabel,
        target: figures.target,
        gap: figures.gap,
      }),
    unresolved: (count: number) => t(MONEY_SUMMARY.unresolved, { count }),
    belowZero: (payable: string) => t(MONEY_SUMMARY.belowZero, { payable }),
    reconciles: (label: string, amount: string) => t(MONEY_SUMMARY.reconciles, { label, amount }),
  };
}
