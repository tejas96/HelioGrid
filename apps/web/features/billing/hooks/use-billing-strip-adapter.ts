'use client';
import type { BillingStripAdapter } from '@heliogrid/data/react';
import { useRouter } from 'next/navigation';
import { BILLING_PATH, BILLING_PLANS_PATH } from '../constants';
import { useBillingAdapter } from './use-billing-adapter';

/**
 * The strip's and the denial's web adapter: a pay page opens as Billing's does — a new tab, or
 * this one when the browser blocks it — and Billing and the plans are in-app moves, so Back
 * returns to the page the act was pressed on (decision 3).
 */
export function useBillingStripAdapter(): BillingStripAdapter {
  const router = useRouter();
  const { openExternal } = useBillingAdapter();
  return {
    openExternal,
    toBillingHome: () => router.push(BILLING_PATH),
    toPlans: () => router.push(BILLING_PLANS_PATH),
  };
}
