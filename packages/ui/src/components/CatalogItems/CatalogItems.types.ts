import type {
  CatalogFilter,
  CatalogLayer,
  CatalogProvenanceLabel,
  CatalogSort,
  ComponentKind,
  ExplainerPagerWords,
  FilterPanelWords,
  PanelTechnology,
} from '@heliogrid/domain';

/**
 * **Catalog settings' Items panel** (`SCR-M01-15`, `M01-32` to `M01-43`): the release strip, the
 * search with its filters and order, and one resolved list — platform items, own SKUs and
 * overrides collapsed — as a table at 1536 and cards at 375. Every word is the caller's
 * (`@heliogrid/i18n`'s catalog words); every decision is domain's. The sheets and panels it opens
 * are the app's: this panel only says which row was asked for.
 */
export interface CatalogItemsProps {
  words: CatalogItemsWords;
  /** `loading` keeps every fixed word; `error` is the page's load failure, nothing else drawn. */
  surface: 'loading' | 'error' | 'ready';
  onRetry: () => void;
  strip: CatalogStrip;
  /** The one info line naming whose acts these are; `null` for a person who administers. */
  viewOnly: string | null;
  /** The first-day card's sentence; `null` once the tenant has something of its own. */
  teaching: string | null;
  query: string;
  onQuery: (query: string) => void;
  filter: CatalogFilter;
  onFilter: (filter: CatalogFilter) => void;
  sort: CatalogSort;
  onSort: (sort: CatalogSort) => void;
  /** The market's declared schemes; empty draws no compliance column, badge, gap or scheme filter. */
  schemes: readonly string[];
  rows: readonly CatalogRow[];
  /** A row whose write is out, or came back failed with nothing changed. */
  rowStates: Readonly<Record<string, CatalogRowStatus>>;
  paging: CatalogPaging;
  /** The archived count's caption under the list, or `null` when there are none or the list is the archived one. */
  archivedCaption: string | null;
  /** Every administration act is offered; without it each is absent, never disabled. */
  administers: boolean;
  /** The row was asked for: the app opens its price editor. Absent without the grant. */
  onOpen: (row: CatalogRow) => void;
  onPrefer: (row: CatalogRow) => void;
  /** A platform item only: an own SKU has no hide. */
  onHide: (row: CatalogRow) => void;
  /** An own SKU only: the app asks first when drafts still name it. */
  onArchive: (row: CatalogRow) => void;
  onRestore: (row: CatalogRow) => void;
}

/** The versioning strip that opens each panel: the release in force, or the price-book version. */
export interface CatalogStrip {
  /** *Release* · *Price book*. */
  readonly title: string;
  /** *r2026-08* or *V7*: mono, or a chip on the price book. `null` before the first. */
  readonly tag: string | null;
  readonly tagAs: 'mono' | 'chip';
  /** *Live since 12 Aug* · *Margin 18.0% · since 12 Aug* · *No release published yet*. */
  readonly detail: string;
  /** *past releases* — opens the list; `null` while there is nothing to list. */
  readonly link: string | null;
  readonly onLink: () => void;
  /** *Publish* · *Start version 8*; `null` without the grant. */
  readonly action: string | null;
  readonly onAction: () => void;
}

/** One resolved item as the list shows it: the server's facts plus the words chosen for them. */
export interface CatalogRow {
  readonly id: string;
  readonly kind: ComponentKind;
  readonly name: string;
  /** *Panel · 545 Wp · Mono PERC*. */
  readonly specLine: string;
  readonly layer: CatalogLayer;
  readonly layerWord: string;
  /** *Your override* · *Your SKU* · *Platform* — the 1536 *Price comes from* column. */
  readonly priceFrom: string;
  readonly provenance: CatalogProvenanceLabel;
  readonly provenanceWord: string;
  /** The decimal amount the server resolved; `null` is no price; `undefined` is not the reader's. */
  readonly amount: string | null | undefined;
  /** The schemes the item holds, of the market's declared ones, in the market's order. */
  readonly held: readonly string[];
  readonly hidden: boolean;
  readonly preferred: boolean;
  readonly archived: boolean;
  readonly source: 'platform_item' | 'own_item';
  /** Each act's spoken name for this row: *Prefer Adani Solar AS-7-545*. */
  readonly labels: CatalogRowLabels;
}

export interface CatalogRowLabels {
  readonly prefer: string;
  /** *Hide … from pickers* or *Show … in pickers*; *Archive …* on an own SKU. */
  readonly side: string;
  /** The row's whole sentence for a screen reader: *name, ₹14,100* or *name, no price set*. */
  readonly row: string;
}

export type CatalogRowStatus =
  | { readonly state: 'saving'; readonly label: string }
  | {
      readonly state: 'failed';
      readonly label: string;
      /** What did not save and what is therefore still true. */
      readonly reason: string;
      readonly onRetry: () => void;
      readonly onDismiss: () => void;
    };

/** A numbered page at 1536 (`page` counted from 0, as `Pagination` counts); a growing list at 375. */
export type CatalogPaging =
  | {
      readonly kind: 'pages';
      readonly page: number;
      readonly pageSize: number;
      readonly rowCount: number;
      readonly onPage: (page: number) => void;
    }
  | {
      readonly kind: 'more';
      readonly hasMore: boolean;
      readonly loadingMore: boolean;
      readonly onMore: () => void;
      readonly rowCount: number;
    };

/** Every fixed word of the panel: `@heliogrid/i18n`'s `catalogItemsWords`. */
export interface CatalogItemsWords {
  readonly item: string;
  readonly whatItIs: string;
  readonly compliance: string;
  readonly effectivePrice: string;
  readonly priceComesFrom: string;
  readonly noPrice: string;
  readonly preferred: string;
  readonly prefer: string;
  readonly hidden: string;
  readonly hide: string;
  readonly archive: string;
  readonly restore: string;
  readonly hiddenFromPickers: string;
  /** *No ALMM or DCR flag recorded*, from the market's schemes. */
  readonly noSchemeFlag: string;
  readonly marks: string;
  readonly search: string;
  readonly searchLabel: string;
  readonly filters: string;
  readonly kindLabel: string;
  readonly allKinds: string;
  readonly kinds: Readonly<Record<ComponentKind, string>>;
  readonly technologies: Readonly<Record<PanelTechnology, string>>;
  readonly sortLabel: string;
  readonly sortNamed: (order: string) => string;
  readonly sorts: Readonly<Record<CatalogSort, string>>;
  /** *342 items · every kind · preferred first* — the phone's summary, the table's caption. */
  readonly summary: string;
  readonly region: string;
  readonly pageRange: (from: number, to: number, count: number) => string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly makeItYours: string;
  readonly loadingRelease: string;
  readonly loadingKinds: string;
  readonly loadingList: string;
  readonly loadFailed: string;
  readonly loadFailedBody: string;
  readonly tryAgain: string;
  /** A failed row's *Dismiss*. */
  readonly dismiss: string;
  /** The filter sheet's close. */
  readonly closeFilters: string;
  /** The row acts column's spoken name. */
  readonly actions: string;
  /** The phone list's next-page act. */
  readonly loadMore: string;
  readonly filterPanel: FilterPanelWords & CatalogFilterWords;
  readonly explainer: ExplainerPagerWords;
}

/** The filter panel's dimension names and options for the catalog. */
export interface CatalogFilterWords {
  readonly source: string;
  readonly platform: string;
  readonly yourSkus: string;
  readonly kindNoun: string;
  readonly wattage: string;
  readonly technology: string;
  readonly technologyNoun: string;
  readonly anyTechnology: string;
  readonly panelSpecs: string;
  readonly scheme: string;
  readonly preferredOnly: string;
  readonly archivedInstead: string;
  readonly resultNoun: string;
}
