'use client';
import type { PlanSelectionAdapter } from '@heliogrid/data/react';
import { useRouter } from 'next/navigation';
import { BILLING_PATH } from '../constants';
import { useBillingAdapter } from './use-billing-adapter';

/**
 * The plans' web adapter: the provider's page opens as Billing's does — a new tab, or this one
 * when the browser blocks it — and a scheduled downgrade lands back on Billing (frame 16).
 */
export function usePlansAdapter(): PlanSelectionAdapter {
  const router = useRouter();
  const { openExternal } = useBillingAdapter();
  return { openExternal, toBilling: () => router.push(BILLING_PATH) };
}
