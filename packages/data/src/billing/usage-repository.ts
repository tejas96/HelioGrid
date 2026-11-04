import type {
  BillingUsage,
  BillingUsageEvents,
  BillingUsageEventsQuery,
  BillingUsageSignals,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { normalizeClientError, toApiError } from '../errors/errors';

/**
 * A company's usage this cycle (`SCR-M12-04`): `signals` answers every member — which meter is at
 * its cap or paused, no figure — and the figures and the events are the Owner's (`M12-36`).
 */
export interface BillingUsageRepository {
  /** `null` for a company that holds no subscription. */
  usage(signal?: AbortSignal): Promise<BillingUsage | null>;
  /** `null` for a company that holds no subscription. */
  signals(signal?: AbortSignal): Promise<BillingUsageSignals | null>;
  events(query: BillingUsageEventsQuery, signal?: AbortSignal): Promise<BillingUsageEvents>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createBillingUsageRepository(api: ApiClient): BillingUsageRepository {
  return {
    async usage(signal) {
      try {
        const res = await api.billingUsage.usage({ fetchOptions: { signal } });
        if (res.status === 404) return null;
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async signals(signal) {
      try {
        const res = await api.billingUsage.signals({ fetchOptions: { signal } });
        if (res.status === 404) return null;
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async events(query, signal) {
      try {
        const res = await api.billingUsage.events({ query, fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
  };
}
