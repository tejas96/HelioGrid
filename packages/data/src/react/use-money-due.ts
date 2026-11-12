'use client';
import { MAX_PAGE_LIMIT, type MoneyDue } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { recordReadOf } from './read';
import { useTenantId } from './use-tenant-id';

/** How many unpaid parts one page of Money due shows. */
export const MONEY_DUE_PAGE = 20;

export interface MoneyDueScreen {
  readonly read: Exclude<Read<MoneyDue>, { readonly kind: 'empty' }>;
  /** Show every unpaid part (to the largest page the api serves), kept on screen while it loads. */
  showAll(): void;
  readonly hasMore: boolean;
}

/**
 * Money due (`SCR-M11-01`, `M11-54`): every part due and unpaid that the reader may see, longest
 * waiting first, with the one total to collect and what came in this month.
 */
export function useMoneyDue(): MoneyDueScreen {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const [limit, setLimit] = useState(MONEY_DUE_PAGE);
  const due = useQuery({
    queryKey: queryKeys.projects.moneyDue(tenantId, limit),
    queryFn: ({ signal }) => repositories.payments.moneyDue({ page: 1, limit }, signal),
    enabled: tenantId !== '',
    placeholderData: keepPreviousData,
  });
  const shown = due.data?.rows;
  return {
    read: recordReadOf(due),
    showAll: () => setLimit(MAX_PAGE_LIMIT),
    hasMore: shown !== undefined && shown.items.length < shown.totalCount,
  };
}
