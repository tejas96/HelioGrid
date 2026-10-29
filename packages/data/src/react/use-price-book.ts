'use client';
import {
  DEFAULT_PAGE_LIMIT,
  type PriceBookPublish,
  type PriceBookVersionHeadWire,
} from '@heliogrid/contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { type Action, useAction } from './action';
import { useRepositories } from './context';
import { readOf } from './read';
import { usePaginatedList } from './use-paginated-list';
import { useTenantId } from './use-tenant-id';

/** The rate card in force (`M01-48`): the newest version, or the platform default before the first. */
export function usePriceBook() {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const book = useQuery({
    queryKey: queryKeys.priceBook.active(tenantId),
    queryFn: ({ signal }) => repositories.priceBook.active(signal),
    enabled: tenantId !== '',
  });
  return readOf(book);
}

/** Every version, newest first, the one in force marked. */
export function usePriceBookVersions(enabled: boolean) {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  return usePaginatedList({
    queryKey: queryKeys.priceBook.versions(tenantId),
    fetchPage: (page) => repositories.priceBook.versions({ page, limit: DEFAULT_PAGE_LIMIT }),
    enabled: enabled && tenantId !== '',
  });
}

/** One version, read-only; `null` reads nothing. */
export function usePriceBookVersion(id: string | null) {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const version = useQuery({
    queryKey: queryKeys.priceBook.version(tenantId, id ?? ''),
    queryFn: ({ signal }) => repositories.priceBook.version(id ?? '', signal),
    enabled: id !== null && tenantId !== '',
  });
  return readOf(version);
}

/**
 * A new version is the whole rate set again; once in force, the price book is read afresh and
 * `onPublished` hears its number. The action's `failure` is the save that did not land.
 */
export function usePublishPriceBookVersion(
  onPublished: (number: number) => void,
): Action<PriceBookPublish, PriceBookVersionHeadWire> {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  return useAction((body: PriceBookPublish) => repositories.priceBook.publish(body), {
    onDone: async (head) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.priceBook.all(tenantId) });
      onPublished(head.number);
    },
  });
}

/** Browsing the versions: the list, and one opened read-only; closing forgets which. */
export function usePriceBookBrowse(open: boolean, onClose: () => void) {
  const list = usePriceBookVersions(open);
  const [picked, setPicked] = useState<string | null>(null);
  const one = usePriceBookVersion(open ? picked : null);
  /* Stable, so a screen may hold the platform's Back with it. */
  const back = useCallback(() => setPicked(null), []);
  return {
    list,
    picked,
    one,
    pick: setPicked,
    back,
    close() {
      setPicked(null);
      onClose();
    },
  };
}
