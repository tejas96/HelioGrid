'use client';
import type { CatalogImportSummaryWire } from '@heliogrid/contracts';
import { importListStep } from '@heliogrid/domain';
import { useState } from 'react';
import type { ImportActFailure } from './catalog-import-facts';
import { type CatalogImport, useCatalogImport } from './use-catalog-import';
import { useCatalogImportLists } from './use-catalog-import-lists';
import { useCatalogImportFixes, useCatalogImports } from './use-catalog-import-rows';

/** How many kept reports show before *Show more*. */
const KEPT_PAGE = 20;

/** A job that could not be read is said as an act that did not go through. */
const READ_FAILED = { conflict: false } as const;

/**
 * The import wizard opened from Catalog settings (`SCR-M01-17`) as both screens draw it, assembled
 * once (Law 11, `F7-30`): the import, its fixes and lists, the kept reports, the overview's scope
 * and search, and what last did not go through.
 */
export interface CatalogImportPanel {
  readonly wizard: CatalogImport;
  readonly fixes: ReturnType<typeof useCatalogImportFixes>;
  readonly lists: ReturnType<typeof useCatalogImportLists>;
  /** *Kept reports*, read while the wizard is on its empty first frame. */
  readonly kept: {
    readonly rows: readonly CatalogImportSummaryWire[];
    readonly hasMore: boolean;
    readonly onMore: () => void;
  };
  /** The group the overview scopes to, or `null`. */
  readonly scope: string | null;
  readonly query: string;
  /** Scopes to a group, or back to all when it is the one scoped. */
  toggleScope(group: string): void;
  search(query: string): void;
  /** What last did not go through: a wizard act, a fix, or reading the job. */
  readonly failure: ImportActFailure | { readonly conflict: boolean } | null;
}

/**
 * Fills `CatalogImportPanel`. Mounted only while the wizard is open, so each opening starts on the
 * file step with nothing held from the last.
 */
export function useCatalogImportPanel(): CatalogImportPanel {
  const wizard = useCatalogImport('settings');
  const [scope, setScope] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const step = importListStep(wizard.frame, wizard.status);
  const fixes = useCatalogImportFixes(wizard.jobId, step, wizard.takeCounts);
  const lists = useCatalogImportLists(wizard.jobId, step, query);
  const kept = useCatalogImports(wizard.frame === 'empty', KEPT_PAGE);
  return {
    wizard,
    fixes,
    lists,
    kept: {
      rows: kept.read.kind === 'ready' ? kept.read.value : [],
      hasMore: kept.hasNextPage,
      onMore: () => void kept.fetchNextPage(),
    },
    scope,
    query,
    toggleScope: (group) => setScope((now) => (now === group ? null : group)),
    search: setQuery,
    failure:
      wizard.failure ?? fixes.failure ?? (wizard.jobRead?.kind === 'failed' ? READ_FAILED : null),
  };
}
