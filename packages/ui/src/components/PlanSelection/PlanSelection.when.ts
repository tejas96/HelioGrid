import type { PlanChangePreview } from '@heliogrid/contracts';
import type { BillingCycle, Tier } from '@heliogrid/domain';
import { figure } from '../BillingHome/BillingHome.values';
import { row } from './PlanSelection.changes';
import type { PlanSelectionInput } from './PlanSelection.state';
import type { PlanReviewRow, PlanReviewView } from './PlanSelection.types';

/** `When it starts`: the swap's date and what each cycle bills from then; a downgrade owes nothing today. */
export function whenRowsOf(input: PlanSelectionInput, preview: PlanChangePreview): PlanReviewRow[] {
  const { words, format } = input;
  const date = (value: string) => format.date(value);
  const then: PlanReviewRow = {
    key: 'then',
    label: words.fromThen(preview.to.cycle),
    value: figure(format.money(preview.afterwards.total, { fractionDigits: 2 })),
    amount: true,
    mark:
      preview.afterwards.tax !== null && preview.taxScheme !== null
        ? words.withTax(preview.taxScheme)
        : null,
  };
  switch (preview.kind) {
    case 'downgrade':
      return [
        row('from', words.from, date(preview.startsAt)),
        row('cycle', words.thisCycle, words.noRefund),
        row('today', words.today, words.nothingToPay),
        then,
      ];
    case 'cycle_switch':
      return [row('starts', words.cycleStarts(preview.to.cycle), date(preview.startsAt)), then];
    case 'conversion':
      return [
        ...(preview.from === null
          ? [row('paid', words.paidCycleStarts, date(preview.startsAt))]
          : []),
        row('next', words.view.nextBill, date(preview.nextBillAt)),
        then,
      ];
    default:
      return [row('swaps', words.planSwaps, date(preview.startsAt)), then];
  }
}

/** The review's ONE act and its ONE line (decision 6); a cycle switch's act names the new cycle. */
export function actOf(
  input: PlanSelectionInput,
  preview: PlanChangePreview,
): PlanReviewView['act'] {
  const { words, format } = input;
  if (preview.kind === 'downgrade') return { label: words.scheduleDowngrade, line: null };
  if (preview.kind === 'cycle_switch')
    return { label: words.switchTo(preview.to.cycle), line: words.lineAtStart };
  const total = preview.today?.sale.total ?? '0';
  return { label: words.pay(format.money(total, { fractionDigits: 2 })), line: words.lineNow };
}

/**
 * A downgrade's `When it starts` while its preview is out (frames s13, s14): the paid period's end,
 * no refund, nothing today, and the picked plan's listed price for the cycle as the price list
 * prints it — a figure read as written, never worked out here.
 */
export function pendingWhenOf(
  input: PlanSelectionInput,
  picked: Tier,
  cycle: BillingCycle,
): PlanReviewRow[] {
  const { words, format } = input;
  const listed = input.book?.plans.find((row) => row.tier === picked)?.price;
  const price = listed?.kind === 'listed' ? listed.perCycle[cycle] : null;
  return [
    ...(input.heldPeriodEnd === null
      ? []
      : [row('from', words.from, format.date(input.heldPeriodEnd))]),
    row('cycle', words.thisCycle, words.noRefund),
    row('today', words.today, words.nothingToPay),
    ...(price === null
      ? []
      : [
          {
            key: 'then',
            label: words.fromThen(cycle),
            value: figure(format.money(price, { fractionDigits: 2 })),
            amount: true,
            mark: null,
          },
        ]),
  ];
}
