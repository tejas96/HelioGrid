import type { TranslatedText } from '@heliogrid/contracts';
import type {
  CatalogFilter,
  CatalogLayer,
  CatalogPaging,
  CatalogProvenanceLabel,
  CatalogSort,
  ComponentKind,
  ExplainerPagerWords,
  PanelTechnology,
  Read,
} from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { DataTableProps } from '../DataTable/DataTable.types';
import type { FilterPanelWords } from '../FilterPanel/FilterPanel.types';

/**
 * **Catalog settings' Items panel** (`SCR-M01-15`, `M01-32` to `M01-43`): the release strip, the
 * search with its filters and order, and one resolved list — platform items, own SKUs and
 * overrides collapsed — as a table at 1536 and cards at 375. Every word is the caller's
 * (`@heliogrid/i18n`'s catalog words); every decision is domain's. The sheets and panels it opens
 * are the app's: this panel only says which row was asked for.
 */
export interface CatalogItemsProps {
  words: CatalogItemsWords;
  /**
   * The list's read — its rows are `rows`. Still out keeps every fixed word; failed is the page's
   * load failure with *Try again*, nothing else drawn.
   */
  read: Read<unknown>;
  strip: CatalogStrip;
  /** The one info line naming whose acts these are; `null` for a person who administers. */
  viewOnly: TranslatedText | null;
  /** The first-day card's sentence; `null` once the tenant has something of its own. */
  teaching: TranslatedText | null;
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
  archivedCaption: TranslatedText | null;
  /** Every administration act is offered; without it each is absent, never disabled. */
  administers: boolean;
  /** *Import a file* (`SCR-M01-17`): `null` draws none — absent without the outright grant, never disabled. */
  onImport: (() => void) | null;
  /** *Add an item* (`SCR-M01-16`): `null` draws none — absent without the outright grant. */
  onAdd: (() => void) | null;
  /** The item just added: its row is tinted until the app clears it (`SCR-M01-16` decision 1). */
  addedId: string | null;
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
  readonly title: TranslatedText;
  /** *r2026-08* or *V7*: mono, or a chip on the price book. `null` before the first. */
  readonly tag: string | null;
  readonly tagAs: 'mono' | 'chip';
  /** *Live since 12 Aug* · *Margin 18.0% · since 12 Aug* · *No release published yet*. */
  readonly detail: TranslatedText;
  /** *past releases* — opens the list; `null` while there is nothing to list. */
  readonly link: TranslatedText | null;
  readonly onLink: () => void;
  /** *Publish* · *Start version 8*; `null` without the grant. */
  readonly action: TranslatedText | null;
  readonly onAction: () => void;
}

/** One resolved item as the list shows it: the server's facts plus the words chosen for them. */
export interface CatalogRow {
  readonly id: string;
  readonly kind: ComponentKind;
  readonly name: string;
  /** *Panel · 545 Wp · Mono PERC*. */
  readonly specLine: TranslatedText;
  readonly layer: CatalogLayer;
  readonly layerWord: TranslatedText;
  /** *Your override* · *Your SKU* · *Platform* — the 1536 *Price comes from* column. */
  readonly priceFrom: TranslatedText;
  readonly provenance: CatalogProvenanceLabel;
  readonly provenanceWord: TranslatedText;
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
  readonly prefer: TranslatedText;
  /** *Hide … from pickers* or *Show … in pickers*; *Archive …* on an own SKU. */
  readonly side: TranslatedText;
  /** The row's whole sentence for a screen reader: *name, ₹14,100* or *name, no price set*. */
  readonly row: TranslatedText;
}

export type CatalogRowStatus =
  | { readonly state: 'saving'; readonly label: TranslatedText }
  | {
      readonly state: 'failed';
      readonly label: TranslatedText;
      /** What did not save and what is therefore still true. */
      readonly reason: TranslatedText;
      readonly onRetry: () => void;
      readonly onDismiss: () => void;
    };

/** The list's pager: `packages/domain`'s, which the screen's hook fills. */
export type { CatalogPaging } from '@heliogrid/domain';

/** Every fixed word of the panel: `@heliogrid/i18n`'s `catalogItemsWords`. */
export interface CatalogItemsWords {
  readonly importFile: TranslatedText;
  readonly addItem: TranslatedText;
  readonly item: TranslatedText;
  readonly whatItIs: TranslatedText;
  readonly compliance: TranslatedText;
  readonly effectivePrice: TranslatedText;
  readonly priceComesFrom: TranslatedText;
  readonly noPrice: TranslatedText;
  readonly preferred: TranslatedText;
  readonly prefer: TranslatedText;
  readonly hidden: TranslatedText;
  readonly hide: TranslatedText;
  readonly archive: TranslatedText;
  readonly restore: TranslatedText;
  readonly hiddenFromPickers: TranslatedText;
  /** *No ALMM or DCR flag recorded*, from the market's schemes. */
  readonly noSchemeFlag: TranslatedText;
  readonly marks: TranslatedText;
  readonly search: TranslatedText;
  readonly searchLabel: TranslatedText;
  /** The search's clear button. */
  readonly clearSearch: TranslatedText;
  readonly filters: TranslatedText;
  /** The filter square's name while filters are on: *Filters, 2 active*. */
  readonly filtersActive: (count: number) => TranslatedText;
  /** A chosen kind chip's tick. */
  readonly selectedKind: TranslatedText;
  readonly kindLabel: TranslatedText;
  readonly allKinds: TranslatedText;
  readonly kinds: Readonly<Record<ComponentKind, TranslatedText>>;
  readonly technologies: Readonly<Record<PanelTechnology, TranslatedText>>;
  readonly sortLabel: TranslatedText;
  readonly sortNamed: (order: string) => TranslatedText;
  readonly sorts: Readonly<Record<CatalogSort, TranslatedText>>;
  /** *342 items · every kind · preferred first* — the phone's summary, the table's caption. */
  readonly summary: TranslatedText;
  readonly region: TranslatedText;
  readonly pageRange: (from: number, to: number, count: number) => TranslatedText;
  readonly previousPage: TranslatedText;
  readonly nextPage: TranslatedText;
  readonly makeItYours: TranslatedText;
  readonly loadingRelease: TranslatedText;
  readonly loadingKinds: TranslatedText;
  readonly loadingList: TranslatedText;
  readonly loadFailed: TranslatedText;
  readonly loadFailedBody: TranslatedText;
  readonly tryAgain: TranslatedText;
  /** A failed row's *Dismiss*. */
  readonly dismiss: TranslatedText;
  /** The filter sheet's close. */
  readonly closeFilters: TranslatedText;
  /** The row acts column's spoken name. */
  readonly actions: TranslatedText;
  /** The phone list's next-page act. */
  readonly loadMore: TranslatedText;
  readonly filterPanel: FilterPanelWords & CatalogFilterWords;
  readonly explainer: ExplainerPagerWords;
  readonly table: CatalogTableWords;
}

/**
 * What a catalog table draws and speaks of its own, and its blocked states' words:
 * `@heliogrid/i18n`'s `catalogTableWords`, spread into the `DataTable`.
 */
export type CatalogTableWords = Pick<
  DataTableProps,
  'words' | 'emptyTitle' | 'errorTitle' | 'unavailableTitle'
>;

/** The filter panel's dimension names and options for the catalog. */
export interface CatalogFilterWords {
  readonly source: TranslatedText;
  readonly platform: TranslatedText;
  readonly yourSkus: TranslatedText;
  readonly kindNoun: TranslatedText;
  readonly wattage: TranslatedText;
  readonly technology: TranslatedText;
  readonly technologyNoun: TranslatedText;
  readonly anyTechnology: TranslatedText;
  readonly panelSpecs: TranslatedText;
  readonly scheme: TranslatedText;
  readonly preferredOnly: TranslatedText;
  readonly archivedInstead: TranslatedText;
  readonly resultNoun: TranslatedText;
}

/**
 * *Show more* under a paged list. It leaves once the last page lands, and focus goes to the list
 * it grew (`F7-23` N5) — never the page's start.
 */
export interface ShowMoreProps {
  label: TranslatedText;
  onMore: () => void;
  /** The list the press grew, which takes focus once the last page has taken this away. */
  focusAfter: FocusAfter;
}
