import type { EntitlementBlocked } from '@heliogrid/contracts';
import {
  billingPhaseAt,
  capabilityStanding,
  isAlwaysOn,
  pastDueHaltsAt,
  type SubscriptionClock,
} from '@heliogrid/domain';
import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { matchedRouteKey } from '../../common/auth/access';
import { type BillingRow, ROUTE_BILLING } from '../../common/auth/route-billing';
import { tenantIdOf } from '../../common/auth/session-context';
import { EntitlementBlockedException } from '../../common/errors/entitlement-blocked';
import { BillingStateRepository } from './billing-state.repository';

/**
 * Why a mutation on this row is refused at `now`, or `null` when it may go ahead (`BM-35`): only a
 * `paused` cell refuses, so the gate can never move a ✓ to a block. A company with no
 * subscription row is never refused — signup writes one, and refusing would hold a company
 * hostage for our fault.
 */
export function billingRefusal(
  row: BillingRow,
  clock: SubscriptionClock | null,
  now: number,
): EntitlementBlocked | null {
  if (row === 'ungated' || clock === null) return null;
  const phase = billingPhaseAt(clock, now);
  if (capabilityStanding(row, phase) !== 'paused') return null;
  const pastDue = phase === 'past_due_full_function' || phase === 'past_due_metered_paused';
  return {
    reason: 'billing_state',
    capability: row,
    phase,
    haltsAt: pastDue ? new Date(pastDueHaltsAt(clock.stateEnteredAt)).toISOString() : null,
  };
}

/**
 * The billing-state gate on every mutation (`M12-21`, `M12-23`), bound right after `SessionGuard`
 * so the company is known. A read is never gated; a row that no phase can pause skips the read.
 */
@Injectable()
export class BillingStateGuard implements CanActivate {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(BillingStateRepository) private readonly states: BillingStateRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    if (req.method === 'GET') return true;
    const declared = this.reflector.get<Map<string, BillingRow> | undefined>(
      ROUTE_BILLING,
      context.getHandler(),
    );
    const key = matchedRouteKey(req);
    const row = key === undefined ? undefined : declared?.get(key);
    if (row === undefined) throw new Error(`${key ?? req.method} declares no billing row`);
    if (row === 'ungated' || isAlwaysOn(row)) return true;
    const refusal = billingRefusal(row, await this.states.clockOf(tenantIdOf(req)), Date.now());
    if (refusal !== null) throw new EntitlementBlockedException(refusal);
    return true;
  }
}
