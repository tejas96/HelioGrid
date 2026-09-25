import { describe, expect, it } from 'vitest';
import { IDEMPOTENCY_KEY_HEADER } from '../src/common';
import { apiContract } from '../src/index';

/**
 * `F4-07`: a create applied twice never makes a second record. A route that answers 201 creates,
 * and the retry key is how the server knows the second send is the first one again — so a create
 * route without the key header is a duplicate waiting for a dropped connection (`M138`).
 */
interface RouteLike {
  readonly method: string;
  readonly path: string;
  readonly responses: Record<string, unknown>;
  readonly headers?: unknown;
}

function routesOf(node: unknown, found: RouteLike[] = []): RouteLike[] {
  if (node === null || typeof node !== 'object') return found;
  const candidate = node as Partial<RouteLike>;
  if (typeof candidate.method === 'string' && typeof candidate.path === 'string') {
    found.push(candidate as RouteLike);
    return found;
  }
  for (const child of Object.values(node)) routesOf(child, found);
  return found;
}

function carriesRetryKey(route: RouteLike): boolean {
  const headers = route.headers as { shape?: Record<string, unknown> } | undefined;
  return headers?.shape?.[IDEMPOTENCY_KEY_HEADER] !== undefined;
}

describe('every create route carries the retry key (F4-07, M138)', () => {
  const creates = routesOf(apiContract).filter((route) => '201' in route.responses);

  it('finds the create routes it guards', () => {
    expect(creates.length).toBeGreaterThan(0);
  });

  it('declares the idempotency-key header on each of them', () => {
    const missing = creates
      .filter((route) => !carriesRetryKey(route))
      .map((route) => `${route.method} ${route.path}`);
    expect(missing).toEqual([]);
  });
});
