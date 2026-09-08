import { marketPackContract } from '@heliogrid/contracts';
import { Controller, Inject, NotFoundException } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { MarketPackService } from './market.service';

/**
 * `GET /market-packs/{marketCode}`. The code is a path segment, never tenant identity: the pack
 * is platform reference data, and `NOT_FOUND` for an unknown code reveals nothing about a
 * tenant. Public today like every route (`M15`); the pack carries no tenant fact to protect.
 */
@Controller()
export class MarketPackController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(MarketPackService) private readonly packs: MarketPackService) {}

  @TsRestHandler(marketPackContract)
  handler() {
    return tsRestHandler(marketPackContract, {
      current: async ({ params }) => {
        const body = await this.packs.current(params.marketCode);
        if (body === null) {
          throw new NotFoundException('No market pack is published under that code.');
        }
        return { status: 200, body };
      },
    });
  }
}
