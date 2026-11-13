import type { OwnerDashboard, SetTarget } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { bodyAt } from '../errors/errors';

/**
 * The owner dashboard (`SCR-M13-01`): one read scoped by role, and the company target set inline
 * (`M13-17`). A target for a month that is not the current one is refused
 * `TARGET_MONTH_NOT_CURRENT` (422).
 */
export interface DashboardsRepository {
  owner(signal?: AbortSignal): Promise<OwnerDashboard>;
  setTarget(body: SetTarget): Promise<OwnerDashboard['target']>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createDashboardsRepository(api: ApiClient): DashboardsRepository {
  return {
    owner: (signal) => bodyAt(() => api.dashboards.owner({ fetchOptions: { signal } }), 200),
    setTarget: async (body) => (await bodyAt(() => api.dashboards.setTarget({ body }), 200)).target,
  };
}
