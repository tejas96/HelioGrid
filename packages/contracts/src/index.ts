import { initContract } from '@ts-rest/core';
import { authContract } from './auth';
import { healthContract } from './health';

export * from './auth';
export * from './common';
export * from './env';
export * from './error';
export * from './health';
export * from './ports/session';

const c = initContract();

/**
 * The root API contract. Feature modules mount their routers here — contract FIRST,
 * then implementation; the contract diff is the API review surface (.claude/rules/00-laws.md Law 3).
 */
export const apiContract = c.router(
  {
    health: healthContract,
    auth: authContract,
  },
  {
    strictStatusCodes: true,
  },
);

export type ApiContract = typeof apiContract;
