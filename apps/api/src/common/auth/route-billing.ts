import type { BillingCapability } from '@heliogrid/domain';
import { SetMetadata } from '@nestjs/common';
import type { AppRouter } from '@ts-rest/core';
import { routeKey } from './access';

/**
 * Which row of the billing matrix a mutating route belongs to (`M12-21`, `BM-35`), or `ungated`
 * for a mutation in none of its paused rows — a setting, the catalog, the team, a person's own
 * profile — or one that only finishes an act its row already let start: closing an upload already
 * issued, or capturing inside a field visit begun before a halt (`M12-27`). Pausing those would
 * widen a block the matrix does not draw.
 */
export type BillingRow = BillingCapability | 'ungated';

export const ROUTE_BILLING = Symbol('heliogrid.RouteBilling');

type RouteName<R extends AppRouter> = Extract<keyof R, string>;

/** The router's routes that change something: every method but `GET`, which is never gated. */
type MutatingName<R extends AppRouter> = {
  [Name in RouteName<R>]: R[Name] extends { readonly method: 'GET' } ? never : Name;
}[RouteName<R>];

/**
 * Declares every mutating route's matrix row on the controller method that serves the router,
 * beside `RouteAccessMap`. Typed on the router's non-`GET` keys, so a new mutation fails to compile
 * until it names its row, and a read cannot be named at all (`M12-23`: nothing fires on read).
 */
export function RouteBillingMap<R extends AppRouter>(
  router: R,
  rows: { readonly [Name in MutatingName<R>]: BillingRow },
): MethodDecorator {
  const byKey = new Map<string, BillingRow>();
  for (const name of Object.keys(rows) as MutatingName<R>[]) {
    const route = router[name] as { method: string; path: string };
    byKey.set(routeKey(route.method, route.path), rows[name]);
  }
  return SetMetadata(ROUTE_BILLING, byKey);
}
