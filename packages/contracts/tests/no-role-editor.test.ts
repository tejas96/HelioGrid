import { describe, expect, it } from 'vitest';
import { apiContract } from '../src/index';
import { routesOf } from './support/routes';

/**
 * F2-02 and F2-16: presets are fixed, and no tenant creates, renames or deletes a role. A role
 * editor would have to start as a write route on a role resource; this refuses it at the
 * contract, before a screen has anything to call. A route that ASSIGNS presets to a member
 * lives under the member and is not a role editor.
 */
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const ROUTES = routesOf(apiContract).map(({ route }) => route);

describe('the contract has no role editor', () => {
  it('declares routes at all', () => {
    expect(ROUTES.length).toBeGreaterThan(0);
  });

  it('declares no write route on a role resource (F2-02, F2-16)', () => {
    const offenders = ROUTES.filter(
      (route) => /^\/roles(\/|$)/.test(route.path) && WRITE_METHODS.has(route.method),
    ).map((route) => `${route.method} ${route.path}`);
    expect(offenders).toEqual([]);
  });
});
