'use client';
import type { BillingHomeAdapter } from '@heliogrid/data/react';
import { useRouter } from 'next/navigation';
import { openExternal } from '../../../lib/open-external';
import { BILLING_PLANS_PATH } from '../constants';

/**
 * Billing's web adapter: a page the product does not draw — the gateway's, a PDF — opens through
 * `openExternal`; the plans are an in-app move.
 */
export function useBillingAdapter(): BillingHomeAdapter {
  const router = useRouter();
  return {
    openExternal,
    toPlans: () => router.push(BILLING_PLANS_PATH),
  };
}
