import type { TranslatedText } from '@heliogrid/contracts';
import {
  CATALOG_SORTS,
  type CatalogLayer,
  type CatalogProvenanceLabel,
  type CatalogSpec,
  COMPONENT_KINDS,
  type ComponentKind,
  PANEL_TECHNOLOGIES,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { CATALOG_EDITOR } from './catalog-editor';
import {
  CATALOG_SETTINGS,
  catalogKind,
  catalogKinds,
  catalogLayerWord,
  catalogNoSchemeFlag,
  catalogPriceFrom,
  catalogProvenance,
  catalogSort,
  catalogSpecLine,
  catalogTechnology,
} from './catalog-settings';
import { DATA_TABLE, dataTableWords } from './data-table';
import { explainerPagerWords } from './explainer';
import { filterBarWords } from './filter-bar';
import { filterPanelWords } from './filter-panel';
import { numberFieldWords } from './number-field';
import { SEARCH_FIELD } from './search-field';

type T = Translator['t'];

/** Which list the Items panel shows, for its summary and its region's name. */
export interface CatalogListFacts {
  readonly count: number;
  /** Rows on screen while a search or filter narrows the list; `null` when nothing narrows it. */
  readonly matched: number | null;
  readonly archived: boolean;
  readonly fresh: boolean;
  /** The list is in its preferred-first order, which the summary then says. */
  readonly preferredFirst: boolean;
}

const FILTER = {
  source: /*i18n*/ { id: 'Source' },
  platform: /*i18n*/ { id: 'Platform' },
  yourSkus: /*i18n*/ { id: 'Your SKUs' },
  kindNoun: /*i18n*/ { id: 'kinds' },
  wattage: /*i18n*/ { id: 'Wattage' },
  technology: /*i18n*/ { id: 'Technology' },
  technologyNoun: /*i18n*/ { id: 'technologies' },
  anyTechnology: /*i18n*/ { id: 'Any' },
  panelSpecs: /*i18n*/ { id: 'Panel specs' },
  scheme: /*i18n*/ { id: 'Certification scheme' },
  preferredOnly: /*i18n*/ { id: 'Preferred items only' },
  archivedInstead: /*i18n*/ { id: 'Archived items instead' },
  resultNoun: /*i18n*/ { id: 'items' },
} as const;

/** The filter panel's apply button, counted in items — one item is never *1 items*. */
const SHOW_ITEMS = /*i18n*/ {
  id: '{count, plural, one {Show # item} other {Show # items}}',
};

function listWords(t: T, list: CatalogListFacts) {
  if (list.archived) {
    return {
      summary: t(CATALOG_SETTINGS.summaryArchived, { count: list.count }),
      region: t(CATALOG_SETTINGS.regionArchived),
    };
  }
  if (list.matched !== null) {
    const said = list.preferredFirst
      ? CATALOG_SETTINGS.summaryMatch
      : CATALOG_SETTINGS.summaryMatchAny;
    return {
      summary: t(said, { shown: list.matched, count: list.count }),
      region: t(CATALOG_SETTINGS.regionFiltered),
    };
  }
  if (list.fresh) {
    return {
      summary: t(CATALOG_SETTINGS.summaryFresh, { count: list.count }),
      region: t(CATALOG_SETTINGS.regionFresh),
    };
  }
  return {
    summary: t(list.preferredFirst ? CATALOG_SETTINGS.summary : CATALOG_SETTINGS.summaryAny, {
      count: list.count,
    }),
    region: t(CATALOG_SETTINGS.regionAll),
  };
}

/** `DataTable`'s own words, by a name the catalog's words can carry out of this package. */
export interface CatalogDataTableWords extends ReturnType<typeof dataTableWords> {}

/**
 * What a catalog table draws and speaks of its own, and its blocked states' words — the same for
 * the items, the rates and the changed items, spread into each `DataTable`.
 */
export function catalogTableWords(t: T) {
  const words: CatalogDataTableWords = dataTableWords(t);
  return {
    words,
    emptyTitle: t(DATA_TABLE.emptyTitle),
    errorTitle: t(DATA_TABLE.errorTitle),
    unavailableTitle: t(DATA_TABLE.unavailableTitle),
  };
}

const byKey = <K extends string>(keys: readonly K[], word: (key: K) => TranslatedText) =>
  Object.fromEntries(keys.map((key) => [key, word(key)])) as Record<K, TranslatedText>;

/** Every fixed word of the Items panel, in the reader's language. */
export function catalogItemsWords(t: T, schemes: readonly string[], list: CatalogListFacts) {
  const filterBar = filterBarWords(t);
  return {
    importFile: t(CATALOG_SETTINGS.importFile),
    addItem: t(CATALOG_SETTINGS.addItem),
    item: t(CATALOG_SETTINGS.item),
    whatItIs: t(CATALOG_SETTINGS.whatItIs),
    compliance: t(CATALOG_SETTINGS.compliance),
    effectivePrice: t(CATALOG_SETTINGS.effectivePrice),
    priceComesFrom: t(CATALOG_SETTINGS.priceComesFrom),
    noPrice: t(CATALOG_SETTINGS.noPrice),
    preferred: t(CATALOG_SETTINGS.preferred),
    prefer: t(CATALOG_SETTINGS.prefer),
    hidden: t(CATALOG_SETTINGS.hidden),
    hide: t(CATALOG_SETTINGS.hide),
    archive: t(CATALOG_SETTINGS.archive),
    restore: t(CATALOG_SETTINGS.restore),
    hiddenFromPickers: t(CATALOG_SETTINGS.hiddenFromPickers),
    noSchemeFlag: catalogNoSchemeFlag(t, schemes),
    marks: t(CATALOG_SETTINGS.marks),
    search: t(CATALOG_SETTINGS.search),
    searchLabel: t(CATALOG_SETTINGS.searchLabel),
    clearSearch: t(SEARCH_FIELD.clear),
    filters: t(CATALOG_SETTINGS.filters),
    filtersActive: filterBar.filtersActive,
    selectedKind: filterBar.selected,
    kindLabel: t(CATALOG_SETTINGS.kindLabel),
    allKinds: t(CATALOG_SETTINGS.allKinds),
    kinds: byKey(COMPONENT_KINDS, (kind) => catalogKinds(t, kind)),
    technologies: byKey(PANEL_TECHNOLOGIES, (technology) => catalogTechnology(t, technology)),
    sortLabel: t(CATALOG_SETTINGS.sortLabel),
    sortNamed: (order: string) => t(CATALOG_SETTINGS.sortNamed, { order }),
    sorts: byKey(CATALOG_SORTS, (sort) => catalogSort(t, sort)),
    ...listWords(t, list),
    pageRange: (from: number, to: number, count: number) =>
      t(CATALOG_SETTINGS.pageRange, { from, to, count }),
    previousPage: t(CATALOG_SETTINGS.previousPage),
    nextPage: t(CATALOG_SETTINGS.nextPage),
    makeItYours: t(CATALOG_SETTINGS.makeItYours),
    loadingRelease: t(CATALOG_SETTINGS.loadingRelease),
    loadingKinds: t(CATALOG_SETTINGS.loadingKinds),
    loadingList: t(CATALOG_SETTINGS.loadingList),
    loadFailed: t(CATALOG_SETTINGS.loadFailed),
    loadFailedBody: t(CATALOG_SETTINGS.loadFailedBody),
    tryAgain: t(CATALOG_SETTINGS.tryAgain),
    dismiss: t(CATALOG_SETTINGS.dismiss),
    closeFilters: t(CATALOG_SETTINGS.closeFilters),
    actions: t(CATALOG_SETTINGS.actions),
    loadMore: t(CATALOG_SETTINGS.loadMore),
    filterPanel: {
      ...filterPanelWords(t),
      ...byKey(Object.keys(FILTER) as (keyof typeof FILTER)[], (key) => t(FILTER[key])),
      showResults: (count: number) => t(SHOW_ITEMS, { count }),
    },
    explainer: explainerPagerWords(t),
    table: catalogTableWords(t),
  };
}

/** One resolved item, as the list reads it. */
export interface CatalogRowFacts {
  readonly id: string;
  readonly brand: string;
  readonly model: string;
  readonly spec: CatalogSpec;
  readonly layer: CatalogLayer;
  readonly provenance: CatalogProvenanceLabel;
  readonly hidden: boolean;
  readonly preferred: boolean;
  readonly source: 'platform_item' | 'own_item';
  /** The decimal amount; `null` no price; `undefined` not the reader's to see. */
  readonly amount: string | null | undefined;
}

/**
 * A row's words: its name, its *kind · spec* line, its layer and provenance, and each act's
 * spoken name. `number` and `money` are the market's formats, handed in.
 */
export function catalogRowWords(
  t: T,
  row: CatalogRowFacts,
  number: (value: number) => string,
  money: (amount: string) => string,
) {
  const name = `${row.brand} ${row.model}`;
  const side =
    row.source === 'own_item'
      ? t(CATALOG_SETTINGS.archiveNamed, { name })
      : row.hidden
        ? t(CATALOG_SETTINGS.showNamed, { name })
        : t(CATALOG_SETTINGS.hideNamed, { name });
  return {
    name,
    specLine: catalogSpecLine(t, row.spec, number),
    layerWord: catalogLayerWord(t, row.layer),
    priceFrom: catalogPriceFrom(t, row.layer),
    provenanceWord: catalogProvenance(t, row.provenance),
    labels: {
      prefer: row.preferred
        ? t(CATALOG_SETTINGS.stopPreferringNamed, { name })
        : t(CATALOG_SETTINGS.preferNamed, { name }),
      side,
      row:
        typeof row.amount === 'string'
          ? t(CATALOG_SETTINGS.rowPriced, { name, price: money(row.amount) })
          : t(CATALOG_SETTINGS.rowNoPrice, { name }),
    },
  };
}

/** The editor's item card chips: *Panel* · *550 Wp · verified datasheet* · *TOPCon*. */
export function catalogEditorChips(
  t: T,
  spec: CatalogSpec,
  provenance: CatalogProvenanceLabel,
  number: (value: number) => string,
): string[] {
  const [, ...facts] = catalogSpecLine(t, spec, number).split(' · ');
  const [first, ...rest] = facts;
  const kind: ComponentKind = spec.kind;
  const lead = first === undefined ? [] : [`${first} · ${catalogProvenance(t, provenance)}`];
  return [catalogKind(t, kind), ...lead, ...rest];
}

/** The price editor's fixed words; `taxStays` names the tenant's rate when the pack has none. */
export function catalogPriceEditorWords(t: T, taxStays: string | null) {
  return {
    howItResolves: t(CATALOG_EDITOR.howItResolves),
    resolvesPages: [t(CATALOG_EDITOR.resolvesPrice), t(CATALOG_EDITOR.resolvesUnset)] as const,
    explainer: explainerPagerWords(t),
    yourPrice: t(CATALOG_EDITOR.yourPrice),
    price: t(CATALOG_EDITOR.price),
    priceHint: t(CATALOG_EDITOR.priceHint),
    taxRate: t(CATALOG_EDITOR.taxRate),
    edited: t(EDITED),
    noMarketRate: t(CATALOG_EDITOR.noMarketRate),
    taxStays: taxStays === null ? null : t(CATALOG_EDITOR.taxStays, { rate: taxStays }),
    yourOverride: t(CATALOG_EDITOR.yourOverride),
    defaultSource: t(CATALOG_EDITOR.defaultSource),
    inPickers: t(CATALOG_EDITOR.inPickers),
    hideFromPickers: t(CATALOG_EDITOR.hideFromPickers),
    preferredInPickers: t(CATALOG_EDITOR.preferredInPickers),
    numberField: numberFieldWords(t),
  };
}

const EDITED = /*i18n*/ { id: 'Edited' };

/** A release body's fixed words. */
export function catalogReleaseWords(t: T) {
  return {
    releaseName: t(CATALOG_EDITOR.releaseName),
    newValue: t(CATALOG_EDITOR.newValue),
    inForce: t(CATALOG_EDITOR.inForce),
    earlier: t(CATALOG_EDITOR.earlier),
    loadFailed: t(CATALOG_EDITOR.releaseLoadFailed),
    tryAgain: t(CATALOG_EDITOR.tryAgain),
    loading: t(CATALOG_SETTINGS.loadingRelease),
  };
}

/** The Items strip: the release in force, or the first-day line; *Publish* for the grant alone. */
export function catalogReleaseStripWords(
  t: T,
  release: { readonly label: string; readonly since: string } | null,
  administers: boolean,
) {
  return {
    title: t(CATALOG_SETTINGS.release),
    tag: release?.label ?? null,
    tagAs: 'mono' as const,
    detail:
      release === null
        ? t(CATALOG_SETTINGS.noRelease)
        : t(CATALOG_SETTINGS.liveSince, { date: release.since }),
    link: release === null ? null : t(CATALOG_SETTINGS.pastReleases),
    action: administers ? t(CATALOG_SETTINGS.publish) : null,
  };
}
