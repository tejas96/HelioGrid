import type { PlanChangePreview } from '@heliogrid/contracts';
import { at, GROWTH } from './billing-home';

/**
 * Each pick's preview as `billingPlanChangeContract` shapes it (`SCR-M12-03`), for the plans flow:
 * the board's own figures — Growth monthly, 16 of 30 days left in the cycle.
 */
const SALE = (list: string) => ({ list, taxRateBasisPoints: null, tax: null, total: list });
const INCLUDES = (kw: number, proposals: number | 'unlimited', storage: number) => ({
  designCeilingKw: kw,
  proposalsPerMonth: proposals,
  activeProjects: 'unlimited' as const,
  voiceMinutesIncluded: 0,
  voiceMinuteRate: '6.00',
  storageGb: storage,
});

/** Growth → Pro, 16 of 30 days left: ₹3,200.00 today (the board's figures, RFC decision 3). */
export function previewOf(tier: string, cycle: string): PlanChangePreview {
  const base: PlanChangePreview = {
    kind: 'upgrade',
    from: { tier: 'growth', cycle: 'monthly' },
    to: { tier: 'pro', cycle: 'monthly' },
    currencyCode: 'INR',
    taxScheme: null,
    priceListPublishedAt: at(-100),
    includes: { from: INCLUDES(500, 300, 50), to: INCLUDES(5000, 1500, 250) },
    today: {
      sale: SALE('3200.00'),
      partCycle: {
        daysLeft: 16,
        daysInCycle: 30,
        fromPrice: '3999.00',
        toPrice: '9999.00',
        toCycleDays: 30,
        difference: '6000.00',
        fromDayRate: '133.30',
        toDayRate: '333.30',
      },
    },
    startsAt: at(16),
    nextBillAt: at(16),
    afterwards: SALE('9999.00'),
    blocks: null,
    digest: 'e2e',
  };
  if (tier === 'starter') {
    return {
      ...base,
      kind: 'downgrade',
      to: { tier: 'starter', cycle: 'monthly' },
      includes: { from: INCLUDES(500, 300, 50), to: INCLUDES(50, 30, 10) },
      today: null,
      afterwards: SALE('1999.00'),
      blocks: [{ block: 'storage', used: 32_000_000_000, limit: 10 }],
    };
  }
  if (tier === 'growth' && cycle === 'yearly') {
    return {
      ...base,
      kind: 'cycle_switch',
      to: { tier: 'growth', cycle: 'yearly' },
      includes: { from: INCLUDES(500, 300, 50), to: INCLUDES(500, 300, 50) },
      today: {
        sale: SALE('0.00'),
        partCycle: {
          daysLeft: 16,
          daysInCycle: 30,
          fromPrice: '3999.00',
          toPrice: '39990.00',
          toCycleDays: 365,
          difference: null,
          fromDayRate: '133.30',
          toDayRate: '109.56',
        },
      },
      afterwards: SALE('39990.00'),
    };
  }
  return base;
}

/** A trial's or an ended trial's pick of Growth: the first month today, no part-cycle. */
export function conversionOf(): PlanChangePreview {
  return {
    ...previewOf('pro', 'monthly'),
    kind: 'conversion',
    from: null,
    to: { tier: 'growth', cycle: 'monthly' },
    includes: { from: INCLUDES(100_000, 'unlimited', 5), to: INCLUDES(500, 300, 50) },
    today: { sale: GROWTH, partCycle: null },
    startsAt: at(0),
    nextBillAt: at(30),
    afterwards: GROWTH,
  };
}
