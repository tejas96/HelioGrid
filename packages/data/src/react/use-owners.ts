'use client';
import type { TenantOwners } from '@heliogrid/contracts';
import { queryKeys } from '../cache/keys';
import type { Repositories } from '../data-layer';
import { ApiError } from '../errors/errors';

/** An api older than the owners route answers 404: the reader then names no one. */
const NO_OWNERS: TenantOwners = { owners: [], more: 0 };

/**
 * The company's owners by name, one read for every screen that names them — the role card's note
 * and Catalog settings' view-only line share the key, so a role change refreshes both.
 */
export function ownersRead(repositories: Repositories, tenantId: string, enabled: boolean) {
  return {
    queryKey: queryKeys.team.owners(tenantId),
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      try {
        return await repositories.tenant.owners(signal);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return NO_OWNERS;
        throw error;
      }
    },
    enabled,
  };
}
