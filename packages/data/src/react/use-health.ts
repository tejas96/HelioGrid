'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';

/**
 * React Query lives ONLY in this directory. Replacing it touches these files and no
 * repository, no screen — the adapter boundary the `data-core-is-framework-free` gate holds.
 */
export function useLiveness() {
  const { health } = useRepositories();
  return useQuery({ queryKey: queryKeys.health.liveness, queryFn: () => health.liveness() });
}
