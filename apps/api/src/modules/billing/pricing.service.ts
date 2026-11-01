import type { PublicPricingRead } from '@heliogrid/contracts';
import {
  type MinorUnits,
  type PublicPrice,
  type PublicRate,
  publicPricing,
} from '@heliogrid/domain';
import { minorUnitsToDecimal } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { MarketPackService } from '../market/market.public';

/**
 * The public price list (`SCR-M12-01`): domain's `publicPricing` of the market's current pack,
 * with money as decimal strings in the market's minor unit. `null` when no pack is published or
 * its book sells no plan — the page's "no prices for this market yet".
 */
@Injectable()
export class PricingService {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(MarketPackService) private readonly packs: MarketPackService) {}

  async current(marketCode: string): Promise<PublicPricingRead | null> {
    const published = await this.packs.currentPublished(marketCode);
    if (published === null) return null;
    const { pack, publishedAt } = published;
    const pricing = publicPricing(pack);
    if (pricing === null) return null;
    const decimal = (amount: MinorUnits) =>
      minorUnitsToDecimal(amount, pack.formats.minorUnitDigits);
    return {
      market: pack.market,
      publishedAt,
      currencyCode: pack.formats.currency,
      plans: pricing.plans.map((plan) => ({
        ...plan,
        price: priceWire(plan.price, decimal),
        voiceMinuteRate: rateWire(plan.voiceMinuteRate, decimal),
      })),
      trial: pricing.trial,
      comparisons: pricing.comparisons.map((row) => ({
        ...row,
        ours: decimal(row.ours),
        theirs: decimal(row.theirs),
      })),
      benchmarkSources: [...pricing.benchmarkSources],
      taxScheme: pricing.taxScheme,
      taxExcluded: pricing.taxExcluded,
      salesContact: pricing.salesContact,
    };
  }
}

type Decimal = (amount: MinorUnits) => string;

function priceWire(
  price: PublicPrice,
  decimal: Decimal,
): PublicPricingRead['plans'][number]['price'] {
  if (price.kind === 'anchored')
    return { kind: 'anchored', from: decimal(price.from), per: price.per };
  return {
    kind: 'listed',
    perCycle: { monthly: decimal(price.perCycle.monthly), yearly: decimal(price.perCycle.yearly) },
  };
}

function rateWire(
  rate: PublicRate,
  decimal: Decimal,
): PublicPricingRead['plans'][number]['voiceMinuteRate'] {
  return rate.kind === 'published' ? { kind: 'published', rate: decimal(rate.rate) } : rate;
}
