import type { PlanChangePreview, PublicPricingRead } from '@heliogrid/contracts';

/**
 * The plans' records (`SCR-M12-03`) for `billing-origin.ts`: the India price list as the public
 * pricing read answers it, and a pick's preview in the contract's shape (`billing-plan-change.ts`).
 */
export const PAGE_URL = 'https://pay.example/plan-change';
const AT = '2026-09-15T00:00:00.000Z';
const PERIOD_END = '2026-10-01T00:00:00.000Z';

const sale = (list: string) => ({ list, taxRateBasisPoints: null, tax: null, total: list });

const includes = (kw: number, proposals: number | 'unlimited', storage: number) => ({
  designCeilingKw: kw,
  proposalsPerMonth: proposals,
  activeProjects: 'unlimited' as const,
  voiceMinutesIncluded: 0,
  voiceMinuteRate: '6.00',
  storageGb: storage,
});

const plan = (tier: 'starter' | 'growth' | 'pro', monthly: string, yearly: string) => ({
  tier,
  price: { kind: 'listed' as const, perCycle: { monthly, yearly } },
  designCeilingKw: 500,
  proposalsPerMonth: 300,
  activeProjects: 'unlimited' as const,
  voiceMinutesIncluded: 0,
  voiceMinuteRate: { kind: 'published' as const, rate: '6.00' },
  storageGb: 50,
});

export const BOOK: PublicPricingRead = {
  market: 'IN',
  publishedAt: '2026-04-01T00:00:00.000Z',
  currencyCode: 'INR',
  plans: [
    plan('starter', '1999.00', '19990.00'),
    plan('growth', '3999.00', '39990.00'),
    plan('pro', '9999.00', '99999.00'),
    {
      ...plan('pro', '0', '0'),
      tier: 'enterprise',
      price: { kind: 'anchored', from: '24999.00', per: 'monthly' },
    },
  ],
  trial: {
    days: 14,
    designCeilingKw: 100_000,
    proposalsPerMonth: 'unlimited',
    voiceMinutes: 15,
    storageGb: 5,
  },
  comparisons: [],
  benchmarkSources: [],
  taxScheme: 'GST',
  taxExcluded: true,
  salesContact: 'sales@heliogrid.example',
};

export const TENANT_READ = {
  id: '01a40000-0000-7000-8000-000000000001',
  companyName: 'Suryodaya Solar',
  city: 'Pune',
  marketCode: 'IN',
  currencyCode: 'INR',
  defaultLanguage: 'en',
  timezone: 'Asia/Kolkata',
  segment: null,
  typicalSystemKwp: null,
};

/** Growth → Pro, 16 of 30 days left: ₹3,200.00 today (decision 3's board figures). */
export function upgradeOf(digest = 'digest-1'): PlanChangePreview {
  return {
    kind: 'upgrade',
    from: { tier: 'growth', cycle: 'monthly' },
    to: { tier: 'pro', cycle: 'monthly' },
    currencyCode: 'INR',
    taxScheme: null,
    priceListPublishedAt: AT,
    includes: { from: includes(500, 300, 50), to: includes(5000, 1500, 250) },
    today: {
      sale: sale('3200.00'),
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
    startsAt: PERIOD_END,
    nextBillAt: PERIOD_END,
    afterwards: sale('9999.00'),
    blocks: null,
    digest,
  };
}

/** Growth → Starter over the lower plan's storage: `used` bytes against 10 GB. */
export function downgradeOf(used: number, digest = 'digest-1'): PlanChangePreview {
  return {
    ...upgradeOf(digest),
    kind: 'downgrade',
    to: { tier: 'starter', cycle: 'monthly' },
    includes: { from: includes(500, 300, 50), to: includes(50, 30, 10) },
    today: null,
    afterwards: sale('1999.00'),
    blocks: [{ block: 'storage', used, limit: 10 }],
  };
}

/** A trial's conversion to Growth: the first month today, its paid cycle from now. */
export function conversionOf(): PlanChangePreview {
  return {
    ...upgradeOf(),
    kind: 'conversion',
    from: null,
    to: { tier: 'growth', cycle: 'monthly' },
    includes: { from: includes(100_000, 'unlimited', 5), to: includes(500, 300, 50) },
    today: { sale: sale('3999.00'), partCycle: null },
    afterwards: sale('3999.00'),
  };
}
