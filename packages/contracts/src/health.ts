import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { errorEnvelope } from './error';

const c = initContract();

/** The liveness body — exported so consumers infer it instead of re-declaring it. */
export const livenessSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  version: z.string(),
});
export type Liveness = z.infer<typeof livenessSchema>;

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
      200: livenessSchema,
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
