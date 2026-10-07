/**
 * The catalog (M01-33 to M01-45): what an item is, the specs it may carry, and the view-model one
 * resolves to for a tenant on a date. `resolveCatalogItem` hands out a money figure, so it is on
 * `./server` alone (F4-04); its types are here, because a screen renders what the server sent.
 */

export type {
  CatalogImportAttentionReason,
  CatalogImportConflictAnswer,
  CatalogImportCounts,
  CatalogImportEntryPoint,
  CatalogImportRowOutcome,
  CatalogImportSheet,
  CatalogImportState,
  CatalogImportUnreadableReason,
} from './import';
export {
  CATALOG_IMPORT_ATTENTION_REASONS,
  CATALOG_IMPORT_CONFLICT_ANSWERS,
  CATALOG_IMPORT_ENTRY_POINTS,
  CATALOG_IMPORT_FILE_NAME_MAX,
  CATALOG_IMPORT_ROW_OUTCOMES,
  CATALOG_IMPORT_STATES,
  CATALOG_IMPORT_UNPACKED_LIMIT_BYTES,
  CATALOG_IMPORT_UNREADABLE_REASONS,
  countImportMatches,
} from './import';
export type { ImportCurrency } from './import-cells';
export type { CatalogImportField, ColumnGuess } from './import-columns';
export {
  CATALOG_IMPORT_FIELDS,
  guessColumns,
  guessHeaderRow,
  HEADER_ROW_SCAN,
} from './import-columns';
export type {
  CatalogImportRowInput,
  CatalogImportRowMatch,
  ImportAttention,
  ImportCatalog,
  ImportCatalogEntry,
} from './import-matching';
export type { PriceBookRateBasis } from './price-book';
export { MAX_MARGIN, PLATFORM_DEFAULT_MARGIN, PRICE_BOOK_RATE_BASES } from './price-book';
export type {
  CatalogReleaseSnapshot,
  CatalogReleaseSnapshotEnvelope,
  OverrideSnapshot,
  OwnItemSnapshot,
  ReleaseChangeKind,
} from './release';
export { changeKindOf, RELEASE_CHANGE_KINDS } from './release';
export type {
  CatalogOverride,
  CatalogRate,
  CatalogRateEntry,
  CatalogResolveInput,
  OwnCatalogItem,
  PlatformCatalogItem,
  ResolvedCatalogItem,
} from './resolve';
export type {
  BatterySpec,
  CatalogSpec,
  InverterSpec,
  MicroInverterSpec,
  MpptWindow,
  OptimiserSpec,
  PanelSpec,
  SpecParse,
} from './specs';
export { catalogSpecSchema, parseCatalogSpec } from './specs';
export type {
  BatteryChemistry,
  CatalogAvailability,
  CatalogProvenanceLabel,
  CatalogSource,
  ComponentKind,
  PanelTechnology,
} from './vocabulary';
export {
  BATTERY_CHEMISTRIES,
  CATALOG_AVAILABILITY,
  CATALOG_PROVENANCE_LABELS,
  CATALOG_SOURCES,
  COMPONENT_KINDS,
  PANEL_TECHNOLOGIES,
} from './vocabulary';
