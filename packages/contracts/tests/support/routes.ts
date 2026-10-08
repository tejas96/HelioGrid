import { type AppRoute, type AppRouter, isAppRoute } from '@ts-rest/core';

export interface NamedRoute {
  /** The route's key path in the router, `tenant.me` — what a failing case names. */
  readonly name: string;
  readonly route: AppRoute;
}

/** Every route a router mounts, at any depth, with the key path that reaches it. */
export function routesOf(router: AppRouter, prefix = ''): NamedRoute[] {
  return Object.entries(router).flatMap(([key, value]) =>
    isAppRoute(value)
      ? [{ name: `${prefix}${key}`, route: value }]
      : routesOf(value, `${prefix}${key}.`),
  );
}
