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
  CatalogImportOutcomeCounts,
  CatalogImportResultCounts,
  CatalogImportResults,
  CatalogImportRowFailure,
  CatalogImportRowOutcome,
  CatalogImportRowResult,
  CatalogImportRunProgress,
  CatalogImportSheet,
  CatalogImportState,
  CatalogImportUnreadableReason,
} from './import';
export {
  CATALOG_IMPORT_ATTENTION_REASONS,
  CATALOG_IMPORT_CONFLICT_ANSWERS,
  CATALOG_IMPORT_ENTRY_POINTS,
  CATALOG_IMPORT_FILE_NAME_MAX,
  CATALOG_IMPORT_MAPPABLE_STATES,
  CATALOG_IMPORT_OPEN_RESULTS,
  CATALOG_IMPORT_ROW_FAILURES,
  CATALOG_IMPORT_ROW_NUMBER_MAX,
  CATALOG_IMPORT_ROW_OUTCOMES,
  CATALOG_IMPORT_ROW_RESULTS,
  CATALOG_IMPORT_RUN_BATCH_ROWS,
  CATALOG_IMPORT_STATES,
  CATALOG_IMPORT_UNPACKED_LIMIT_BYTES,
  CATALOG_IMPORT_UNREADABLE_REASONS,
  CATALOG_IMPORT_WRITTEN_OUTCOMES,
  CATALOG_IMPORT_WRITTEN_RESULTS,
  countImportMatches,
  countImportResults,
  fixesImportRow,
  hasImportPreview,
  hasImportRun,
  importRowsToFix,
  importRunProgress,
  takesImportFix,
  takesImportMapping,
  takesImportRun,
  wroteImportRow,
} from './import';
export type { ImportCurrency } from './import-cells';
export type { CatalogImportCells, CatalogImportField, ColumnGuess } from './import-columns';
export {
  CATALOG_IMPORT_FIELDS,
  guessColumns,
  guessHeaderRow,
  HEADER_ROW_SCAN,
} from './import-columns';
export type {
  CatalogImportFixProblem,
  CatalogImportRowAnswers,
  CatalogImportRowFix,
  CatalogImportRowState,
} from './import-fix';
export {
  effectiveImportCells,
  fixedImportRow,
  importFixProblem,
  takesImportAnswer,
} from './import-fix';
export type { ImportFixChoice, ImportFixRequest, ImportFixRow } from './import-fix-request';
export { importFixRequest } from './import-fix-request';
export type {
  CatalogImportColumnsProblem,
  CatalogImportMappedRow,
  CatalogImportMapping,
  CatalogImportMappingProblem,
} from './import-mapping';
export {
  importColumnsProblem,
  importMappingProblem,
  mappedRows,
  sameImportMapping,
} from './import-mapping';
export type {
  CatalogImportRowInput,
  CatalogImportRowMatch,
  ImportAttention,
  ImportCatalog,
  ImportCatalogEntry,
  ImportNamedItem,
} from './import-matching';
export type { ImportProductName } from './import-text';
export { importProductNames, namesOneOf } from './import-text';
export type {
  ImportContinueGate,
  ImportFixAct,
  ImportWizardEvent,
  ImportWizardFrame,
  ImportWizardStep,
  ImportWizardView,
} from './import-wizard';
export {
  firstAttentionReason,
  guessImportMapping,
  IMPORT_POLL_SECONDS,
  IMPORT_PREVIEW_GROUPS,
  IMPORT_READY_OUTCOMES,
  IMPORT_REPORT_GROUPS,
  IMPORT_WIZARD_START,
  IMPORT_WIZARD_STEPS,
  importContinueGate,
  importFixAct,
  importListStep,
  importReadyCount,
  importWizardFrame,
  importWizardStepIndex,
  importWizardViewAfter,
  mappingForHeader,
} from './import-wizard';
export type {
  ItemDraft,
  ItemDraftEvent,
  ItemDraftJudgement,
  ItemFieldFailure,
  ItemFieldIssue,
  ItemSpecValue,
  OwnItemCreateBody,
  SchemeDraft,
} from './item-draft';
export {
  blankItemDraft,
  draftIsBlank,
  draftIsDirty,
  itemDraftAfter,
  itemDraftFrom,
  judgeItemDraft,
  optionalFolded,
  optionalPathsOf,
} from './item-draft';
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
  CatalogFilter,
  CatalogItemSource,
  CatalogLayer,
  CatalogSort,
  ReleaseFieldChange,
  ReleaseSide,
  ResolvedFields,
  TierRow,
} from './settings-view';
export {
  CATALOG_SORTS,
  catalogFiltersOn,
  catalogLayerOf,
  catalogTeaches,
  NO_CATALOG_FILTER,
  PANEL_WATT_RANGE,
  releaseFieldChanges,
  tierRowsOf,
  withKinds,
} from './settings-view';
export type {
  BatterySpec,
  CatalogSpec,
  InverterSpec,
  MicroInverterSpec,
  MpptWindow,
  OptimiserSpec,
  PanelSpec,
  SpecField,
  SpecParse,
} from './specs';
export { catalogSpecSchema, parseCatalogSpec, SPEC_FIELDS } from './specs';
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
