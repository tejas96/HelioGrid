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

/** Online-first implementation — replaced per-module by ts-rest clients as slices land. */
export function createHealthRepository(ctx: RepositoryContext): HealthRepository {
  return {
    async liveness() {
      const res = await fetch(`${ctx.apiBaseUrl}/health`);
      if (!res.ok) throw new Error(`health ${res.status}`);
      return (await res.json()) as HealthStatus;
    },
  };
}
