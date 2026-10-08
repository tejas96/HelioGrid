import type { AppRoute } from '@ts-rest/core';
import { describe, expect, it } from 'vitest';
import { IDEMPOTENCY_KEY_HEADER } from '../src/common';
import { apiContract } from '../src/index';
import { routesOf } from './support/routes';

/**
 * `F4-07`: a create applied twice never makes a second record. A route that answers 201 creates,
 * and the retry key is how the server knows the second send is the first one again — so a create
 * route without the key header is a duplicate waiting for a dropped connection.
 */
function carriesRetryKey(route: AppRoute): boolean {
  const headers = route.headers as { shape?: Record<string, unknown> } | undefined;
  return headers?.shape?.[IDEMPOTENCY_KEY_HEADER] !== undefined;
}

describe('every create route carries the retry key (F4-07)', () => {
  const creates = routesOf(apiContract)
    .map(({ route }) => route)
    .filter((route) => '201' in route.responses);

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
