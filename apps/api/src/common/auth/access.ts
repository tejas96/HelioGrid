import type { Capability } from '@heliogrid/domain';
import { SetMetadata } from '@nestjs/common';
import type { AppRouter } from '@ts-rest/core';
import type { Request } from 'express';

/**
 * What a route needs before its handler runs (`F2-25`, `M15`): nothing; the session COOKIE,
 * which the handler itself verifies (the refresh grant is scoped to `/auth` and never becomes
 * a token); a live session by token; an active membership; or a capability the membership's
 * roles grant. Declared per route, beside the contract it serves, as a COMPLETE map — a route
 * the map does not name is denied, so silence is denial rather than a hole.
 */
export type RouteAccess =
  | 'public'
  | 'session-cookie'
  | 'session'
  | 'member'
  | { readonly capability: Capability };

export const ROUTE_ACCESS = Symbol('heliogrid.RouteAccess');

type RouteName<R extends AppRouter> = Extract<keyof R, string>;

/** `METHOD /path` as express reports the matched route back; the key the guard looks up. */
export function routeKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${path}`;
}

/**
 * Declares every route's access on the controller method that serves the router. The map is
 * typed against the router's keys, so a route added to the contract fails to compile here until
 * it says what it needs.
 */
export function RouteAccessMap<R extends AppRouter>(
  router: R,
  access: Readonly<Record<RouteName<R>, RouteAccess>>,
): MethodDecorator {
  const byKey = new Map<string, RouteAccess>();
  for (const name of Object.keys(access) as RouteName<R>[]) {
    const route = router[name] as { method: string; path: string };
    byKey.set(routeKey(route.method, route.path), access[name]);
  }
  return SetMetadata(ROUTE_ACCESS, byKey);
}

/** The access the matched route declared, or `undefined` for a route nobody declared. */
export function accessOf(
  declared: Map<string, RouteAccess> | undefined,
  req: Request,
): RouteAccess | undefined {
  const path = (req.route as { path?: string } | undefined)?.path;
  return path === undefined ? undefined : declared?.get(routeKey(req.method, path));
}
