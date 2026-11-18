'use client';
import type { DesignDetail } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { ApiError } from '../errors/errors';
import { useRepositories } from './context';
import { recordReadOf } from './read';
import { useTenantId } from './use-tenant-id';

/** The design read — never empty — or `unavailable` when it answered 404. */
export type DesignRead =
  | Exclude<Read<DesignDetail>, { readonly kind: 'empty' }>
  | { readonly kind: 'unavailable' };

export interface DesignScreen {
  readonly read: DesignRead;
}

/**
 * One design's own page (`SCR-M05-02`), the web's and the phone's alike: the design, the site it
 * is for and who it is for. The studio's steps are read here as each is built.
 */
export function useDesignScreen(designId: string): DesignScreen {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const query = useQuery({
    queryKey: queryKeys.studio.design(tenantId, designId),
    queryFn: ({ signal }) => repositories.studio.design(designId, signal),
    enabled: tenantId !== '',
  });
  /* A 404 wins over a design already shown: a lead moved away leaves nothing this reader may see. */
  const gone = query.error instanceof ApiError && query.error.status === 404;
  return { read: gone ? { kind: 'unavailable' } : recordReadOf(query) };
}
