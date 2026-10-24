'use client';
import { DEFAULT_PAGE_LIMIT, type PriceBookPublish } from '@heliogrid/contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { usePaginatedList } from './use-paginated-list';
import { useTenantId } from './use-tenant-id';

/** The rate card in force (`M01-48`): the newest version, or the platform default before the first. */
export function usePriceBook() {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  return useQuery({
    queryKey: queryKeys.priceBook.active(tenantId),
    queryFn: ({ signal }) => repositories.priceBook.active(signal),
    enabled: tenantId !== '',
  });
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
  return useQuery({
    queryKey: queryKeys.priceBook.version(tenantId, id ?? ''),
    queryFn: ({ signal }) => repositories.priceBook.version(id ?? '', signal),
    enabled: id !== null && tenantId !== '',
  });
}

export interface PublishPriceBook {
  readonly busy: boolean;
  readonly failed: boolean;
  /** The new version's number once it is in force; `null` when it did not land. */
  publish(body: PriceBookPublish): Promise<number | null>;
}

/** A new version is the whole rate set again; once in force, the price book is read afresh. */
export function usePublishPriceBookVersion(): PublishPriceBook {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return {
    busy,
    failed,
    async publish(body) {
      if (busy) return null;
      setBusy(true);
      setFailed(false);
      try {
        const head = await repositories.priceBook.publish(body);
        await queryClient.invalidateQueries({ queryKey: queryKeys.priceBook.all(tenantId) });
        return head.number;
      } catch {
        setFailed(true);
        return null;
      } finally {
        setBusy(false);
      }
    },
  };
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
