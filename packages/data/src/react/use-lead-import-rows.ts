'use client';
import type { DedupeMatchWire } from '@heliogrid/contracts';
import {
  type ImportDuplicateChoice,
  type LeadImportRowScope,
  type LeadImportRowView,
  leadImportRowsAskOf,
  leadImportRowViewOf,
  mapRead,
  type Read,
} from '@heliogrid/domain';
import { useMemo } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { usePaginatedList } from './use-paginated-list';
import { useTenantId } from './use-tenant-id';

/** How many rows a page shows before *Show more*: a first screenful of an old spreadsheet. */
const PAGE = 50;

export type LeadImportRow = LeadImportRowView<DedupeMatchWire>;

/** The rows a list shows, paged as *Show more* asks. */
export interface LeadImportRowList {
  /** Loading, failed with its retry, or the rows; a list the step does not show is empty. */
  readonly read: Read<readonly LeadImportRow[]>;
  readonly total: number;
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  showMore(): void;
}

const NOT_SHOWN: Read<readonly LeadImportRow[]> = { kind: 'empty' };

/**
 * The preview's rows — every row, or one verdict's — or the report's rejected rows, each with its
 * fate under the duplicate choice and the facts of the record it met (`M02-19`…`M02-21`). A frame
 * with no list reads nothing.
 */
export function useLeadImportRows(
  jobId: string | null,
  phase: 'preview' | 'report' | null,
  scope: LeadImportRowScope | null,
  choice: ImportDuplicateChoice,
): LeadImportRowList {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const ask = leadImportRowsAskOf(phase ?? 'preview', scope);
  const list = usePaginatedList({
    queryKey: [...queryKeys.crm.leadImportRows(tenantId, jobId ?? '', ask), PAGE],
    fetchPage: async (page) => {
      const read = await repositories.leadImport.rows(jobId ?? '', { ...ask, page, limit: PAGE });
      return { ...read, items: read.items.map((row) => ({ ...row, id: String(row.rowNumber) })) };
    },
    enabled: jobId !== null && phase !== null && tenantId !== '',
    keepPreviousWhileLoading: true,
  });
  // The fate follows the choice as it is pressed; the rows themselves are read once.
  const read = useMemo(() => {
    const now = Date.now();
    return mapRead(list.read, (rows) => rows.map((row) => leadImportRowViewOf(row, choice, now)));
  }, [list.read, choice]);
  return {
    read: phase === null ? NOT_SHOWN : read,
    total: list.totalCount,
    hasMore: list.hasNextPage,
    loadingMore: list.isFetchingNextPage,
    showMore: () => void list.fetchNextPage(),
  };
}
