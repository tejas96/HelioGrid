'use client';
import { mergeCandidatesOf, type Read, SEARCH_SETTLE_MS } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { readOf } from './read';
import { useTenantId } from './use-tenant-id';

/** A customer the find step offers as the other record — only one the person may open. */
export interface CustomerMergeCandidate {
  readonly id: string;
  readonly name: string | null;
  readonly phoneE164: string;
  readonly city: string | null;
}

/** Customer Merge's find step: the other record by name, phone or city (`search.search`). */
export interface CustomerMergeFind {
  readonly query: string;
  setQuery(query: string): void;
  /** `idle` until something is typed; then the search — empty when no other customer matches. */
  readonly read: Read<readonly CustomerMergeCandidate[]> | { readonly kind: 'idle' };
  /** The text the read answers, once the typing settled — what "no match" names. */
  readonly searched: string;
  pick(customerId: string): void;
}

/** How many customers the find step lists at once: enough to tell a family's two records apart. */
const FIND_LIMIT = 10;

/**
 * The find step's search: it asks once the typing settles, over the customers the search lets the
 * person open (never a merged one), and never offers the record that stays.
 */
export function useCustomerMergeFind(options: {
  readonly survivorId: string;
  readonly enabled: boolean;
  readonly onPick: (customerId: string) => void;
}): CustomerMergeFind {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');
  const typed = query.trim();
  useEffect(() => {
    const rest = setTimeout(() => setSearched(typed), SEARCH_SETTLE_MS);
    return () => clearTimeout(rest);
  }, [typed]);
  const ask = { q: searched, limit: FIND_LIMIT };
  const found = useQuery({
    queryKey: queryKeys.search(tenantId, ask),
    queryFn: ({ signal }) => repositories.search.search(ask, signal),
    enabled: options.enabled && tenantId !== '' && searched !== '',
    select: (results) => mergeCandidatesOf(results.customers.items, options.survivorId),
  });
  return {
    query,
    setQuery,
    read: searched === '' ? { kind: 'idle' } : readOf(found, (offered) => offered.length === 0),
    searched,
    pick: options.onPick,
  };
}
