import type { GatewayPlanRequest } from '@heliogrid/contracts';
import { BILLING_CYCLES, IN_PACK, listedPrice, TIERS } from '@heliogrid/domain';
import { platformSaleTotal } from '@heliogrid/domain/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DevelopmentBillingGateway } from '../../src/modules/billing/internal/billing-gateway.development';
import { PlanPriceAdminRepository } from '../../src/modules/billing/plan-price.admin.repository';
import { PlanPriceService } from '../../src/modules/billing/plan-price.service';
import { openPools, skipWithoutDatabase } from '../support/fixture';
import { aDevelopmentGateway, silentLogger } from './support';

/**
 * Plan objects and their mirror rows (`M12-12`): every tier the book sells exists on both cycles
 * at what the gateway collects, and a repeat publish writes nothing.
 */

const OTHER_PREFIX = 'other_plan_';

/** A second gateway account: it holds only the plans it made. */
class AnotherGateway extends DevelopmentBillingGateway {
  override async createPlan(request: GatewayPlanRequest): Promise<string> {
    return `${OTHER_PREFIX}${request.tier}_${request.cycle}_${request.amount}`;
  }

  override async hasPlan(ref: string): Promise<boolean> {
    return ref.startsWith(OTHER_PREFIX);
  }
}

/**
 * The case below moves rows other suites' setup also syncs, so it publishes under ISO's testing
 * currency, which no other suite reads: on INR a parallel suite's sync would undo it mid-case.
 */
const TEST_CURRENCY = 'XTS';
const SWITCHED_PACK = { ...IN_PACK, formats: { ...IN_PACK.formats, currency: TEST_CURRENCY } };

const soldCount = TIERS.flatMap((tier) =>
  BILLING_CYCLES.filter((cycle) => listedPrice(IN_PACK.priceBook, tier, cycle) !== null),
).length;

const skip = skipWithoutDatabase(
  'PLAN PRICE PROOF',
  'The plan prices the gateway mirrors are UNPROVEN in this run.',
);

describe.skipIf(skip)('plan prices (M12-12)', () => {
  let pools: ReturnType<typeof openPools>;
  let prices: PlanPriceAdminRepository;
  let service: PlanPriceService;

  beforeAll(() => {
    pools = openPools();
    prices = new PlanPriceAdminRepository(pools.admin.db);
    service = new PlanPriceService(prices, aDevelopmentGateway());
  });

  afterAll(async () => {
    await pools.close();
  });

  it('each sold tier has a monthly and a yearly plan price with its gateway plan, and a second publish writes nothing', async () => {
    await service.sync(IN_PACK, Date.now());
    expect(await service.sync(IN_PACK, Date.now())).toEqual({ written: 0 });

    for (const tier of TIERS) {
      for (const cycle of BILLING_CYCLES) {
        const list = listedPrice(IN_PACK.priceBook, tier, cycle);
        const row = await prices.current({ marketCode: 'IN', tier, cycle, currencyCode: 'INR' });
        if (list === null) {
          expect(row, `${tier} ${cycle} is not sold`).toBeNull();
          continue;
        }
        expect(row, `${tier} ${cycle}`).toMatchObject({
          collectedMinor: platformSaleTotal(IN_PACK, list),
          gatewayPlanRef: expect.stringMatching(/.+/),
        });
      }
    }
  });

  it('a plan the bound gateway does not hold is made again at that gateway, and a second publish writes nothing', async () => {
    const development = new PlanPriceService(prices, aDevelopmentGateway());
    const other = new PlanPriceService(prices, new AnotherGateway(silentLogger()));
    await development.sync(SWITCHED_PACK, Date.now());

    expect(await other.sync(SWITCHED_PACK, Date.now())).toEqual({ written: soldCount });
    expect(await other.sync(SWITCHED_PACK, Date.now())).toEqual({ written: 0 });
    const growth = await prices.current({
      marketCode: 'IN',
      tier: 'growth',
      cycle: 'monthly',
      currencyCode: TEST_CURRENCY,
    });
    expect(growth?.gatewayPlanRef).toMatch(/^other_plan_growth_monthly_/);
  });
});
