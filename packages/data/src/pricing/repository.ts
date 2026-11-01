import type { PublicPricingRead } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { normalizeClientError, toApiError } from '../errors/errors';

/** A market's public price list (`SCR-M12-01`): read before any account exists. */
export interface PricingRepository {
  /** `null` when the market publishes no prices — the page's empty state, never a failure. */
  current(marketCode: string, signal?: AbortSignal): Promise<PublicPricingRead | null>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createPricingRepository(api: ApiClient): PricingRepository {
  return {
    async current(marketCode, signal) {
      try {
        const res = await api.pricing.current({ params: { marketCode }, fetchOptions: { signal } });
        if (res.status === 404) return null;
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
  };
}
