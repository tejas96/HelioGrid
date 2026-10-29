'use client';
import { DEFAULT_PAGE_LIMIT, type ResolvedCatalogItemWire } from '@heliogrid/contracts';
import {
  allReads,
  type CatalogItemsListed as CatalogItemsListedOf,
  type CatalogPaging,
  catalogFiltersOn,
  NO_CATALOG_FILTER,
  type Read,
} from '@heliogrid/domain';
import { useMemo, useState } from 'react';
import { type CatalogActNote, type CatalogActs, useCatalogActs } from './use-catalog-acts';
import {
  type CatalogFacts,
  type CatalogView,
  useCatalogPage,
  useCatalogScroll,
} from './use-catalog-items';
import { type CatalogOverlays, useCatalogOverlays } from './use-catalog-overlays';

type Item = ResolvedCatalogItemWire;

const NO_ITEMS: readonly Item[] = [];

const FIRST_VIEW: CatalogView = { q: '', filter: NO_CATALOG_FILTER, sort: 'preferred' };

/** How a platform lists the catalog: the web's numbered pages at 1536, the phone's growing cards. */
export type CatalogListing = 'pages' | 'scroll';

/** What the panel's words are written from (`catalogItemsViewOf`'s input). */
export type CatalogItemsListed = CatalogItemsListedOf<Item>;

/** What the panel tells the person in its own words: a row act that landed, an item added. */
export interface CatalogItemsHeard {
  act(note: CatalogActNote): void;
  added(item: Item): void;
}

/**
 * The Items panel (`SCR-M01-15`, `SCR-M01-16`, `SCR-M01-17`) as both screens draw it, assembled
 * once (Law 11, `F7-30`): the list as the person narrowed and ordered it, its pager, every row act
 * and overlay, and the add and import panels. The item just added stands first, tinted, until the
 * view or the page changes.
 */
export interface CatalogItemsPanel {
  readonly view: CatalogView;
  /**
   * The list's read. The page's facts hold it back only when they failed — on the phone only while
   * no card is shown, since its cards stay drawn as more load.
   */
  readonly read: Read<unknown>;
  readonly listed: CatalogItemsListed;
  readonly paging: CatalogPaging;
  readonly acts: CatalogActs;
  readonly overlays: CatalogOverlays;
  readonly addedId: string | null;
  readonly importing: boolean;
  readonly adding: boolean;
  change(next: Partial<CatalogView>): void;
  /** A row's act on the item it shows; a row whose item is gone does nothing. */
  onItem(act: (item: Item) => void): (row: { readonly id: string }) => void;
  /** Present only for a person who administers (`F2.M01.manage-catalog` outright). */
  readonly openImport: (() => void) | null;
  readonly openAdd: (() => void) | null;
  closeImport(): void;
  closeAdd(): void;
  itemAdded(item: Item): void;
  /** The add panel's way to a spreadsheet: the one closes as the import opens. */
  addFromSpreadsheet(): void;
}

/**
 * Fills `CatalogItemsPanel`. Mounted only while *Items* is shown, so each showing starts on the
 * whole list. `heard` words what the panel tells the person; only the screen knows the words.
 */
export function useCatalogItemsPanel(
  facts: CatalogFacts,
  listing: CatalogListing,
  heard: CatalogItemsHeard,
): CatalogItemsPanel {
  const [view, setView] = useState<CatalogView>(FIRST_VIEW);
  const [page, setPage] = useState(1);
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState<Item | null>(null);
  const pages = useCatalogPage(view, page, added, listing === 'pages');
  const scroll = useCatalogScroll(view, added, listing === 'scroll');
  const acts = useCatalogActs(heard.act);
  const overlays = useCatalogOverlays(acts);
  const list = listing === 'pages' ? pages : scroll;
  const items = list.read.kind === 'ready' ? list.read.value : NO_ITEMS;
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const heldBack = facts.read.kind === 'failed' && (listing === 'pages' || items.length === 0);
  const paging: CatalogPaging =
    listing === 'pages'
      ? {
          kind: 'pages',
          page: page - 1,
          pageSize: DEFAULT_PAGE_LIMIT,
          rowCount: pages.totalCount,
          onPage: (next) => {
            setPage(next + 1);
            setAdded(null);
          },
        }
      : {
          kind: 'more',
          hasMore: scroll.hasNextPage,
          loadingMore: scroll.isFetchingNextPage,
          onMore: () => void scroll.fetchNextPage(),
          rowCount: scroll.totalCount,
        };
  return {
    view,
    read: heldBack ? allReads([list.read, facts.read]) : list.read,
    listed: {
      items,
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
    },
    paging,
    acts,
    overlays,
    addedId: added?.id ?? null,
    importing,
    adding,
    change: (next) => {
      setView((now) => ({ ...now, ...next }));
      setPage(1);
      setAdded(null);
    },
    onItem: (act) => (row) => {
      const item = byId.get(row.id);
      if (item !== undefined) act(item);
    },
    openImport: facts.administers ? () => setImporting(true) : null,
    openAdd: facts.administers ? () => setAdding(true) : null,
    closeImport: () => setImporting(false),
    closeAdd: () => setAdding(false),
    itemAdded: (item) => {
      setAdding(false);
      setAdded(item);
      heard.added(item);
    },
    addFromSpreadsheet: () => {
      setAdding(false);
      setImporting(true);
    },
  };
}
