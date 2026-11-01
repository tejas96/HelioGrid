'use client';
import type { BillingHomeAdapter } from '@heliogrid/data/react';
import { useRouter } from 'next/navigation';
import { BILLING_PLANS_PATH } from '../constants';

/**
 * Billing's web adapter: a page the product does not draw — the gateway's, a PDF — opens in a new
 * tab with no handle back to this one; the plans are an in-app move. A tab opened after an answer
 * (reactivation's page) may be refused by the browser's popup blocker — `window.open` then gives
 * nothing, and the page opens in this tab instead, so the act is never silently lost.
 */
export function useBillingAdapter(): BillingHomeAdapter {
  const router = useRouter();
  return {
    openExternal: (url) => {
      const opened = window.open(url, '_blank');
      if (opened === null) window.location.assign(url);
      else opened.opener = null;
    },
    toPlans: () => router.push(BILLING_PLANS_PATH),
  };
}
