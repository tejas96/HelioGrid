import { IN_PACK } from '@heliogrid/domain';
import { PinoLogger } from 'nestjs-pino';
import { MarketPackAdminRepository } from '../../src/modules/market/market.admin.repository';
import { MarketPackReferenceRepository } from '../../src/modules/market/market.reference.repository';
import { MarketPackService } from '../../src/modules/market/market.service';
import type { openPools } from './fixture';

type Pools = ReturnType<typeof openPools>;

/**
 * The market pack published for real, for every proof that reads it — the tax formats, the
 * holiday floor, the certification schemes a claim is held to.
 */
export async function publishIndiaPack(pools: Pools): Promise<void> {
  const markets = marketsOf(pools);
  try {
    await markets.publish(IN_PACK, new Date().toISOString());
  } catch {
    // Two proofs publish at once and race for the same revision number; the loser retries and
    // finds the winner's revision already equal to the pack, so it writes nothing.
    await markets.publish(IN_PACK, new Date().toISOString());
  }
}

/** The pack service as `market.module.ts` composes it, over the real repositories on both pools. */
export function marketsOf(pools: Pools): MarketPackService {
  return new MarketPackService(
    new MarketPackReferenceRepository(pools.runtime.db),
    new MarketPackAdminRepository(pools.admin.db),
    new PinoLogger({ pinoHttp: { level: 'silent' } }),
  );
}
