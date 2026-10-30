import {
  billingCheckout,
  brandingSettings,
  businessProfile,
  catalogImportJob,
  catalogImportRow,
  catalogRateEntry,
  catalogRelease,
  catalogReleaseLine,
  dunningEvent,
  entitlement,
  entitlementOverride,
  onboardingProgress,
  priceBookRate,
  priceBookVersion,
  proposalTemplateSettings,
  storageGaugeSnapshot,
  subscription,
  subscriptionPayment,
  subscriptionStateHistory,
  taxRegistration,
  tenantCatalogItem,
  tenantCatalogOverride,
  tenantHoliday,
  timelineTemplate,
  trancheTemplate,
  trancheTemplateLine,
  usageEvent,
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
 * The import's rows, then its jobs — a row points at its job and at the item it matched, a job at
 * its price list's file; the price book's rates before their versions; then lines, releases, the
 * ledger, the overrides and the own SKUs.
 */
export const TENANT_CATALOG_TABLES = [
  catalogImportRow,
  catalogImportJob,
  priceBookRate,
  priceBookVersion,
  catalogReleaseLine,
  catalogRelease,
  catalogRateEntry,
  tenantCatalogOverride,
  tenantCatalogItem,
] as const;

/**
 * A company's billing rows: its notices before the payments that cleared them; the payments, the
 * checkouts, the overrides and the history before the subscription each names; its limits after it, since another suite's timers repair a live
 * company's limits until it is gone; then its usage ledger and storage gauge.
 */
export const TENANT_BILLING_TABLES = [
  dunningEvent,
  entitlementOverride,
  subscriptionPayment,
  billingCheckout,
  subscriptionStateHistory,
  subscription,
  entitlement,
  usageEvent,
  storageGaugeSnapshot,
] as const;
