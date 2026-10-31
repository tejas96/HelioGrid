import { apiContract, fileContract } from '@heliogrid/contracts';
import {
  BILLING_CAPABILITIES,
  BILLING_PHASES,
  type BillingPhase,
  billingPhaseAt,
  capabilityStanding,
  METERED_PAUSE_DAY,
  MS_PER_DAY,
  PAST_DUE_GRACE_DAYS,
  type SubscriptionClock,
} from '@heliogrid/domain';
import type { AppRoute } from '@ts-rest/core';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module';
import { ROUTE_ACCESS, type RouteAccess, routeKey } from '../../src/common/auth/access';
import {
  type BillingRow,
  ROUTE_BILLING,
  RouteBillingMap,
} from '../../src/common/auth/route-billing';
import { billingRefusal } from '../../src/modules/billing/billing-state.guard';

/**
 * The billing gate's route map, read off every controller the app boots (`M12-21`–`M12-23`,
 * `BM-35`): every mutation names one matrix row, no read names any, and a row is refused exactly
 * where the matrix pauses it.
 */

const NOW = Date.parse('2026-10-30T06:00:00Z');
/** Any span that leaves a clock well inside its phase. */
const LONG_AGO = PAST_DUE_GRACE_DAYS * MS_PER_DAY;

/** A subscription that sits in each phase at `NOW`. */
const CLOCK: Record<BillingPhase, SubscriptionClock> = {
  trialing: {
    state: 'trialing',
    stateEnteredAt: NOW - MS_PER_DAY,
    trialEndsAt: NOW + LONG_AGO,
    paidPeriodEnd: null,
  },
  active: {
    state: 'active',
    stateEnteredAt: NOW - MS_PER_DAY,
    trialEndsAt: null,
    paidPeriodEnd: NOW + LONG_AGO,
  },
  past_due_full_function: {
    state: 'past_due',
    stateEnteredAt: NOW - (METERED_PAUSE_DAY - 1) * MS_PER_DAY,
    trialEndsAt: null,
    paidPeriodEnd: NOW - LONG_AGO,
  },
  past_due_metered_paused: {
    state: 'past_due',
    stateEnteredAt: NOW - METERED_PAUSE_DAY * MS_PER_DAY,
    trialEndsAt: null,
    paidPeriodEnd: NOW - LONG_AGO,
  },
  halted: {
    state: 'halted',
    stateEnteredAt: NOW - MS_PER_DAY,
    trialEndsAt: null,
    paidPeriodEnd: NOW - LONG_AGO,
  },
  expired: {
    state: 'expired',
    stateEnteredAt: NOW - MS_PER_DAY,
    trialEndsAt: NOW - MS_PER_DAY,
    paidPeriodEnd: null,
  },
  cancelled_post_period: {
    state: 'cancelled',
    stateEnteredAt: NOW - LONG_AGO,
    trialEndsAt: null,
    paidPeriodEnd: NOW - MS_PER_DAY,
  },
};

interface Declared {
  readonly billing: Map<string, BillingRow>;
  readonly access: Map<string, RouteAccess>;
}

/** One controller's handlers' two maps, added to what has been read so far. */
function readController(controller: unknown, into: Declared): void {
  const prototype = (controller as { prototype: Record<string, unknown> }).prototype;
  for (const name of Object.getOwnPropertyNames(prototype)) {
    const handler = prototype[name];
    if (typeof handler !== 'function') continue;
    const rows: Map<string, BillingRow> = Reflect.getMetadata(ROUTE_BILLING, handler) ?? new Map();
    const needs: Map<string, RouteAccess> = Reflect.getMetadata(ROUTE_ACCESS, handler) ?? new Map();
    for (const [key, row] of rows) into.billing.set(key, row);
    for (const [key, need] of needs) into.access.set(key, need);
  }
}

/** Every controller method's two maps, walked from the root module through its imports. */
function declaredMaps(): Declared {
  const declared: Declared = { billing: new Map(), access: new Map() };
  const seen = new Set<unknown>();
  const visit = (module: unknown) => {
    const type = (module as { module?: unknown }).module ?? module;
    if (typeof type !== 'function' || seen.has(type)) return;
    seen.add(type);
    for (const imported of Reflect.getMetadata('imports', type) ?? []) visit(imported);
    for (const controller of Reflect.getMetadata('controllers', type) ?? []) {
      readController(controller, declared);
    }
  };
  visit(AppModule);
  return declared;
}

function routesOf(router: object): AppRoute[] {
  return Object.values(router).flatMap((entry) =>
    'method' in entry && 'path' in entry ? [entry as AppRoute] : routesOf(entry),
  );
}

const { billing, access } = declaredMaps();
const routes = routesOf(apiContract);
const pausable = (row: BillingRow) =>
  row !== 'ungated' && BILLING_PHASES.some((phase) => capabilityStanding(row, phase) === 'paused');

describe('the billing gate’s route map (M12-21, M12-23, BM-35)', () => {
  it.each(BILLING_PHASES)('the clock for %s sits in that phase', (phase) => {
    expect(billingPhaseAt(CLOCK[phase], NOW)).toBe(phase);
  });

  it.each(BILLING_PHASES)(
    'every mutating route is refused exactly where its matrix row pauses, in every phase — %s',
    (phase) => {
      const rows: [string, BillingRow][] = [
        ...billing,
        ...BILLING_CAPABILITIES.map((row): [string, BillingRow] => [`row ${row}`, row]),
      ];
      for (const [key, row] of rows) {
        const paused = row !== 'ungated' && capabilityStanding(row, phase) === 'paused';
        expect({ key, refused: billingRefusal(row, CLOCK[phase], NOW) !== null }).toEqual({
          key,
          refused: paused,
        });
      }
    },
  );

  it('no read route names a matrix row', () => {
    const mutating = routes.filter((route) => route.method !== 'GET');
    expect([...billing.keys()].sort()).toEqual(
      mutating.map((route) => routeKey(route.method, route.path)).sort(),
    );
    RouteBillingMap(fileContract, {
      declare: 'new_file_upload',
      complete: 'ungated',
      // @ts-expect-error — a read route has no matrix row to name
      downloadUrl: 'ungated',
    });
  });

  it('every route whose row can pause sits behind a membership and answers the blocked envelope', () => {
    const blocked = {
      error: {
        code: 'ENTITLEMENT_BLOCKED',
        message: 'm',
        requestId: 'r',
        blocked: {
          reason: 'billing_state',
          capability: 'team_invites',
          phase: 'halted',
          haltsAt: null,
        },
      },
    };
    for (const route of routes) {
      const key = routeKey(route.method, route.path);
      const row = billing.get(key);
      if (row === undefined || !pausable(row)) continue;
      const need = access.get(key);
      expect({ key, member: need === 'member' || typeof need === 'object' }).toEqual({
        key,
        member: true,
      });
      const refusal = (
        route.responses as Record<number, { safeParse(v: unknown): { success: boolean } }>
      )[403];
      expect({ key, answers: refusal?.safeParse(blocked).success }).toEqual({ key, answers: true });
    }
  });

  it('a photograph already captured and every create or edit row work through all of past_due', () => {
    const throughGrace = ['past_due_full_function', 'past_due_metered_paused'] as const;
    for (const row of [
      'create_edit_records',
      'studio_design_edit',
      'sell_and_deliver',
      'new_file_upload',
    ] as const) {
      for (const phase of throughGrace) expect(billingRefusal(row, CLOCK[phase], NOW)).toBeNull();
      expect(billingRefusal(row, CLOCK.halted, NOW)).not.toBeNull();
    }
    for (const phase of BILLING_PHASES) {
      expect(billingRefusal('pending_field_photo_upload', CLOCK[phase], NOW)).toBeNull();
    }
  });

  it('a company with no subscription row is never refused', () => {
    expect(billingRefusal('new_file_upload', null, NOW)).toBeNull();
  });
});
