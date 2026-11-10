import { initContract } from '@ts-rest/core';
import { auditContract } from './audit';
import { authContract } from './auth';
import { billingContract } from './billing';
import { billingDocumentContract, billingHomeContract } from './billing-home';
import { billingPlanChangeContract } from './billing-plan-change';
import { billingUsageContract } from './billing-usage';
import { catalogContract } from './catalog';
import { catalogImportContract } from './catalog-import';
import { catalogReleasesContract } from './catalog-releases';
import { activitiesContract } from './crm/activities';
import { leadAssignContract } from './crm/assign';
import { leadCallsContract } from './crm/calls';
import { leadCaptureContract } from './crm/capture';
import { contactsContract } from './crm/contacts';
import { leadEditsContract } from './crm/lead-edits';
import { leadImportContract } from './crm/lead-import';
import { leadsContract } from './crm/leads';
import { leadLifecycleContract } from './crm/lifecycle';
import { customerMergeContract } from './crm/merge';
import { leadMessagesContract } from './crm/messages';
import { tasksContract } from './crm/tasks';
import { visitsContract } from './crm/visits';
import { sharedRefusals } from './error';
import { fileContract } from './file';
import { healthContract } from './health';
import { invitationContract } from './invitation';
import { marketPackContract } from './market';
import { notificationContract } from './notification';
import { onboardingContract } from './onboarding';
import { priceBookContract } from './price-book';
import { pricingContract } from './pricing';
import { searchContract } from './search';
import { tenantContract } from './tenant';
import { tenantSettingsContract } from './tenant-settings';
import { userContract } from './user';

// The tenant's own append-only record of what the product performed (`T-FPLAT-004`).
export * from './audit';
// The front door (`T-M01-025`): a phone and a code, the session, the token life.
export * from './auth';
export * from './billing';
export * from './billing-home';
export * from './billing-plan-change';
export * from './billing-usage';
// The company's identity facts (`T-M01-026`): the profile and its tax registrations.
export * from './business-profile';
// The catalog (`T-M01-027`): its closed sets, the resolved read and the tenant's writes.
export * from './catalog';
// The spreadsheet import (`T-M01-030`): a stored price list becomes a job the wizard maps and runs.
export * from './catalog-import';
export * from './catalog-import-rows';
// The catalog's labelled releases (`T-M01-027` part c).
export * from './catalog-releases';
// The too-old phone (`T-FPLAT-033`): the version header and the 426 every route may answer.
export * from './client-version';
export * from './common';
// The CRM (`T-M02-001` … `016`): capture and dedupe, the inbox and list, assignment, lead detail and
// its acts, the timeline, contacts, visits, messages, tasks, the lead import and customer merge.
export * from './crm/activities';
export * from './crm/assign';
export * from './crm/calls';
export * from './crm/capture';
export * from './crm/contacts';
export * from './crm/lead-edits';
export * from './crm/lead-import';
export * from './crm/lead-import-rows';
export * from './crm/leads';
export * from './crm/lifecycle';
export * from './crm/merge';
export * from './crm/messages';
export * from './crm/schemas';
export * from './crm/tasks';
export * from './crm/visits';
export * from './crm/vocabulary';
// Content shapes a customer document is made of: per-language values, rich text.
export * from './document-content';
// The tenant's document defaults: branding, proposal, timeline and payment-term templates.
export * from './document-templates';
export * from './error';
// The one files table (`T-FPLAT-035`): declare, confirm, and a short-lived download link.
export * from './file';
export * from './health';
// The team invite (`T-M01-028`): the send, the Team list, the landing and the one-step accept.
export * from './invitation';
// UI language identity: its own file because non-contract consumers (packages/i18n, the
// Lingui CLI config) read it. Re-exported here so no import path changes.
export * from './locale';
// The market pack read (`T-FCORE-016`): the envelope and the tenant-readable keys, never the book.
export * from './market';
// The notification type registry and the record that is the truth (`T-FPLAT-017`).
export * from './notification';
// The setup corridor (`T-M01-026`): resume, and the one prompt-point per skipped fact.
export * from './onboarding';
// The platform message rail (the code and the invite), the session projection and its port.
export * from './ports/billing-gateway';
export * from './ports/identity-provider';
export * from './ports/message-delivery';
export * from './ports/object-store';
export * from './ports/push';
export * from './ports/session';
// The price book: versioned non-catalog rates (`T-M01-031`).
export * from './price-book';
export * from './pricing';
// Global search (`T-FPLAT-020`): leads, customers, people and catalog items in one read.
export * from './search';
export * from './session';
// The tenant (`T-M01-025`): signup, the tenant facts, the roster, the request-to-join steer.
export * from './tenant';
// Tenant settings (`T-M01-026`): every setting's one home, and the resolved read.
export * from './tenant-settings';
// The payment-term templates (`T-M01-020`): spread into the tenant settings router.
export * from './tranche-templates';
// Words the product says, minted only by packages/i18n (`T-SHELL-016`).
export type { TranslatedText } from './translated-text';
// The account's own profile write (`T-M01-025`).
export * from './user';

const c = initContract();

/** Every route answers in the declared statuses only, and carries the shared 400, 403 and 500. */
const ROOT_OPTIONS = { strictStatusCodes: true, commonResponses: sharedRefusals } as const;

/*
 * The root is built in two halves, each under the size the compiler will write out as one type:
 * one router of every route at once grew past it, and an inferred type that large stops the build.
 * A new area joins the half it belongs to; a half nearing the limit splits again.
 */
const platformRouters = c.router(
  {
    audit: auditContract,
    auth: authContract,
    billing: billingContract,
    billingDocument: billingDocumentContract,
    billingHome: billingHomeContract,
    billingPlanChange: billingPlanChangeContract,
    billingUsage: billingUsageContract,
    catalog: catalogContract,
    catalogImport: catalogImportContract,
    catalogReleases: catalogReleasesContract,
    file: fileContract,
    health: healthContract,
    invitation: invitationContract,
    marketPack: marketPackContract,
    notification: notificationContract,
    onboarding: onboardingContract,
    priceBook: priceBookContract,
    pricing: pricingContract,
    search: searchContract,
    tenant: tenantContract,
    tenantSettings: tenantSettingsContract,
    user: userContract,
  },
  ROOT_OPTIONS,
);

const crmRouters = c.router(
  {
    activities: activitiesContract,
    contacts: contactsContract,
    customerMerge: customerMergeContract,
    leadAssign: leadAssignContract,
    leadCalls: leadCallsContract,
    leadCapture: leadCaptureContract,
    leadEdits: leadEditsContract,
    leadImport: leadImportContract,
    leadLifecycle: leadLifecycleContract,
    leadMessages: leadMessagesContract,
    leads: leadsContract,
    tasks: tasksContract,
    visits: visitsContract,
  },
  ROOT_OPTIONS,
);

export type ApiContract = typeof platformRouters & typeof crmRouters;

/**
 * The root API contract. Feature modules mount their routers here — contract FIRST,
 * then implementation; the contract diff is the API review surface (CLAUDE.md §2 Law 3).
 */
export const apiContract: ApiContract = { ...platformRouters, ...crmRouters };
