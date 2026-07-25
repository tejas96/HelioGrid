import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { errorEnvelope } from './error';

const c = initContract();

/**
 * Platform health surface — the first implemented contract; also the liveness probe
 * target for Fly checks.
 */
export const healthContract = c.router({
  liveness: {
    method: 'GET',
    path: '/health',
    summary: 'Liveness — process is up',
    responses: {
      200: z.object({
        status: z.literal('ok'),
        service: z.string(),
        version: z.string(),
      }),
    },
  },
  readiness: {
    method: 'GET',
    path: '/health/ready',
    summary: 'Readiness — dependencies reachable (DB when configured)',
    responses: {
      200: z.object({
        status: z.literal('ok'),
        checks: z.record(z.enum(['ok', 'skipped', 'failed'])),
      }),
      503: errorEnvelope(z.literal('INTERNAL')),
    },
  },
});
