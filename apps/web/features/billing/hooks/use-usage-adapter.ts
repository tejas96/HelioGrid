'use client';
import type { UsageScreenAdapter } from '@heliogrid/data/react';
import { useRouter } from 'next/navigation';
import { BILLING_PLANS_PATH } from '../constants';

/** The usage screen's web adapter: `Bigger plans` is an in-app move to the plans. */
export function useUsageAdapter(): UsageScreenAdapter {
  const router = useRouter();
  return { toPlans: () => router.push(BILLING_PLANS_PATH) };
}
