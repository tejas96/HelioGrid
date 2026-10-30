import { BILLING_CYCLES, IN_PACK, listedPrice, TIERS } from '@heliogrid/domain';
import { platformSaleTotal } from '@heliogrid/domain/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PlanPriceAdminRepository } from '../../src/modules/billing/plan-price.admin.repository';
import { PlanPriceService } from '../../src/modules/billing/plan-price.service';
import { openPools, skipWithoutDatabase } from '../support/fixture';
import { aDevelopmentGateway } from './support';

/**
 * Plan objects and their mirror rows (`M12-12`): every tier the book sells exists on both cycles
 * at what the gateway collects, and a repeat publish writes nothing.
 */

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
});
