import { initContract } from '@ts-rest/core';
import { auditContract } from './audit';
import { authContract } from './auth';
import { healthContract } from './health';
import { invitationContract } from './invitation';
import { marketPackContract } from './market';
import { onboardingContract } from './onboarding';
import { tenantContract } from './tenant';
import { tenantSettingsContract } from './tenant-settings';
import { userContract } from './user';

// The tenant's own append-only record of what the product performed (`T-FPLAT-004`).
export * from './audit';
// The front door (`T-M01-025`): a phone and a code, the session, the token life.
export * from './auth';
// The company's identity facts (`T-M01-026`): the profile and its tax registrations.
export * from './business-profile';
export * from './common';
// Content shapes a customer document is made of: per-language values, rich text.
export * from './document-content';
// The tenant's document defaults: branding, proposal, timeline and payment-term templates.
export * from './document-templates';
export * from './error';
export * from './health';
// The team invite (`T-M01-028`): the send, the Team list, the landing and the one-step accept.
export * from './invitation';
// UI language identity: its own file because non-contract consumers (packages/i18n, the
// Lingui CLI config) read it. Re-exported here so no import path changes.
export * from './locale';
// The market pack read (`T-FCORE-016`): the envelope and the tenant-readable keys, never the book.
export * from './market';
// The setup corridor (`T-M01-026`): resume, and the one prompt-point per skipped fact.
export * from './onboarding';
// The platform message rail (the code and the invite), the session projection and its port.
export * from './ports/message-delivery';
export * from './ports/session';
export * from './session';
// The tenant (`T-M01-025`): signup, the tenant facts, the roster, the request-to-join steer.
export * from './tenant';
// Tenant settings (`T-M01-026`): every setting's one home, and the resolved read.
export * from './tenant-settings';
// The account's own profile write (`T-M01-025`).
export * from './user';

const c = initContract();

/**
 * The root API contract. Feature modules mount their routers here — contract FIRST,
 * then implementation; the contract diff is the API review surface (CLAUDE.md §2 Law 3).
 *
 */
export const apiContract = c.router(
  {
    audit: auditContract,
    auth: authContract,
    health: healthContract,
    invitation: invitationContract,
    marketPack: marketPackContract,
    onboarding: onboardingContract,
    tenant: tenantContract,
    tenantSettings: tenantSettingsContract,
    user: userContract,
  },
  {
    strictStatusCodes: true,
  },
);

export type ApiContract = typeof apiContract;
