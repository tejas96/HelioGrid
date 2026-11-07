import { COMPONENT_KINDS, type ComponentKind } from '@heliogrid/domain';
import { useQueries } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';

/**
 * How many items each kind holds, hidden ones included — the kind chips' counts. One count read per
 * kind, under the catalog's prefix, so every act that refreshes the catalog refreshes these. `null`
 * until every kind has answered: a chip never shows a count that is still out.
 */
export function useCatalogKindCounts(
  tenantId: string,
  enabled: boolean,
): Readonly<Record<ComponentKind, number>> | null {
  const repositories = useRepositories();
  const reads = useQueries({
    queries: COMPONENT_KINDS.map((kind) => ({
      queryKey: queryKeys.catalog.kindCount(tenantId, kind),
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        (
          await repositories.catalog.items(
            { page: 1, limit: 1, includeHidden: 'true', kind },
            signal,
          )
        ).totalCount,
      enabled,
    })),
  });
  if (reads.some((read) => read.data === undefined)) return null;
  return Object.fromEntries(
    COMPONENT_KINDS.map((kind, i) => [kind, reads[i]?.data ?? 0]),
  ) as Record<ComponentKind, number>;
}
