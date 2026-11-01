import type { BillingDocumentRow, BillingHome } from '@heliogrid/contracts';

/**
 * The billing origin's records (`billing-origin.ts`): a home in any state, the needs a test adds
 * to it, and the record lists' rows, in the contract's shapes.
 */
export const PAY_URL = 'https://pay.example/due';
export const RENEWAL_URL = 'https://pay.example/renewal';
export const CHECKOUT_URL = 'https://pay.example/checkout';
export const SIGNED_URL = 'https://files.example/invoice.pdf';
export const RUNS_UNTIL = '2026-12-01T00:00:00.000Z';
export const CREDIT_NOTE = 'CN-0001';
export const DOCUMENT_ID = '01a40000-0000-7000-8000-000000000999';
const AT = '2026-10-25T10:00:00.000Z';
const LATER = '2026-12-01T00:00:00.000Z';

const money = (list: string) => ({
  list,
  taxRateBasisPoints: null,
  tax: null,
  total: list,
});

const label = (n: number) => `01a40000-0000-7000-8000-${String(n).padStart(12, '0')}`;

/** A home in `state`, holding nothing that needs the Owner until a test says what. */
export function homeOf(state: BillingHome['standing']['state'], over: Partial<BillingHome> = {}) {
  const phase =
    state === 'cancelled'
      ? 'cancelled_post_period'
      : state === 'past_due'
        ? 'past_due_full_function'
        : state;
  return {
    standing: {
      state,
      phase,
      tier: state === 'trialing' ? null : 'growth',
      cycle: state === 'trialing' ? null : 'monthly',
      collection: null,
      stateEnteredAt: AT,
      trialEndsAt: null,
      pausesAt: null,
      graceEndsAt: null,
      paidPeriodEnd: null,
    },
    currencyCode: 'INR',
    taxScheme: null,
    priceListPublishedAt: AT,
    plan: { listPrice: '2999', nextBill: null },
    includes: {
      designCeilingKw: 100,
      proposalsPerMonth: 'unlimited',
      activeProjects: 50,
      voiceMinutesIncluded: 100,
      voiceMinuteRate: null,
      storageGb: 10,
    },
    usage: [],
    method: { standing: 'none', label: null, manageUrl: null },
    due: null,
    renewal: null,
    refund: null,
    reactivation: null,
    invoices: { latest: [], totalCount: 0 },
    cancellable: false,
    salesContact: null,
    ...over,
  } as BillingHome;
}

export const dueOf = () => ({
  sale: money('2999'),
  failedAt: AT,
  invoiceNumber: 'INV-0001',
  payUrl: PAY_URL,
});
export const renewalOf = () => ({
  invoiceId: label(7),
  number: 'INV-0002',
  sale: money('29999'),
  dueAt: LATER,
  payUrl: RENEWAL_URL,
});
export const refundOf = () => ({ closesAt: LATER, amount: '2999' });
export const reactivationOf = () => ({
  tier: 'pro' as const,
  cycle: 'yearly' as const,
  sale: money('59999'),
  startsAt: null,
});

/** `n` documents, alternately paid and failed, newest first. */
export function documentRows(n: number): BillingDocumentRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: label(1000 + i),
    document: 'invoice',
    number: `INV-${String(i + 1).padStart(4, '0')}`,
    status: i % 2 === 0 ? 'paid' : 'failed',
    issuedAt: AT,
    tier: 'growth',
    cycle: 'monthly',
    total: '2999',
    hasPdf: true,
  }));
}

export function reminderRows(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: label(2000 + i),
    notice: 'payment_reminder',
    firedAt: AT,
    clearedAt: null,
    paidAt: null,
  }));
}

export const NEXT_NOTICE = { notice: 'final_warning', dueAt: LATER };
