'use client';
import { type CatalogReleasePreviewWire, DEFAULT_PAGE_LIMIT } from '@heliogrid/contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { answerOf } from '../errors/errors';
import { useAction } from './action';
import { useRepositories } from './context';
import { readOf } from './read';
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
  const release = useQuery({
    queryKey: queryKeys.catalog.release(tenantId, id ?? ''),
    queryFn: ({ signal }) =>
      repositories.catalog.release(id ?? '', { page: 1, limit: DEFAULT_PAGE_LIMIT }, signal),
    enabled: id !== null && tenantId !== '',
  });
  return readOf(release);
}

/**
 * Browsing the releases (`SCR-M01-15`): whether the view is open, the releases newest first, and
 * the one opened as its before-and-after — the newest until an earlier one is chosen. Closing
 * forgets which.
 */
export function useCatalogReleasesBrowse() {
  const [open, setOpen] = useState(false);
  const list = useCatalogReleases(open);
  const [chosen, setChosen] = useState<string | null>(null);
  const listed = list.read.kind === 'ready' ? list.read.value : [];
  const newestId = listed[0]?.id ?? null;
  const openedId = chosen ?? newestId;
  const opened = useCatalogRelease(open ? openedId : null);
  return {
    open,
    totalCount: list.totalCount,
    listed,
    newestId,
    openedId,
    opened,
    show: () => setOpen(true),
    choose: setChosen,
    close() {
      setChosen(null);
      setOpen(false);
    },
  };
}

export type CatalogReleasesBrowse = ReturnType<typeof useCatalogReleasesBrowse>;

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
  /** The publish is out: the dialog's name and acts wait for its answer. */
  readonly pending: boolean;
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
  const [refusal, setRefusal] = useState<PublishRefusal | null>(null);
  const publishing = useAction(
    async (label: string) => {
      setRefusal(null);
      await repositories.catalog.publish(label);
      await queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all(tenantId) });
    },
    { onFailed: (error) => setRefusal(publishRefusalOf(error)) },
  );
  return {
    pending: publishing.pending,
    refusal,
    clear: () => setRefusal(null),
    publish: async (label) => (await publishing.run(label)).kind === 'done',
  };
}

function publishRefusalOf(error: unknown): PublishRefusal {
  const code = answerOf(error)?.code;
  if (code === 'CATALOG_LABEL_TAKEN') return 'label-taken';
  return code === 'CATALOG_NOTHING_CHANGED' ? 'nothing-changed' : 'failed';
}
