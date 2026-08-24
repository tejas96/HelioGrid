import type { Liveness } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { toApiError } from '../errors/errors';

/**
 * ALL data access goes through a repository interface (forward-compat register, `mobile`
 * row). A different data source can be swapped in behind this same interface — a
 * data-layer change only. No React, no React Query, no ts-rest type escapes here.
 */
export interface HealthRepository {
  liveness(): Promise<Liveness>;
}

/** The type is INFERRED from the contract, never a hand-written copy of the response. */
export function createHealthRepository(api: ApiClient): HealthRepository {
  return {
    async liveness() {
      const res = await api.health.liveness();
      if (res.status !== 200) throw toApiError(res);
      return res.body;
    },
  };
}
