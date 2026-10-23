import { queryKeys } from '../cache/keys';
import type { Repositories } from '../data-layer';

/**
 * The person's company and their own membership in it, read once and shared: the shell and the
 * role card name the same keys, so the card reopened from Profile & preferences draws from what
 * the shell already holds.
 */
export function companyRead(repositories: Repositories, tenantId: string, enabled: boolean) {
  return {
    queryKey: queryKeys.shell.tenant(tenantId),
    queryFn: ({ signal }: { signal: AbortSignal }) => repositories.tenant.me(signal),
    enabled,
  };
}

export function membershipRead(repositories: Repositories, tenantId: string, enabled: boolean) {
  return {
    queryKey: queryKeys.shell.membership(tenantId),
    queryFn: ({ signal }: { signal: AbortSignal }) => repositories.tenant.myMembership(signal),
    enabled,
  };
}
