/**
 * The catalog (M01-33 to M01-45): what an item is, the specs it may carry, and the view-model one
 * resolves to for a tenant on a date. `resolveCatalogItem` hands out a money figure, so it is on
 * `./server` alone (F4-04); its types are here, because a screen renders what the server sent.
 */
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
export { parseCatalogSpec } from './specs';
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
