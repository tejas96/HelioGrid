import type { AuditLogEntry, Paginated, PaginationQuery } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { normalizeClientError, toApiError } from '../errors/errors';

/** The tenant's own append-only record, read back and exported by its administrator (`F2-23`). */
export interface AuditRepository {
  entries(query: PaginationQuery, signal?: AbortSignal): Promise<Paginated<AuditLogEntry>>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createAuditRepository(api: ApiClient): AuditRepository {
  return {
    async entries(query, signal) {
      try {
        const res = await api.audit.entries({ query, fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
  };
}
