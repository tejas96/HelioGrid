'use client';
import type { TrancheSchedulePreview } from '@heliogrid/contracts';
import type { TrancheLineRead } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';

/** No read waits for a connection: held back offline, it would spin with no end. */
const ASKED_ONCE = { staleTime: Number.POSITIVE_INFINITY, networkMode: 'always' } as const;

/**
 * The api's schedule for the lines shown. Keyed by the shares, so an older answer is never drawn
 * over a newer one; a failed read keeps the last schedule shown and is asked again at the next
 * whole edit, which is a new key.
 */
export function useTrancheSchedule(
  tenantId: string,
  lines: readonly TrancheLineRead[] | null,
): TrancheSchedulePreview | null {
  const repositories = useRepositories();
  const shares = (lines ?? []).map((line) => line.percent);
  const read = useQuery({
    queryKey: queryKeys.settings.trancheSchedule(tenantId, shares),
    queryFn: ({ signal }) =>
      repositories.settings.previewTrancheSchedule(
        { lines: shares.map((percent) => ({ percent })) },
        signal,
      ),
    enabled: lines !== null,
    ...ASKED_ONCE,
  });
  const lastShown = useRef<TrancheSchedulePreview | null>(null);
  if (read.data !== undefined) lastShown.current = read.data;
  if (lines === null) return null;
  return read.data ?? (read.isError ? lastShown.current : null);
}
