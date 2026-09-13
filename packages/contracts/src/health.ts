import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseError, errorEnvelope } from './error';

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
/**
 * What a readiness answer says, and the one place the three check verdicts are written. A server
 * that retypes them has a second vocabulary that can drift from the wire — the shape callers
 * validate against — without anything noticing.
 */
export const readinessSchema = z.object({
  status: z.literal('ok'),
  checks: z.record(z.enum(['ok', 'skipped', 'failed'])),
});

/** One check's verdict, for a server assembling the map above. */
export type CheckVerdict = z.infer<typeof readinessSchema>['checks'][string];

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
      200: readinessSchema,
      503: errorEnvelope(baseError('INTERNAL')),
    },
  },
});
