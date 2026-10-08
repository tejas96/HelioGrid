import { apiContract } from '@heliogrid/contracts';
import { type AppRouter, isAppRoute } from '@ts-rest/core';
import type { Request } from 'express';
import { matchedRouteKey, routeKey } from '../auth/access';

/**
 * Every route's declared statuses, keyed as the guard keys a route, from the ROOT contract — the
 * one the OpenAPI is emitted from and the one carrying the shared refusals, so what the filter lets
 * through and what the spec promises cannot differ.
 */
function statusesByRoute(router: AppRouter): [string, ReadonlySet<number>][] {
  return Object.values(router).flatMap((entry) =>
    isAppRoute(entry)
      ? [[routeKey(entry.method, entry.path), new Set(Object.keys(entry.responses).map(Number))]]
      : statusesByRoute(entry),
  );
}

const DECLARED = new Map(statusesByRoute(apiContract));

/**
 * The matched route's key when that route does not declare `status`; otherwise `undefined` — also
 * when no route matched (an unknown path, the body parser, the version gate), since no contract
 * speaks for that request.
 */
export function routeNotDeclaring(req: Request, status: number): string | undefined {
  const key = matchedRouteKey(req);
  if (key === undefined) return undefined;
  const declared = DECLARED.get(key);
  return declared === undefined || declared.has(status) ? undefined : key;
}
