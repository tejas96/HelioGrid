import type { ResolvedCatalogItemWire } from '@heliogrid/contracts';
import {
  type CatalogFacts,
  type CatalogView,
  useCatalogActs,
  useCatalogOverlays,
  useCatalogScroll,
} from '@heliogrid/data/react';
import { catalogFiltersOn, NO_CATALOG_FILTER } from '@heliogrid/domain';
import { catalogActToast, catalogItemAddedToast, catalogItemsViewOf } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  CatalogItems,
  type CatalogRow,
  catalogRowStatesOf,
  useCatalogFormats,
  type useToasts,
} from '@heliogrid/ui';
import { useMemo, useState } from 'react';
import { AddItemSheet } from './AddItemSheet';
import { ImportSheet } from './ImportSheet';
import { ItemsSheets } from './ItemsSheets';

/**
 * The Items panel on the phone (`SCR-M01-15`): the resolved catalog as cards that load as the
 * person scrolls, its search and filters, and every row act. The phone's list grows where the
 * web's pages; everything else — the reads, the acts, the words — is the shared hooks' and
 * `catalogItemsViewOf`'s.
 */
export function ItemsPanel({
  facts,
  toasts,
}: {
  facts: CatalogFacts;
  toasts: ReturnType<typeof useToasts>;
}) {
  const { t } = useI18n();
  const formats = useCatalogFormats();
  const [view, setView] = useState<CatalogView>({
    q: '',
    filter: NO_CATALOG_FILTER,
    sort: 'preferred',
  });
  /** The item just added stands first, tinted, until the view changes. */
  const [added, setAdded] = useState<ResolvedCatalogItemWire | null>(null);
  const list = useCatalogScroll(view, added);
  const acts = useCatalogActs((note) => toasts.push(catalogActToast(t, note)));
  const sheets = useCatalogOverlays(acts);
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const viewed = (next: Partial<CatalogView>) => {
    setView((now) => ({ ...now, ...next }));
    setAdded(null);
  };
  const onAdded = (item: ResolvedCatalogItemWire) => {
    setAdding(false);
    setAdded(item);
    toasts.push(catalogItemAddedToast(t, `${item.brand} ${item.model}`));
  };
  const byId = useMemo(() => new Map(list.items.map((item) => [item.id, item])), [list.items]);
  const input = {
    items: list.items,
    totalCount: list.totalCount,
    wholeCount: facts.allCount,
    preferredFirst: view.sort === 'preferred',
    schemes: facts.schemes,
    administers: facts.administers,
    owners: facts.owners?.names ?? [],
    release: facts.release,
    teaches: facts.teaches,
    archivedCount: facts.archivedCount,
    archivedFilter: view.filter.archived,
    narrowed: view.q.trim() !== '' || catalogFiltersOn(view.filter) > 0,
    acts: acts.rows,
  };
  const shown = catalogItemsViewOf(t, input, formats);
  const onItem = (act: (item: ResolvedCatalogItemWire) => void) => (row: CatalogRow) => {
    const item = byId.get(row.id);
    if (item !== undefined) act(item);
  };
  const loading = list.status === 'pending';
  const failed = list.items.length === 0 && (list.status === 'error' || facts.surface === 'error');

  return (
    <>
      <CatalogItems
        words={shown.words}
        surface={failed ? 'error' : loading ? 'loading' : 'ready'}
        onRetry={() => {
          void list.refetch();
          facts.retry();
        }}
        strip={{
          ...shown.strip,
          action: adding ? null : shown.strip.action,
          onLink: sheets.openReleases,
          onAction: sheets.openPublish,
        }}
        viewOnly={shown.viewOnly}
        teaching={shown.teaching}
        query={view.q}
        onQuery={(q) => viewed({ q })}
        filter={view.filter}
        onFilter={(filter) => viewed({ filter })}
        sort={view.sort}
        onSort={(sort) => viewed({ sort })}
        schemes={facts.schemes}
        rows={shown.rows}
        rowStates={catalogRowStatesOf(shown.statuses, acts.rows)}
        paging={{
          kind: 'more',
          hasMore: list.hasNextPage,
          loadingMore: list.isFetchingNextPage,
          onMore: () => void list.fetchNextPage(),
          rowCount: list.totalCount,
        }}
        archivedCaption={shown.archivedCaption}
        administers={facts.administers}
        onImport={facts.administers ? () => setImporting(true) : null}
        onAdd={facts.administers ? () => setAdding(true) : null}
        addedId={added?.id ?? null}
        onOpen={onItem(sheets.openEditor)}
        onPrefer={onItem(acts.togglePreferred)}
        onHide={onItem(acts.toggleHidden)}
        onArchive={onItem((item) => void sheets.askArchive(item))}
        onRestore={onItem(acts.restore)}
      />
      <ItemsSheets sheets={sheets} schemes={facts.schemes} release={facts.release} />
      {importing ? <ImportSheet onClose={() => setImporting(false)} /> : null}
      {adding ? (
        <AddItemSheet
          priced={facts.administers}
          onClose={() => setAdding(false)}
          onAdded={onAdded}
          onSpreadsheet={() => {
            setAdding(false);
            setImporting(true);
          }}
        />
      ) : null}
    </>
  );
}
