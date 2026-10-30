import { BILLING_GATEWAY, type BillingGateway } from '@heliogrid/contracts';
import { BILLING_CYCLES, listedPrice, type MarketPack, TIERS } from '@heliogrid/domain';
import { platformSaleTotal } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { PlanPriceAdminRepository } from './plan-price.admin.repository';

/**
 * The gateway's plan objects and their mirror rows (`M12-12`): every tier the book sells, on both
 * cycles, at what the gateway collects. Run by the publish command after the pack. A price whose
 * collected amount is unchanged keeps its plan object and row, so a repeat run writes nothing; a
 * repriced one gets a new plan object and a new row, and the old row stands for whoever bills on it.
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
        if (list === null) continue;
        const key = {
          marketCode: pack.market,
          tier,
          cycle,
          currencyCode: pack.formats.currency,
        };
        const collected = platformSaleTotal(pack, list);
        if ((await this.prices.current(key))?.collectedMinor === collected) continue;
        const gatewayPlanRef = await this.gateway.createPlan({
          tier,
          cycle,
          currencyCode: key.currencyCode,
          amount: collected,
        });
        const inserted = await this.prices.insert({
          ...key,
          packVersion: pack.version,
          listMinor: list,
          collectedMinor: collected,
          gatewayPlanRef,
          createdAt: now,
        });
        if (inserted) written += 1;
      }
    }
    return { written };
  }
}
