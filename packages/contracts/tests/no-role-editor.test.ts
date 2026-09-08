import { describe, expect, it } from 'vitest';
import { apiContract } from '../src/index';

/**
 * F2-02 and F2-16: presets are fixed, and no tenant creates, renames or deletes a role. A role
 * editor would have to start as a write route on a role resource; this refuses it at the
 * contract, before a screen has anything to call. A route that ASSIGNS presets to a member
 * lives under the member and is not a role editor.
 */
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

interface RouteLike {
  readonly method: string;
  readonly path: string;
}

function routesOf(node: unknown, found: RouteLike[] = []): RouteLike[] {
  if (node === null || typeof node !== 'object') return found;
  const candidate = node as Partial<RouteLike>;
  if (typeof candidate.method === 'string' && typeof candidate.path === 'string') {
    found.push({ method: candidate.method, path: candidate.path });
    return found;
  }
  for (const child of Object.values(node)) routesOf(child, found);
  return found;
}

describe('the contract has no role editor', () => {
  it('declares routes at all', () => {
    expect(routesOf(apiContract).length).toBeGreaterThan(0);
  });

  it('declares no write route on a role resource (F2-02, F2-16)', () => {
    const offenders = routesOf(apiContract)
      .filter((route) => /^\/roles(\/|$)/.test(route.path) && WRITE_METHODS.has(route.method))
      .map((route) => `${route.method} ${route.path}`);
    expect(offenders).toEqual([]);
  });
});
