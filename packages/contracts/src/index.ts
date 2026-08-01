import { initContract } from '@ts-rest/core';
import { healthContract } from './health';

export * from './common';
export * from './error';
export * from './health';

const c = initContract();

/**
 * The root API contract. Feature modules mount their routers here — contract FIRST,
 * then implementation; the contract diff is the API review surface (.claude/rules/00-laws.md Law 3).
 *
 * Auth and tenancy were removed to greenfield on 2026-08-01 (owner ruling, ADR-0024) and
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
