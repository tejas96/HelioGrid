import type { BillingHome } from '@heliogrid/contracts';

/**
 * A paid company's billing home as the billing flows read it back (`SCR-M12-02`, `SCR-M12-03`):
 * no flow in CI can drive a gateway, so a paid state is the company's own home in that state.
 */
const DAY = 86_400_000;

export const at = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString();

/** Growth, monthly, from the India price list (`BM-41`); the platform bills no GST yet (`F1-29`). */
export const GROWTH = { list: '3999.00', taxRateBasisPoints: null, tax: null, total: '3999.00' };
export const GROWTH_SHOWN = '3,999.00';

/** A paid company's home: Growth, monthly, a live mandate, one paid invoice. */
export function paidHome(home: BillingHome): BillingHome {
  return {
    ...home,
    standing: {
      ...home.standing,
      state: 'active',
      phase: 'active',
      tier: 'growth',
      cycle: 'monthly',
      collection: 'mandate',
      trialEndsAt: null,
      pausesAt: null,
      graceEndsAt: null,
      paidPeriodEnd: at(20),
    },
    plan: { listPrice: GROWTH.list, nextBill: { at: at(20), sale: GROWTH } },
    method: { standing: 'live', label: null, manageUrl: 'https://gateway.test/mandate' },
    invoices: {
      latest: [
        {
          id: '00000000-0000-4000-8000-000000000001',
          document: 'invoice',
          number: '2026-27/000902',
          status: 'paid',
          issuedAt: at(-10),
          tier: 'growth',
          cycle: 'monthly',
          total: GROWTH.total,
          hasPdf: false,
        },
      ],
      totalCount: 1,
    },
    cancellable: true,
  };
}
