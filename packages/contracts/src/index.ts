import { initContract } from '@ts-rest/core';
import { auditContract } from './audit';
import { authContract } from './auth';
import { healthContract } from './health';
import { marketPackContract } from './market';
import { tenantContract } from './tenant';
import { userContract } from './user';

// The tenant's own append-only record of what the product performed (`T-FPLAT-004`).
export * from './audit';
// The front door (`T-M01-025`): a phone and a code, the session, the token life.
export * from './auth';
export * from './common';
export * from './error';
export * from './health';
// UI language identity: its own file because non-contract consumers (packages/i18n, the
// Lingui CLI config) read it. Re-exported here so no import path changes.
export * from './locale';
// The market pack read (`T-FCORE-016`): the envelope and the tenant-readable keys, never the book.
export * from './market';
// The session projection and its port. Contract-only until the M01 slice lands the guard,
// the resolver and the tables — authored first because a projection invented alongside its
// first consumer is a projection shaped by that consumer.
export * from './ports/otp-delivery';
export * from './ports/session';
export * from './session';
// The tenant (`T-M01-025`): signup, the tenant facts, the roster, the request-to-join steer.
export * from './tenant';
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
    marketPack: marketPackContract,
    tenant: tenantContract,
    user: userContract,
  },
  {
    strictStatusCodes: true,
  },
);

export type ApiContract = typeof apiContract;
