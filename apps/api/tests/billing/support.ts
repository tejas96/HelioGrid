import type { GatewayEvent } from '@heliogrid/contracts';
import { type Db, subscription } from '@heliogrid/db';
import {
  type BillingCycle,
  IN_PACK,
  listedPrice,
  type MinorUnits,
  MS_PER_DAY,
  type Tier,
  TRIAL_DAYS,
} from '@heliogrid/domain';
import { platformSaleTotal } from '@heliogrid/domain/server';
import { PinoLogger } from 'nestjs-pino';
import { ChargeAdminRepository } from '../../src/modules/billing/charge.admin.repository';
import { ChargeService } from '../../src/modules/billing/charge.service';
import { EntitlementAdminRepository } from '../../src/modules/billing/entitlement.admin.repository';
import { EntitlementRepository } from '../../src/modules/billing/entitlement.repository';
import { EntitlementService } from '../../src/modules/billing/entitlement.service';
import { EntitlementOverrideAdminRepository } from '../../src/modules/billing/entitlement-override.admin.repository';
import {
  type AlertFacts,
  type BillingAlert,
  BillingAlerts,
} from '../../src/modules/billing/internal/billing-alerts';
import {
  DEVELOPMENT_SIGNATURE_HEADER,
  DevelopmentBillingGateway,
  developmentSignature,
} from '../../src/modules/billing/internal/billing-gateway.development';
import { UsageAdminRepository } from '../../src/modules/billing/usage.admin.repository';
import { UsageRepository } from '../../src/modules/billing/usage.repository';
import { UsageService } from '../../src/modules/billing/usage.service';
import type { openPools } from '../support/fixture';
import { marketsOf } from '../support/market';

type Pools = ReturnType<typeof openPools>;

/** A logger that writes nothing, for the services a suite composes by hand. */
export const silentLogger = (): PinoLogger => new PinoLogger({ pinoHttp: { level: 'silent' } });

/** The development gateway, as the billing module binds it under test. */
export const aDevelopmentGateway = (): DevelopmentBillingGateway =>
  new DevelopmentBillingGateway(silentLogger());

/** A company's trial, ending at `trialEndsAt`. */
export async function aTrial(db: Db, tenantId: string, trialEndsAt: number): Promise<string> {
  const startedAt = new Date(trialEndsAt - TRIAL_DAYS * MS_PER_DAY);
  const [row] = await db
    .insert(subscription)
    .values({
      tenantId,
      state: 'trialing',
      stateEnteredAt: startedAt,
      trialEndsAt: new Date(trialEndsAt),
      createdAt: startedAt,
    })
    .returning({ id: subscription.id });
  if (row === undefined) throw new Error('the trial was not written');
  return row.id;
}

/** A gateway message as the development gateway signs it: the bytes, and its headers. */
export function signed(event: GatewayEvent): {
  body: GatewayEvent;
  headers: Record<string, string>;
} {
  return {
    body: event,
    headers: { [DEVELOPMENT_SIGNATURE_HEADER]: developmentSignature(JSON.stringify(event)) },
  };
}

/** The real alerts, which also keep what they raised for a suite to read. */
export class RecordedAlerts extends BillingAlerts {
  readonly raised: [BillingAlert, AlertFacts][] = [];

  override raise(alert: BillingAlert, facts: AlertFacts): void {
    this.raised.push([alert, facts]);
    super.raise(alert, facts);
  }
}

/** What the IN gateway collects for a tier on a cycle, tax included — from the book, never typed. */
export function collectedFor(tier: Tier, cycle: BillingCycle): MinorUnits {
  const list = listedPrice(IN_PACK.priceBook, tier, cycle);
  if (list === null) throw new Error(`the IN book sells no ${tier} ${cycle}`);
  return platformSaleTotal(IN_PACK, list);
}

/**
 * Entitlements as `billing.module.ts` composes them, over the real repositories on both pools. The
 * book is read from the published pack, so a suite publishes it first (`publishIndiaPack`).
 */
export function entitlementServiceOf(pools: Pools): EntitlementService {
  return new EntitlementService(
    new EntitlementRepository(pools.tenants),
    new EntitlementAdminRepository(pools.admin.db),
    new EntitlementOverrideAdminRepository(pools.admin.db),
    marketsOf(pools),
    silentLogger(),
  );
}

/** The usage ledger as `billing.module.ts` composes it, over the real repositories on both pools. */
export function usageServiceOf(pools: Pools): UsageService {
  return new UsageService(
    new UsageRepository(pools.tenants),
    new UsageAdminRepository(pools.admin.db),
    entitlementServiceOf(pools),
  );
}

/** The charge path as `billing.module.ts` composes it, over the real admin repository. */
export function chargeServiceOf(
  pools: Pools,
  alerts: BillingAlerts = new BillingAlerts(silentLogger()),
): ChargeService {
  return new ChargeService(
    new ChargeAdminRepository(pools.admin.db),
    alerts,
    entitlementServiceOf(pools),
    silentLogger(),
  );
}
