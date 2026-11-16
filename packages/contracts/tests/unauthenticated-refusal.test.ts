import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { apiContract } from '../src/index';
import { routesOf } from './support/routes';

/**
 * A route the session guard refuses reads BOTH codes the guard sends with a 401. A lapsed web
 * token cookie reaches a route with no credential at all, so the guard answers `NO_CREDENTIAL`; a
 * 401 schema that reads `UNAUTHENTICATED` alone fails the client's response check, which throws
 * before the transport's one refresh-and-retry runs, and a save is lost while the session is still
 * good. A 401 that means something else (a wrong code at the door, a webhook's signature) reads
 * neither and is not the guard's.
 */
const reads = (envelope: z.ZodTypeAny, code: string) =>
  envelope.safeParse({ error: { code, message: 'm', requestId: 'r' } }).success;

const GUARDED = routesOf(apiContract).flatMap(({ name, route }) => {
  const envelope = route.responses[401];
  return envelope instanceof z.ZodType && reads(envelope, 'UNAUTHENTICATED')
    ? [[name, envelope] as const]
    : [];
});

describe('a session refusal reads both authentication codes', () => {
  it('finds the guarded routes', () => {
    expect(GUARDED.length).toBeGreaterThan(0);
  });

  it.each(GUARDED)('%s reads a 401 NO_CREDENTIAL', (_name, envelope) => {
    expect(reads(envelope, 'NO_CREDENTIAL')).toBe(true);
  });
});
