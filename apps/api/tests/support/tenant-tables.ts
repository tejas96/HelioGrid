import {
  activity,
  billingCheckout,
  brandingSettings,
  businessProfile,
  catalogImportJob,
  catalogImportRow,
  catalogRateEntry,
  catalogRelease,
  catalogReleaseLine,
  collectionsSettings,
  contact,
  contactRoleLabel,
  creditNote,
  crmDailySweep,
  customer,
  dunningEvent,
  duplicateLink,
  entitlement,
  entitlementOverride,
  invoiceLine,
  invoiceLineTax,
  lead,
  leadAssignment,
  leadFile,
  leadImport,
  leadImportRow,
  leadStageTransition,
  leadVisitBooking,
  onboardingProgress,
  overageAddOn,
  priceBookRate,
  priceBookVersion,
  proposalTemplateSettings,
  referral,
  storageGaugeSnapshot,
  subscription,
  subscriptionInvoice,
  subscriptionPayment,
  subscriptionPlanChange,
  subscriptionStateHistory,
  task,
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
  collectionsSettings,
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
 * A company's billing rows: its notices before the payments that cleared them; its credit notes
 * before the invoices they stand against; its invoices, lines
 * last-in first-out, before the payments they name; the payments, the
 * checkouts, the scheduled plan changes, the overrides and the history before the subscription each names; its limits after it, since another suite's timers repair a live
 * company's limits until it is gone; then its usage ledger and storage gauge.
 */
export const TENANT_BILLING_TABLES = [
  dunningEvent,
  entitlementOverride,
  creditNote,
  invoiceLineTax,
  invoiceLine,
  overageAddOn,
  subscriptionInvoice,
  subscriptionPayment,
  billingCheckout,
  subscriptionPlanChange,
  subscriptionStateHistory,
  subscription,
  entitlement,
  usageEvent,
  storageGaugeSnapshot,
] as const;

/**
 * A company's CRM rows: the import's rows (they name a lead, a customer and an enquiry) before its
 * jobs; the sweep's claims; the timeline, the two lead histories, tasks, visit bookings and the
 * lead's files before the leads they name; referrals before leads; leads and duplicate links
 * before customers; contacts before customers and the role labels they carry. A customer names its
 * primary contact and a contact its customer, so `unseed` unties that pair before walking the list.
 */
export const TENANT_CRM_TABLES = [
  leadImportRow,
  leadImport,
  crmDailySweep,
  activity,
  leadStageTransition,
  leadAssignment,
  task,
  leadVisitBooking,
  leadFile,
  referral,
  lead,
  duplicateLink,
  contact,
  customer,
  contactRoleLabel,
] as const;
