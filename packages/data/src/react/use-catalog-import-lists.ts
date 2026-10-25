'use client';
import {
  IMPORT_PREVIEW_GROUPS,
  IMPORT_READY_OUTCOMES,
  IMPORT_REPORT_GROUPS,
} from '@heliogrid/domain';
import type { CatalogImportRowsAsk } from '../catalog/import-repository';
import { useCatalogImportRows } from './use-catalog-import-rows';

/** One list as the wizard draws it. */
export interface ImportListRead {
  readonly rows: ReturnType<typeof useCatalogImportRows>['items'];
  readonly total: number;
  readonly loading: boolean;
  /** The read failed past its own retries: the list offers *Try again*. */
  readonly failed: boolean;
  readonly onRetry: () => void;
  readonly hasMore: boolean;
  readonly onMore: () => void;
}

/** How many rows a list shows before *Show more*. */
const PAGE = 50;

const OPEN_RESULTS = [...IMPORT_REPORT_GROUPS.leftOut, ...IMPORT_REPORT_GROUPS.failed].join(',');
const list = (values: readonly string[]) => values.join(',');

function useList(jobId: string | null, ask: CatalogImportRowsAsk | null): ImportListRead {
  const read = useCatalogImportRows(ask === null ? null : jobId, ask ?? {}, PAGE);
  return {
    rows: read.items,
    total: read.totalCount,
    loading: read.status === 'pending' && ask !== null,
    failed: read.status === 'error',
    onRetry: () => void read.refetch(),
    hasMore: read.hasNextPage,
    onMore: () => void read.fetchNextPage(),
  };
}

/**
 * Every list of one import the wizard shows (`SCR-M01-17` RFC §5, *Reads*): in the preview, the
 * rows that need the person and the two outcome groups — or, under a search, the rows it finds
 * that need the person and those ready; in the fix scope of a completed job, the same narrowed to
 * the rows its run left open; in the report, failed, left out, prices applied and products created,
 * each narrowed by the search. A list the step does not show reads nothing.
 */
export function useCatalogImportLists(
  jobId: string | null,
  step: 'preview' | 'fix' | 'report' | null,
  query: string,
) {
  const q = query.trim() === '' ? {} : { q: query.trim() };
  const open = step === 'fix' ? { results: OPEN_RESULTS } : {};
  const preview = step === 'preview' || step === 'fix';
  const searching = preview && 'q' in q;
  const askIf = (when: boolean, ask: CatalogImportRowsAsk) => (when ? ask : null);
  const attention = useList(
    jobId,
    askIf(preview && !searching, { outcomes: list(IMPORT_PREVIEW_GROUPS.attention), ...open }),
  );
  // Read under a search too: the fix scope's *Import N rows* counts them whatever is typed.
  const overrides = useList(
    jobId,
    askIf(preview, { outcomes: list(IMPORT_PREVIEW_GROUPS.overrides), ...open }),
  );
  // Read under a search too: the fix scope's *Import N rows* counts them whatever is typed.
  const newItems = useList(
    jobId,
    askIf(preview, { outcomes: list(IMPORT_PREVIEW_GROUPS.newItems), ...open }),
  );
  const foundAttention = useList(
    jobId,
    askIf(searching, { outcomes: list(IMPORT_PREVIEW_GROUPS.attention), ...open, ...q }),
  );
  const foundReady = useList(
    jobId,
    askIf(searching, { outcomes: list(IMPORT_READY_OUTCOMES), ...open, ...q }),
  );
  const report = step === 'report';
  const failed = useList(
    jobId,
    askIf(report, { results: list(IMPORT_REPORT_GROUPS.failed), ...q }),
  );
  const leftOut = useList(
    jobId,
    askIf(report, { results: list(IMPORT_REPORT_GROUPS.leftOut), ...q }),
  );
  const applied = useList(
    jobId,
    askIf(report, { results: list(IMPORT_REPORT_GROUPS.applied), ...q }),
  );
  const created = useList(
    jobId,
    askIf(report, { results: list(IMPORT_REPORT_GROUPS.created), ...q }),
  );
  if (step === null) return { attention: null, groups: [], found: null, ready: 0 };
  if (report) {
    const groups = [
      { id: 'failed' as const, ...failed },
      { id: 'leftOut' as const, ...leftOut },
      { id: 'applied' as const, ...applied },
      { id: 'created' as const, ...created },
    ];
    return { attention: null, groups, found: null, ready: 0 };
  }
  return {
    attention: searching ? null : attention,
    groups: searching
      ? []
      : [
          { id: 'overrides' as const, ...overrides },
          { id: 'newItems' as const, ...newItems },
        ],
    found: searching ? { attention: foundAttention, ready: foundReady } : null,
    /** The open rows now ready, *Import N rows*' N in the fix scope. */
    ready: overrides.total + newItems.total,
  };
}
