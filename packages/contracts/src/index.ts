import { initContract } from '@ts-rest/core';
import { authContract } from './auth';
import { healthContract } from './health';

export * from './auth';
export * from './common';
export * from './error';
export { healthContract };

const c = initContract();

/**
 * The root API contract. Feature modules mount their routers here — contract FIRST,
 * then implementation; the contract diff is the API review surface (CLAUDE.md hard rule).
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
