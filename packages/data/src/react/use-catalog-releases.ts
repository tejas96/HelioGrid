'use client';
import { type CatalogReleasePreviewWire, DEFAULT_PAGE_LIMIT } from '@heliogrid/contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { answerOf } from '../errors/errors';
import { useRepositories } from './context';
import { usePaginatedList } from './use-paginated-list';
import { useTenantId } from './use-tenant-id';

/** The append-only list of releases, newest first (`M01-43`). */
export function useCatalogReleases(enabled: boolean) {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  return usePaginatedList({
    queryKey: [...queryKeys.catalog.releases(tenantId), 'list'],
    fetchPage: (page) => repositories.catalog.releases({ page, limit: DEFAULT_PAGE_LIMIT }),
    enabled: enabled && tenantId !== '',
  });
}

/** One release and its before-and-after lines; `null` reads nothing. */
export function useCatalogRelease(id: string | null) {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  return useQuery({
    queryKey: queryKeys.catalog.release(tenantId, id ?? ''),
    queryFn: ({ signal }) =>
      repositories.catalog.release(id ?? '', { page: 1, limit: DEFAULT_PAGE_LIMIT }, signal),
    enabled: id !== null && tenantId !== '',
  });
}

/**
 * What a publish now would carry, read while the dialog is open (`SCR-M01-15` s-publish): its
 * counts over the whole changed set, and its lines a page at a time. Read afresh on every open —
 * nothing held from a closed dialog is shown — and refreshed by every act under the catalog prefix.
 */
export function useReleasePreview(open: boolean) {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  /* One read per page: the first page's answer carries the counts. Forgotten when the dialog
     shuts, and an answer that lands after its open shut is dropped, so a reopened dialog never
     shows — or lets Publish act on — the last open's figures. */
  const [counts, setCounts] = useState<CatalogReleasePreviewWire['counts'] | undefined>(undefined);
  const openNumber = useRef(0);
  useEffect(() => {
    openNumber.current += 1;
    if (!open) setCounts(undefined);
  }, [open]);
  const lines = usePaginatedList({
    queryKey: [...queryKeys.catalog.preview(tenantId), 'lines'],
    fetchPage: async (page) => {
      const askedIn = openNumber.current;
      const answer = await repositories.catalog.preview({ page, limit: DEFAULT_PAGE_LIMIT });
      if (page === 1 && askedIn === openNumber.current) setCounts(answer.counts);
      return {
        ...answer.lines,
        items: answer.lines.items.map((line) => ({ ...line, id: line.item.id })),
      };
    },
    enabled: open && tenantId !== '',
  });
  return { counts, lines };
}

/** Why a publish did not land: the name is taken, nothing changed since the last, or no answer. */
export type PublishRefusal = 'label-taken' | 'nothing-changed' | 'failed';

export interface PublishRelease {
  readonly busy: boolean;
  readonly refusal: PublishRefusal | null;
  /** Resolves `true` once the release is published and the catalog read again. */
  publish(label: string): Promise<boolean>;
  /** The person edited the name: the refusal no longer describes it. */
  clear(): void;
}

/** The publish act: one send per tap, its refusal named in the dialog that stays open. */
export function usePublishRelease(): PublishRelease {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState<PublishRefusal | null>(null);
  return {
    busy,
    refusal,
    clear: () => setRefusal(null),
    async publish(label) {
      if (busy) return false;
      setBusy(true);
      setRefusal(null);
      try {
        await repositories.catalog.publish(label);
        await queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all(tenantId) });
        return true;
      } catch (error) {
        const code = answerOf(error)?.code;
        setRefusal(
          code === 'CATALOG_LABEL_TAKEN'
            ? 'label-taken'
            : code === 'CATALOG_NOTHING_CHANGED'
              ? 'nothing-changed'
              : 'failed',
        );
        return false;
      } finally {
        setBusy(false);
      }
    },
  };
}
