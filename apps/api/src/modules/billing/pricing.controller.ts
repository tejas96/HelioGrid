import { pricingContract } from '@heliogrid/contracts';
import { Controller, Inject, NotFoundException } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { RouteAccessMap } from '../../common/auth/access';
import { PricingService } from './pricing.service';

/**
 * `GET /pricing/{marketCode}` — PUBLIC on purpose: a prospect reads it before any account exists,
 * and it carries only what the public page prints, never a worst-case cost or a draft figure.
 * A read, so it names no billing-matrix row.
 */
@Controller()
export class PricingController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(PricingService) private readonly pricing: PricingService) {}

  @TsRestHandler(pricingContract)
  @RouteAccessMap(pricingContract, { current: 'public' })
  handler() {
    return tsRestHandler(pricingContract, {
      current: async ({ params }) => {
        const body = await this.pricing.current(params.marketCode);
        if (body === null) throw new NotFoundException('No prices are published for that market.');
        return { status: 200, body };
      },
    });
  }
}
