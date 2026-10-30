import { BILLING_GATEWAY, type BillingGateway } from '@heliogrid/contracts';
import {
  BILLING_CYCLES,
  type BillingCycle,
  listedPrice,
  type MarketPack,
  type MinorUnits,
  TIERS,
  type Tier,
} from '@heliogrid/domain';
import { platformSaleTotal } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { PlanPriceAdminRepository } from './plan-price.admin.repository';

/**
 * The gateway's plan objects and their mirror rows (`M12-12`): every tier the book sells, on both
 * cycles, at what the gateway collects. Run by the publish command after the pack. A price whose
 * collected amount is unchanged keeps its plan object and row, so a repeat run writes nothing; a
 * repriced one gets a new plan object and a new row, and the old row stands for whoever bills on it.
 * A row whose plan the bound gateway does not hold — made by the development adapter, or on
 * test keys before live ones — gets a new plan object in place: the old ref can sell nothing.
 */
@Injectable()
export class PlanPriceService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(PlanPriceAdminRepository) private readonly prices: PlanPriceAdminRepository,
    @Inject(BILLING_GATEWAY) private readonly gateway: BillingGateway,
  ) {}

  async sync(pack: MarketPack, now: number): Promise<{ written: number }> {
    let written = 0;
    for (const tier of TIERS) {
      for (const cycle of BILLING_CYCLES) {
        const list = listedPrice(pack.priceBook, tier, cycle);
        if (list !== null && (await this.syncOne(pack, tier, cycle, list, now))) written += 1;
      }
    }
    return { written };
  }

  /** `true` when it wrote: a new plan object, on a new row or in place of one the gateway lacks. */
  private async syncOne(
    pack: MarketPack,
    tier: Tier,
    cycle: BillingCycle,
    list: MinorUnits,
    now: number,
  ): Promise<boolean> {
    const key = { marketCode: pack.market, tier, cycle, currencyCode: pack.formats.currency };
    const collected = platformSaleTotal(pack, list);
    const current = await this.prices.current(key);
    const unchanged = current !== null && current.collectedMinor === collected;
    if (unchanged && (await this.gateway.hasPlan(current.gatewayPlanRef))) return false;
    const gatewayPlanRef = await this.gateway.createPlan({
      tier,
      cycle,
      currencyCode: key.currencyCode,
      amount: collected,
    });
    if (unchanged) {
      await this.prices.replaceGatewayPlan(current.id, gatewayPlanRef);
      return true;
    }
    return this.prices.insert({
      ...key,
      packVersion: pack.version,
      listMinor: list,
      collectedMinor: collected,
      gatewayPlanRef,
      createdAt: now,
    });
  }
}
