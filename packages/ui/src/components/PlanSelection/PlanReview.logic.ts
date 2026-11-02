import { minorUnits } from '@heliogrid/domain';
import type { ResolvedMoney } from '../MoneySummary/MoneySummary.types';
import type { PlanReviewSection } from './PlanSelection.types';

/**
 * The money section as `MoneySummary`'s equation: every line and the total are the server's own
 * figures (`F4-04`) — nothing is summed here, and a total the server sent is the payable.
 */
export function moneyOf(section: Extract<PlanReviewSection, { kind: 'money' }>): ResolvedMoney {
  return {
    lines: section.lines.map((line) => ({
      key: line.key,
      label: line.label,
      amount: line.amount,
      kind: 'add',
    })),
    gross: section.total,
    deductions: minorUnits(0),
    payable: section.total,
    zeroOrBelow: false,
    unresolved: [],
    reconciliation: null,
    payableStandsUp: true,
  };
}
