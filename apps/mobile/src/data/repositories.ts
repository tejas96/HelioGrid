import { api } from './api-client';

/**
 * Repository-interface data layer (forward-compat register: mobile) — ALL data access
 * goes through these interfaces. Online-first HTTP implementations back them until
 * Track E, when the PowerSync-backed implementations swap in as a data-layer-only
 * change. Screens never see fetch, SQLite or sync machinery.
 */

export interface HealthStatus {
  status: 'ok';
  service: string;
  version: string;
}

export interface HealthRepository {
  liveness(): Promise<HealthStatus>;
}

export interface RepositoryContext {
  /** apps/api base URL; auth headers attached by the Track A auth slice. */
  apiBaseUrl: string;
}

/** Online-first implementation over THE typed client (compile-checked shapes). */
export function createHealthRepository(_ctx: RepositoryContext): HealthRepository {
  return {
    async liveness() {
      const res = await api.health.liveness.query();
      if (res.status !== 200) throw new Error(`health ${res.status}`);
      return res.body;
    },
  };
}
