'use client';
import { DEFAULT_PAGE_LIMIT, type ResolvedCatalogItemWire } from '@heliogrid/contracts';
import {
  type CatalogFacts,
  type CatalogView,
  useCatalogActs,
  useCatalogOverlays,
  useCatalogPage,
} from '@heliogrid/data/react';
import { allReads, catalogFiltersOn, NO_CATALOG_FILTER } from '@heliogrid/domain';
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
import { AddItemPanel } from './AddItemPanel';
import { ImportPanel } from './ImportPanel';
import { ItemsOverlays } from './ItemsOverlays';

const NO_ITEMS: readonly ResolvedCatalogItemWire[] = [];

/**
 * The Items panel on the web (`SCR-M01-15`): one numbered page of the resolved catalog, its search,
 * filters and order, and every row act. `useCatalogPage` reads, `useCatalogActs` writes,
 * `catalogItemsViewOf` words it; this composes and opens the editor, the publish and the releases.
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
  const [page, setPage] = useState(1);
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  /** The item just added stands first, tinted, until the view or the page changes. */
  const [added, setAdded] = useState<ResolvedCatalogItemWire | null>(null);
  const list = useCatalogPage(view, page, added);
  const acts = useCatalogActs((note) => toasts.push(catalogActToast(t, note)));
  const overlays = useCatalogOverlays(acts);
  const { totalCount } = list;
  const items = list.read.kind === 'ready' ? list.read.value : NO_ITEMS;
  /* The list draws once it is in; the page's facts hold it back only when they failed. */
  const read = facts.read.kind === 'failed' ? allReads([list.read, facts.read]) : list.read;

  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const shown = catalogItemsViewOf(
    t,
    {
      items,
      totalCount,
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
    },
    formats,
  );
  const onItem = (act: (item: ResolvedCatalogItemWire) => void) => (row: CatalogRow) => {
    const item = byId.get(row.id);
    if (item !== undefined) act(item);
  };
  const change = (next: Partial<CatalogView>) => {
    setView((now) => ({ ...now, ...next }));
    setPage(1);
    setAdded(null);
  };
  const onAdded = (item: ResolvedCatalogItemWire) => {
    setAdding(false);
    setAdded(item);
    toasts.push(catalogItemAddedToast(t, `${item.brand} ${item.model}`));
  };

  return (
    <>
      <CatalogItems
        words={shown.words}
        read={read}
        strip={{
          ...shown.strip,
          /* *Publish* is hidden while the add panel lies over the list (`SCR-M01-16`). */
          action: adding ? null : shown.strip.action,
          onLink: overlays.openReleases,
          onAction: overlays.openPublish,
        }}
        viewOnly={shown.viewOnly}
        teaching={shown.teaching}
        query={view.q}
        onQuery={(q) => change({ q })}
        filter={view.filter}
        onFilter={(filter) => change({ filter })}
        sort={view.sort}
        onSort={(sort) => change({ sort })}
        schemes={facts.schemes}
        rows={shown.rows}
        rowStates={catalogRowStatesOf(shown.statuses, acts.rows)}
        paging={{
          kind: 'pages',
          page: page - 1,
          pageSize: DEFAULT_PAGE_LIMIT,
          rowCount: totalCount,
          onPage: (next) => {
            setPage(next + 1);
            setAdded(null);
          },
        }}
        archivedCaption={shown.archivedCaption}
        administers={facts.administers}
        onImport={facts.administers ? () => setImporting(true) : null}
        onAdd={facts.administers ? () => setAdding(true) : null}
        addedId={added?.id ?? null}
        onOpen={onItem(overlays.openEditor)}
        onPrefer={onItem(acts.togglePreferred)}
        onHide={onItem(acts.toggleHidden)}
        onArchive={onItem((item) => void overlays.askArchive(item))}
        onRestore={onItem(acts.restore)}
      />
      <ItemsOverlays overlays={overlays} schemes={facts.schemes} release={facts.release} />
      {importing ? <ImportPanel onClose={() => setImporting(false)} /> : null}
      {adding ? (
        <AddItemPanel
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
