/**
 * The catalog's closed sets. Contracts derives its `z.enum`s from these and the database mirrors
 * them as pgEnums (`T-M01-027`), so a member added here is added to both in the same change.
 */

/**
 * What a catalog item is. Micro-inverters and optimisers are ordinary members (`M01-45`); v1 holds
 * them as items only, with no electrical model behind them (M05's recorded non-goal).
 */
export const COMPONENT_KINDS = [
  'panel',
  'inverter',
  'battery',
  'micro_inverter',
  'optimiser',
] as const;
export type ComponentKind = (typeof COMPONENT_KINDS)[number];

/**
 * Where an item's SPECS came from (`M01-35`) — never a statement about a price, since a platform
 * item carries none. `tenant_provided` is every own SKU's, always.
 */
export const CATALOG_PROVENANCE_LABELS = [
  'verified_datasheet',
  'tenant_provided',
  'representative',
] as const;
export type CatalogProvenanceLabel = (typeof CATALOG_PROVENANCE_LABELS)[number];

/** Whether a platform item can be bought now; the studio flags the last two (S5.wrong.4). */
export const CATALOG_AVAILABILITY = ['available', 'out_of_stock', 'discontinued'] as const;
export type CatalogAvailability = (typeof CATALOG_AVAILABILITY)[number];

/**
 * Which tier supplied a resolved value (MS4-07's second axis): the tenant's override on a platform
 * item, the tenant's own SKU, the platform item, or the market pack a value falls through to.
 */
export const CATALOG_SOURCES = ['override', 'own_item', 'platform_item', 'pack'] as const;
export type CatalogSource = (typeof CATALOG_SOURCES)[number];

/**
 * A panel's cell technology, as a key the screens translate. Bifacial is kept beside the cell
 * types because the POC's catalog files it there; how much a back face yields is the module's
 * `bifacialityPct`, never this key.
 */
export const PANEL_TECHNOLOGIES = ['mono_perc', 'topcon', 'bifacial', 'poly', 'hjt'] as const;
export type PanelTechnology = (typeof PANEL_TECHNOLOGIES)[number];

export const BATTERY_CHEMISTRIES = ['lfp', 'nmc', 'lead_acid'] as const;
export type BatteryChemistry = (typeof BATTERY_CHEMISTRIES)[number];
