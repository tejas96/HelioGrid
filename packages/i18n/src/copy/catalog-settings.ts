import type { TranslatedText } from '@heliogrid/contracts';
import type {
  BatteryChemistry,
  CatalogLayer,
  CatalogProvenanceLabel,
  CatalogSort,
  CatalogSpec,
  ComponentKind,
  PanelTechnology,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { assembled } from './assembled';

/** Catalog settings' Items panel (`SCR-M01-15`), chosen once for both apps (Law 11). */
export const CATALOG_SETTINGS = {
  title: /*i18n*/ { id: 'Catalog' },
  backToSettings: /*i18n*/ { id: 'Back to settings' },
  items: /*i18n*/ { id: 'Items' },
  rates: /*i18n*/ { id: 'Rates' },
  release: /*i18n*/ { id: 'Release' },
  liveSince: /*i18n*/ { id: 'Live since {date}' },
  pastReleases: /*i18n*/ { id: 'past releases' },
  noRelease: /*i18n*/ { id: 'No release published yet' },
  publish: /*i18n*/ { id: 'Publish' },
  importFile: /*i18n*/ { id: 'Import a file' },
  addItem: /*i18n*/ { id: 'Add an item' },
  search: /*i18n*/ { id: 'Search brand, model or SKU' },
  searchLabel: /*i18n*/ { id: 'Search the catalog' },
  filters: /*i18n*/ { id: 'Filters' },
  kindLabel: /*i18n*/ { id: 'Component kind' },
  allKinds: /*i18n*/ { id: 'All' },
  sortLabel: /*i18n*/ { id: 'Sort' },
  sortNamed: /*i18n*/ { id: 'Sort: {order}' },
  item: /*i18n*/ { id: 'Item' },
  whatItIs: /*i18n*/ { id: 'What it is' },
  compliance: /*i18n*/ { id: 'Compliance' },
  effectivePrice: /*i18n*/ { id: 'Effective price' },
  priceComesFrom: /*i18n*/ { id: 'Price comes from' },
  noPrice: /*i18n*/ { id: 'No price set' },
  preferred: /*i18n*/ { id: 'Preferred' },
  prefer: /*i18n*/ { id: 'Prefer' },
  hidden: /*i18n*/ { id: 'Hidden' },
  hide: /*i18n*/ { id: 'Hide' },
  archive: /*i18n*/ { id: 'Archive' },
  restore: /*i18n*/ { id: 'Restore' },
  preferNamed: /*i18n*/ { id: 'Prefer {name}' },
  stopPreferringNamed: /*i18n*/ { id: 'Stop preferring {name}' },
  hideNamed: /*i18n*/ { id: 'Hide {name} from pickers' },
  showNamed: /*i18n*/ { id: 'Show {name} in pickers' },
  archiveNamed: /*i18n*/ { id: 'Archive {name}' },
  hiddenFromPickers: /*i18n*/ { id: 'Hidden from pickers' },
  noSchemeFlag: /*i18n*/ { id: 'No {schemes} flag recorded' },
  schemesJoin: /*i18n*/ { id: '{first} or {second}' },
  marks: /*i18n*/ { id: 'Layer, spec data and compliance' },
  rowNoPrice: /*i18n*/ { id: '{name}, no price set' },
  rowPriced: /*i18n*/ { id: '{name}, {price}' },
  summary: /*i18n*/ {
    id: '{count, plural, one {# item} other {# items}} · every kind · preferred first',
  },
  summaryMatch: /*i18n*/ { id: '{shown} of {count} items match · preferred first' },
  summaryAny: /*i18n*/ { id: '{count, plural, one {# item} other {# items}} · every kind' },
  summaryMatchAny: /*i18n*/ { id: '{shown} of {count} items match' },
  summaryFresh: /*i18n*/ {
    id: '{count, plural, one {# platform item} other {# platform items}} · nothing of your own yet',
  },
  summaryArchived: /*i18n*/ {
    id: '{count, plural, one {# archived item} other {# archived items}} · absent from every picker until restored',
  },
  regionAll: /*i18n*/ { id: 'Catalog — archived hidden' },
  regionFresh: /*i18n*/ { id: 'Catalog — the platform market slice' },
  regionArchived: /*i18n*/ { id: 'Catalog — archived only' },
  regionFiltered: /*i18n*/ { id: 'Catalog — filtered' },
  archivedCaption: /*i18n*/ {
    id: '{count, plural, one {# archived item} other {# archived items}} · in the Archived filter',
  },
  pageRange: /*i18n*/ { id: '{from}–{to} of {count}' },
  previousPage: /*i18n*/ { id: 'Previous page' },
  nextPage: /*i18n*/ { id: 'Next page' },
  makeItYours: /*i18n*/ { id: 'Make it yours' },
  teaching: /*i18n*/ {
    id: "Your catalog starts with {count} platform items and no prices. Add your own SKUs, or set a platform item's price from the item.",
  },
  viewOnly: /*i18n*/ { id: 'View only — {owners} or Operations edit.' },
  viewOnlyNobody: /*i18n*/ { id: 'View only — an owner or Operations edits.' },
  loadingRelease: /*i18n*/ { id: 'Loading the catalog release' },
  loadingKinds: /*i18n*/ { id: 'Loading the component kinds' },
  loadingList: /*i18n*/ { id: 'Loading the catalog' },
  loadFailed: /*i18n*/ { id: "The catalog didn't load" },
  loadFailedBody: /*i18n*/ {
    id: 'Nothing has changed — your items, your overrides and the price book are exactly as you left them, and nothing has been published or archived.',
  },
  tryAgain: /*i18n*/ { id: 'Try again' },
  dismiss: /*i18n*/ { id: 'Dismiss' },
  closeFilters: /*i18n*/ { id: 'Close filters' },
  actions: /*i18n*/ { id: 'Actions' },
  loadMore: /*i18n*/ { id: 'Show more items' },
  editFailed: /*i18n*/ {
    id: "That didn't save — the catalog service didn't answer. {still}",
  },
  stillShown: /*i18n*/ { id: 'The item is still in every picker.' },
  stillHidden: /*i18n*/ { id: 'The item is still hidden from pickers.' },
  stillPreferred: /*i18n*/ { id: 'The item is still preferred.' },
  stillNotPreferred: /*i18n*/ { id: 'The item is still not preferred.' },
  stillListed: /*i18n*/ { id: 'The item is still in the list.' },
  stillArchived: /*i18n*/ { id: 'The item is still archived.' },
  stillPriced: /*i18n*/ { id: 'Its price is unchanged.' },
} as const;

const LAYER: Record<CatalogLayer, { id: string }> = {
  platform: /*i18n*/ { id: 'Platform' },
  own: /*i18n*/ { id: 'Your SKU' },
  overridden: /*i18n*/ { id: 'Overridden' },
};

/** The 1536 *Price comes from* column: who supplied the price, or where it would come from. */
const PRICE_FROM: Record<CatalogLayer, { id: string }> = {
  platform: /*i18n*/ { id: 'Platform' },
  own: /*i18n*/ { id: 'Your SKU' },
  overridden: /*i18n*/ { id: 'Your override' },
};

const PROVENANCE: Record<CatalogProvenanceLabel, { id: string }> = {
  verified_datasheet: /*i18n*/ { id: 'Verified datasheet' },
  tenant_provided: /*i18n*/ { id: 'Your own' },
  representative: /*i18n*/ { id: 'Representative data' },
};

const KIND: Record<ComponentKind, { id: string }> = {
  panel: /*i18n*/ { id: 'Panel' },
  inverter: /*i18n*/ { id: 'Inverter' },
  battery: /*i18n*/ { id: 'Battery' },
  micro_inverter: /*i18n*/ { id: 'Micro-inverter' },
  optimiser: /*i18n*/ { id: 'Optimiser' },
};

const KINDS: Record<ComponentKind, { id: string }> = {
  panel: /*i18n*/ { id: 'Panels' },
  inverter: /*i18n*/ { id: 'Inverters' },
  battery: /*i18n*/ { id: 'Batteries' },
  micro_inverter: /*i18n*/ { id: 'Micro-inverters' },
  optimiser: /*i18n*/ { id: 'Optimisers' },
};

const TECHNOLOGY: Record<PanelTechnology, { id: string }> = {
  mono_perc: /*i18n*/ { id: 'Mono PERC' },
  topcon: /*i18n*/ { id: 'TOPCon' },
  bifacial: /*i18n*/ { id: 'Bifacial' },
  poly: /*i18n*/ { id: 'Poly' },
  hjt: /*i18n*/ { id: 'HJT' },
};

const CHEMISTRY: Record<BatteryChemistry, { id: string }> = {
  lfp: /*i18n*/ { id: 'LFP' },
  nmc: /*i18n*/ { id: 'NMC' },
  lead_acid: /*i18n*/ { id: 'lead-acid' },
};

/** A chemistry as a choice in a list, in sentence case; `CHEMISTRY` reads inside a spec line. */
const CHEMISTRY_OPTION: Record<BatteryChemistry, { id: string }> = {
  lfp: CHEMISTRY.lfp,
  nmc: CHEMISTRY.nmc,
  lead_acid: /*i18n*/ { id: 'Lead-acid' },
};

const SORT: Record<CatalogSort, { id: string }> = {
  preferred: /*i18n*/ { id: 'Preferred first' },
  name: /*i18n*/ { id: 'Name' },
  price: /*i18n*/ { id: 'Price' },
  recent: /*i18n*/ { id: 'Recently changed' },
};

const SPEC = {
  string: /*i18n*/ { id: 'string' },
  mppt: /*i18n*/ { id: '{count} MPPT' },
  phase: /*i18n*/ { id: '{count, plural, one {# phase} other {# phases}}' },
  perPanel: /*i18n*/ { id: '1 panel' },
} as const;

/** What a row act was, as its failed line says what is still true. */
export type CatalogStill =
  | 'preferred'
  | 'not-preferred'
  | 'shown'
  | 'hidden'
  | 'listed'
  | 'archived'
  | 'priced';

const STILL: Record<CatalogStill, { id: string }> = {
  preferred: CATALOG_SETTINGS.stillPreferred,
  'not-preferred': CATALOG_SETTINGS.stillNotPreferred,
  shown: CATALOG_SETTINGS.stillShown,
  hidden: CATALOG_SETTINGS.stillHidden,
  listed: CATALOG_SETTINGS.stillListed,
  archived: CATALOG_SETTINGS.stillArchived,
  priced: CATALOG_SETTINGS.stillPriced,
};

export const catalogLayerWord = (t: Translator['t'], layer: CatalogLayer) => t(LAYER[layer]);
export const catalogPriceFrom = (t: Translator['t'], layer: CatalogLayer) => t(PRICE_FROM[layer]);
export const catalogProvenance = (t: Translator['t'], label: CatalogProvenanceLabel) =>
  t(PROVENANCE[label]);
export const catalogKind = (t: Translator['t'], kind: ComponentKind) => t(KIND[kind]);
export const catalogKinds = (t: Translator['t'], kind: ComponentKind) => t(KINDS[kind]);
export const catalogTechnology = (t: Translator['t'], technology: PanelTechnology) =>
  t(TECHNOLOGY[technology]);
export const catalogSort = (t: Translator['t'], sort: CatalogSort) => t(SORT[sort]);
export const catalogChemistryOption = (t: Translator['t'], chemistry: BatteryChemistry) =>
  t(CHEMISTRY_OPTION[chemistry]);

/** A failed row's line: what did not save, and what is therefore still true. */
export const catalogEditFailed = (t: Translator['t'], still: CatalogStill) =>
  t(CATALOG_SETTINGS.editFailed, { still: t(STILL[still]) });

/**
 * The row's *kind · spec* line. Units are never translated (kW, Wp, kWh); `number` is the
 * market's own number format, handed in so this module stays format-free.
 */
export function catalogSpecLine(
  t: Translator['t'],
  spec: CatalogSpec,
  number: (value: number) => string,
): TranslatedText {
  return assembled([t(KIND[spec.kind]), ...specFacts(t, spec, number)].join(' · '));
}

function specFacts(
  t: Translator['t'],
  spec: CatalogSpec,
  number: (value: number) => string,
): string[] {
  switch (spec.kind) {
    case 'panel':
      return [`${number(spec.watt)} Wp`, t(TECHNOLOGY[spec.technology])];
    case 'inverter':
      return [
        `${number(spec.acKw)} kW ${t(SPEC.string)}`,
        t(SPEC.mppt, { count: spec.mppt.count }),
        t(SPEC.phase, { count: spec.phases }),
      ];
    case 'battery':
      return [`${number(spec.usableKwh)} kWh`, t(CHEMISTRY[spec.chemistry])];
    case 'micro_inverter':
      return [`${number(spec.ratedAcW)} W`, t(SPEC.perPanel)];
    case 'optimiser':
      return [`${number(spec.ratedInputW)} W`, t(SPEC.perPanel)];
  }
}

/** The view-only line names the owners; with none read it still names whose acts these are. */
export function catalogViewOnly(t: Translator['t'], owners: readonly string[]): TranslatedText {
  const [first, second] = owners;
  if (first === undefined) return t(CATALOG_SETTINGS.viewOnlyNobody);
  const named = second === undefined ? first : t(CATALOG_SETTINGS.schemesJoin, { first, second });
  return t(CATALOG_SETTINGS.viewOnly, { owners: named });
}

/** *No ALMM or DCR flag recorded* — the market's own schemes, joined as the language joins two. */
export function catalogNoSchemeFlag(
  t: Translator['t'],
  schemes: readonly string[],
): TranslatedText {
  const [first, second] = schemes;
  const named =
    second === undefined ? (first ?? '') : t(CATALOG_SETTINGS.schemesJoin, { first, second });
  return t(CATALOG_SETTINGS.noSchemeFlag, { schemes: named });
}
