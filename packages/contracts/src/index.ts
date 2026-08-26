import { initContract } from '@ts-rest/core';
import { healthContract } from './health';

export * from './common';
export * from './error';
export * from './health';
// UI language identity: its own file because non-contract consumers (packages/i18n, the
// Lingui CLI config) read it. Re-exported here so no import path changes.
export * from './locale';
// The session projection and its port. Contract-only until the M01 slice lands the guard,
// the resolver and the tables — authored first because a projection invented alongside its
// first consumer is a projection shaped by that consumer.
export * from './ports/session';
export * from './session';

const c = initContract();

/**
 * The root API contract. Feature modules mount their routers here — contract FIRST,
 * then implementation; the contract diff is the API review surface (CLAUDE.md §2 Law 3).
 *
 * Auth and tenancy were removed to greenfield on 2026-08-01 (owner ruling) and
 * return with their rebuild, which also re-authors `ports/session.ts` for the guard.
 */
export const apiContract = c.router(
  {
    health: healthContract,
  },
  {
    strictStatusCodes: true,
  },
);

export type ApiContract = typeof apiContract;
