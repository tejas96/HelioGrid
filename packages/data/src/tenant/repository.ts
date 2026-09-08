import type {
  CreateTenant,
  Member,
  Paginated,
  PaginationQuery,
  SessionProjection,
  Tenant,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { normalizeClientError, toApiError } from '../errors/errors';

export interface SimilarTenant {
  tenantId: string;
  companyName: string;
  city: string;
}

/** Company signup and the tenant reads (`M01-01`, `M01-09`, `M01-19`). */
export interface TenantRepository {
  create(input: CreateTenant): Promise<SessionProjection>;
  me(signal?: AbortSignal): Promise<Tenant>;
  members(query: PaginationQuery, signal?: AbortSignal): Promise<Paginated<Member>>;
  similar(companyName: string, city: string, signal?: AbortSignal): Promise<SimilarTenant[]>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createTenantRepository(api: ApiClient): TenantRepository {
  return {
    async create(input) {
      try {
        const res = await api.tenant.create({ body: input });
        if (res.status !== 201) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async me(signal) {
      try {
        const res = await api.tenant.me({ fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async members(query, signal) {
      try {
        const res = await api.tenant.members({ query, fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async similar(companyName, city, signal) {
      try {
        const res = await api.tenant.similar({
          query: { companyName, city },
          fetchOptions: { signal },
        });
        if (res.status !== 200) throw toApiError(res);
        return res.body.items;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
  };
}
