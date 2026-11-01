import type { BillingHome, BillingStanding, TranslatedText } from '@heliogrid/contracts';
import type {
  BillingNeedRow,
  BillingNeedsView,
  BillingValue,
  BillingWorkingPart,
} from './BillingHome.types';
import { dateRow, figure, plain } from './BillingHome.values';
import type { BillingInput, BillingViewWords } from './BillingHome.words';

type Sale = NonNullable<BillingHome['due']>['sale'];

/**
 * `Needs you` (decisions 1, 2, 14, 17): the need domain put in force, its rows and its ONE act.
 * Absent — not empty — when nothing needs the Owner.
 */
export function needsOf(input: BillingInput, home: BillingHome): BillingNeedsView | null {
  const { words, format, need } = input;
  const money = (amount: string) => format.money(amount, { fractionDigits: 2 });
  const base = { badge: null, dataKept: null, working: null, scope: null };
  const kept = { label: words.yourData, value: words.dataKept };
  switch (need) {
    case 'none':
      return null;
    case 'pay': {
      const { due } = home;
      if (due === null) return null;
      const grace = home.standing.graceEndsAt;
      return {
        ...base,
        title: words.needsYou,
        rows: [
          amountRow(
            'due',
            words.paymentFailed,
            { word: words.pastDue, tone: 'danger' },
            money(due.sale.total),
          ),
          ...(grace === null ? [] : [dateRow('until', words.graceEnds, format.date(grace))]),
        ],
        working: workingOf(input, home, due.sale, due.invoiceNumber),
        act: { label: words.pay, line: words.paidOnProvider },
      };
    }
    case 'renewal': {
      const { renewal } = home;
      if (renewal === null) return null;
      return {
        ...base,
        title: words.needsYou,
        rows: [
          amountRow(
            'renewal',
            words.renewalInvoice,
            { word: input.stripWords.issued, tone: 'info' },
            money(renewal.sale.total),
          ),
          dateRow('due', words.due, format.date(renewal.dueAt)),
        ],
        working: workingOf(input, home, renewal.sale, renewal.number),
        act: { label: words.pay, line: words.paidOnProvider },
      };
    }
    case 'refund': {
      const { refund } = home;
      if (refund === null) return null;
      return {
        ...base,
        title: words.needsYou,
        rows: [
          chipRow('refund', words.refundAvailable, { word: words.firstCycle, tone: 'info' }),
          dateRow('until', words.until, format.date(lastDayOf(refund.closesAt))),
        ],
        act: { label: words.askRefund, line: words.refundLine },
      };
    }
    case 'running': {
      const runsUntil = format.date(home.standing.paidPeriodEnd ?? home.standing.stateEnteredAt);
      return {
        ...base,
        title: words.needsYou,
        rows: [
          chipRow('state', words.subscription, {
            word: words.stateWord('cancelled'),
            tone: 'warning',
          }),
          dateRow('until', words.runsUntil, runsUntil),
        ],
        act: { label: words.reactivate, line: words.carriesOn(runsUntil) },
      };
    }
    case 'pick_plan':
      return {
        ...base,
        title: words.wayBack,
        rows: [stateRow(words, home.standing)],
        dataKept: kept,
        act: { label: words.pickPlan, line: words.pickPlanLine },
      };
    case 'way_back': {
      const back = home.reactivation;
      return {
        ...base,
        title: words.wayBack,
        rows: [
          stateRow(words, home.standing),
          ...(back === null
            ? []
            : [amountRow('owed', words.toReactivate, null, money(back.sale.total))]),
        ],
        dataKept: kept,
        working: back === null ? null : workingOf(input, home, back.sale, null),
        act: { label: words.reactivate, line: words.reactivateLine },
      };
    }
  }
}

/** The amount's working: what it is for, then the price with its tax once registered (`F1-29`). */
export function workingOf(
  input: BillingInput,
  home: BillingHome,
  sale: Sale,
  invoiceNumber: string | null,
): BillingNeedsView['working'] {
  const { words } = input;
  const tier = home.reactivation?.tier ?? home.standing.tier;
  const cycle = home.reactivation?.cycle ?? home.standing.cycle;
  if (tier === null || cycle === null) return null;
  const forWhat = words.forPlan(tier, cycle);
  const lead: BillingValue =
    invoiceNumber === null
      ? plain(`${forWhat}: `)
      : [
          { text: invoiceNumber, mono: true },
          { text: ` · ${forWhat}: `, mono: false },
        ];
  const parts: BillingWorkingPart[] = [
    { kind: 'formula', label: words.amount, value: [...lead, ...saleRuns(input, home, sale)] },
  ];
  return { label: words.theAmount, parts };
}

/** `₹3,999.00`, or `₹3,999.00 + 18% GST = ₹4,718.82` once the platform is registered. */
function saleRuns(input: BillingInput, home: BillingHome, sale: Sale): BillingValue {
  const money = (amount: string) => input.format.money(amount, { fractionDigits: 2 });
  if (sale.taxRateBasisPoints === null || home.taxScheme === null) return figure(money(sale.list));
  const BASIS_POINTS_PER_PERCENT = 100;
  const rate = input.format.number(sale.taxRateBasisPoints / BASIS_POINTS_PER_PERCENT);
  return [
    { text: money(sale.list), mono: true },
    { text: ` + ${rate}% ${home.taxScheme} = `, mono: false },
    { text: money(sale.total), mono: true },
  ];
}

function stateRow(words: BillingViewWords, standing: BillingStanding): BillingNeedRow {
  return chipRow('state', words.account, { word: words.stateWord(standing.state), tone: 'danger' });
}

function chipRow(key: string, title: TranslatedText, chip: BillingNeedRow['chip']): BillingNeedRow {
  return { key, title, chip, figure: null, line: null };
}

function amountRow(
  key: string,
  title: TranslatedText,
  chip: BillingNeedRow['chip'],
  amount: string,
): BillingNeedRow {
  return { key, title, chip, figure: figure(amount), line: null };
}

/** The window's last calendar day: the moment it closes is the next day's start (`M12-47`). */
function lastDayOf(closesAt: string): string {
  return new Date(Date.parse(closesAt) - 1).toISOString();
}
