import {
  brandingSettings,
  businessProfile,
  catalogImportJob,
  catalogRateEntry,
  catalogRelease,
  catalogReleaseLine,
  onboardingProgress,
  priceBookRate,
  priceBookVersion,
  proposalTemplateSettings,
  taxRegistration,
  tenantCatalogItem,
  tenantCatalogOverride,
  tenantHoliday,
  timelineTemplate,
  trancheTemplate,
  trancheTemplateLine,
} from '@heliogrid/db';

/**
 * The tenant-scoped rows a fixture's companies may own, each list in the order its rows can be
 * removed — a child before the row it points at. `unseed` walks them so a failure mid-run still
 * leaves the database as it was found.
 */
export const TENANT_SETTING_TABLES = [
  trancheTemplateLine,
  trancheTemplate,
  taxRegistration,
  tenantHoliday,
  businessProfile,
  brandingSettings,
  proposalTemplateSettings,
  timelineTemplate,
  onboardingProgress,
] as const;

/**
 * The import's jobs first — a job points at its price list's file; the price book's rates before
 * their versions; then lines, releases, the ledger, the overrides and the own SKUs — an own SKU
 * points at its datasheet file.
 */
export const TENANT_CATALOG_TABLES = [
  catalogImportJob,
  priceBookRate,
  priceBookVersion,
  catalogReleaseLine,
  catalogRelease,
  catalogRateEntry,
  tenantCatalogOverride,
  tenantCatalogItem,
] as const;
