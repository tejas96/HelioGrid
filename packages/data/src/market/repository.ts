import type { MarketPackRead } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { normalizeClientError, toApiError } from '../errors/errors';

/** A market's published pack (`F1-12`): platform reference data any signed-in company may read. */
export interface MarketRepository {
  /** The current version, its keys opaque: domain reads the one a screen needs. */
  currentPack(marketCode: string, signal?: AbortSignal): Promise<MarketPackRead>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createMarketRepository(api: ApiClient): MarketRepository {
  return {
    async currentPack(marketCode, signal) {
      try {
        const res = await api.marketPack.current({
          params: { marketCode },
          fetchOptions: { signal },
        });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
  };
}
