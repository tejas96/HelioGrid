'use client';
import type { SavedPart, SavedPartKind, SavedPartWrite } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { type SavedPartCreate, SavedPartDuplicateError } from '../proposals/saved-parts-repository';
import { useAction } from './action';
import { useRepositories } from './context';
import { type ProposalActFailure, proposalActFailureOf } from './proposal-cache';
import { usePaginatedList } from './use-paginated-list';
import { useTenantId } from './use-tenant-id';

/** Parts a page: a picker shows the first page and reads on at *Show more*. */
const PAGE_LIMIT = 50;

/** Why a saved part's write did not land. */
export type SavedPartFailure =
  /** The same brand and specification is already saved: the part it is, to pick instead. */
  { readonly kind: 'duplicate'; readonly partId: string } | ProposalActFailure;

/**
 * The company's saved cable, electrical and structure parts (`M06-28`, `T-M06-034`): one kind's
 * list for a picker, and — for who may — add, change, archive and restore. A proposal's line keeps
 * its own copy, so no write here changes what a proposal already holds.
 */
export interface SavedParts {
  /** The pages read so far; empty when the company has saved none of this kind yet. */
  readonly read: Read<readonly SavedPart[]>;
  /** Another page of parts stands beyond those read: *Show more* reads it. */
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  loadMore(): void;
  /** *Add a new part*: saved for every later proposal. A second press while one is out sends nothing. */
  add(part: SavedPartCreate): void;
  readonly adding: boolean;
  /** The part the last add made — the picker picks it in place (`M06-28`). */
  readonly added: SavedPart | null;
  save(id: string, part: SavedPartWrite): void;
  archive(id: string): void;
  restore(id: string): void;
  /** A change, an archive or a restore of this part is out. */
  changing(id: string): boolean;
  readonly failure: SavedPartFailure | null;
  clear(): void;
}

interface PartAct {
  readonly id: string;
  readonly send: () => Promise<SavedPart>;
}

/** `kind` null reads nothing — a picker of catalog items, where no saved part is offered. */
export function useSavedParts(
  kind: SavedPartKind | null,
  options: { readonly archived?: boolean } = {},
): SavedParts {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const archived = options.archived === true;
  const [added, setAdded] = useState<SavedPart | null>(null);
  const pages = usePaginatedList<SavedPart>({
    queryKey: queryKeys.savedParts.list(tenantId, kind, archived),
    fetchPage: (page) =>
      repositories.savedParts.list({ kind: kind ?? undefined, archived, page, limit: PAGE_LIMIT }),
    enabled: tenantId !== '' && kind !== null,
  });
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: queryKeys.savedParts.all(tenantId) });
  const add = useAction((part: SavedPartCreate) => repositories.savedParts.add(part), {
    onDone: (part) => {
      setAdded(part);
      refresh();
    },
  });
  const change = useAction((act: PartAct) => act.send(), { key: (act) => act.id, onDone: refresh });
  const failed = add.failure ?? change.failure;
  const run = (id: string, send: () => Promise<SavedPart>) => {
    add.clear();
    void change.run({ id, send });
  };
  return {
    read: pages.read.kind === 'ready' && pages.shown.length === 0 ? { kind: 'empty' } : pages.read,
    hasMore: pages.hasNextPage,
    loadingMore: pages.isFetchingNextPage,
    loadMore: () => void pages.fetchNextPage(),
    add: (part) => {
      change.clear();
      void add.run(part);
    },
    adding: add.pending,
    added,
    save: (id, part) => run(id, () => repositories.savedParts.save(id, part)),
    archive: (id) => run(id, () => repositories.savedParts.archive(id)),
    restore: (id) => run(id, () => repositories.savedParts.restore(id)),
    changing: (id) => change.pendingFor(id),
    failure: failed === null ? null : savedPartFailureOf(failed),
    clear: () => {
      setAdded(null);
      add.clear();
      change.clear();
    },
  };
}

/** A saved part's own fields, as the write's contract names them (`savedPartWriteSchema`). */
export type SavedPartField = 'brand' | 'specification' | 'warranty' | 'description';
const SAVED_PART_FIELDS: readonly SavedPartField[] = [
  'brand',
  'specification',
  'warranty',
  'description',
];

/**
 * The fields a refused write names, each said at its own field; empty when the refusal names none
 * of them — that one is said once, as a line.
 */
export function refusedPartFields(failure: SavedPartFailure | null): readonly SavedPartField[] {
  if (failure?.kind !== 'failed') return [];
  return SAVED_PART_FIELDS.filter((field) =>
    failure.details.some((detail) => detail.path === field),
  );
}

function savedPartFailureOf(error: unknown): SavedPartFailure {
  return error instanceof SavedPartDuplicateError
    ? { kind: 'duplicate', partId: error.partId }
    : proposalActFailureOf(error);
}
