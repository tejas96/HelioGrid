'use client';
import type { CatalogImportRowFixWrite, CatalogImportRowWire } from '@heliogrid/contracts';
import type { CatalogImportCounts } from '@heliogrid/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import type { CatalogImportRowsAsk } from '../catalog/import-repository';
import { ApiError } from '../errors/errors';
import { useRepositories } from './context';
import { usePaginatedList } from './use-paginated-list';
import { useTenantId } from './use-tenant-id';

/** A page of rows as a list keys it: by its sheet row number. */
export type ImportRow = CatalogImportRowWire & { readonly id: string };

/**
 * One list of an import's rows — a group, its sample, the rows a search finds — paged and
 * accumulating as *Show more* asks; `null` reads nothing.
 */
export function useCatalogImportRows(
  jobId: string | null,
  ask: CatalogImportRowsAsk,
  pageSize: number,
) {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  return usePaginatedList<ImportRow>({
    queryKey: [...queryKeys.catalog.importRows(tenantId, jobId ?? '', ask), pageSize],
    fetchPage: async (page) => {
      const read = await repositories.catalogImport.rows(jobId ?? '', {
        ...ask,
        page,
        limit: pageSize,
      });
      return { ...read, items: read.items.map((row) => ({ ...row, id: String(row.rowNumber) })) };
    },
    enabled: jobId !== null && tenantId !== '',
    keepPreviousWhileLoading: true,
  });
}

/** A row this visit settled: the card it answered, and the act that takes the answer back. */
export interface FixedRow {
  readonly row: CatalogImportRowWire;
  readonly undo: { readonly rowNumber: number; readonly body: CatalogImportRowFixWrite };
}

/** What a fix came back as, for the screen's words. */
export type FixAnswer = 'fixed' | 'refused' | 'conflict' | 'failed';

/**
 * The fixes of one import (`T-M01-030e`): each sent once while one for the same row is out, the
 * job's counts and its row lists refreshed from the answer, and the rows this visit settled held
 * with their undo — a fixed row leaves *Need you*, and its fixed card stays until the person
 * leaves. A 409 means the job ran or was mapped again meanwhile: it is read again.
 */
export function useCatalogImportFixes(
  jobId: string | null,
  /** The lists in force — the preview, its fix scope, the report: a new one settles nothing yet. */
  phase: string | null,
  onCounts: (counts: CatalogImportCounts) => void,
) {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();
  const [fixed, setFixed] = useState<ReadonlyMap<number, FixedRow>>(new Map());
  const [busy, setBusy] = useState<ReadonlySet<number>>(new Set());
  const [failure, setFailure] = useState<{ readonly conflict: boolean } | null>(null);
  // A card settled for one job's preview is never shown on another job, or after its run.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the job and its phase are the trigger
  useEffect(() => {
    setFixed(new Map());
  }, [jobId, phase]);
  // A refusal stays said while its job is open: a 409 moves the phase, and its banner says so.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the job is the trigger
  useEffect(() => {
    setFailure(null);
  }, [jobId]);
  const out = useRef(new Set<number>());
  const mark = () => setBusy(new Set(out.current));

  const send = async (
    rowNumber: number,
    body: CatalogImportRowFixWrite,
  ): Promise<{ readonly answer: FixAnswer; readonly rows: readonly CatalogImportRowWire[] }> => {
    if (jobId === null || out.current.has(rowNumber)) return { answer: 'failed', rows: [] };
    out.current.add(rowNumber);
    mark();
    setFailure(null);
    try {
      const answer = await repositories.catalogImport.fix(jobId, rowNumber, body);
      onCounts(answer.counts);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.catalog.importRows(tenantId, jobId),
      });
      return { answer: 'fixed', rows: answer.rows };
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.catalog.import(tenantId, jobId),
        });
        setFailure({ conflict: true });
        return { answer: 'conflict', rows: [] };
      }
      setFailure({ conflict: false });
      const refused = error instanceof ApiError && error.status === 422;
      return { answer: refused ? 'refused' : 'failed', rows: [] };
    } finally {
      out.current.delete(rowNumber);
      mark();
    }
  };

  return {
    fixed,
    /** Rows whose fix is out, by the row the request went to. */
    busy,
    /** The last fix that did not land: a 409 means the job moved under it. */
    failure,
    /**
     * Answers a card: `target` is the row the request goes to — the card's own, or the earlier row
     * a repeat leaves out — and `undo` the request that takes it back. The card settles only when
     * its row stopped asking: a row with a second reason asks it next.
     */
    async fix(
      card: CatalogImportRowWire,
      target: number,
      body: CatalogImportRowFixWrite,
      undo: CatalogImportRowFixWrite,
    ): Promise<FixAnswer> {
      const { answer, rows } = await send(target, body);
      const now = rows.find((row) => row.rowNumber === card.rowNumber) ?? card;
      if (answer === 'fixed' && now.outcome !== 'needs_attention') {
        setFixed((held) =>
          new Map(held).set(card.rowNumber, { row: now, undo: { rowNumber: target, body: undo } }),
        );
      }
      return answer;
    },
    async undo(cardRow: number): Promise<FixAnswer> {
      const held = fixed.get(cardRow);
      if (held === undefined) return 'failed';
      const { answer } = await send(held.undo.rowNumber, held.undo.body);
      if (answer === 'fixed') {
        setFixed((now) => {
          const next = new Map(now);
          next.delete(cardRow);
          return next;
        });
      }
      return answer;
    },
  };
}

/** The company's imports, newest first: *Kept reports*. */
export function useCatalogImports(enabled: boolean, pageSize: number) {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  return usePaginatedList({
    queryKey: [...queryKeys.catalog.imports(tenantId), pageSize],
    fetchPage: (page) => repositories.catalogImport.imports({ page, limit: pageSize }),
    enabled: enabled && tenantId !== '',
  });
}
