'use client';
import type { TrancheSchedulePreview } from '@heliogrid/contracts';
import type { TrancheLineRead } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { readOf } from './read';

/** No read waits for a connection: held back offline, it would spin with no end. */
const ASKED_ONCE = { staleTime: Number.POSITIVE_INFINITY, networkMode: 'always' } as const;

/** Lines and the api's schedule for exactly those lines; `schedule` is `null` until it answers. */
export interface PricedLines<Source extends string> {
  readonly source: Source;
  readonly lines: readonly TrancheLineRead[];
  readonly schedule: TrancheSchedulePreview | null;
}

/**
 * The api's schedule for the lines asked. Keyed by the shares, so an older answer is never drawn
 * over a newer one. An amount never stands beside lines it was not priced for (`F4-04`): a failed
 * read shows the last lines priced in the same editor, with their own amounts, until the next
 * whole edit asks again under a new key. `editor` is the open editor's identity — another
 * template's schedule is never kept.
 */
export function useTrancheSchedule<Source extends string>(
  tenantId: string,
  editor: object | null,
  asked: { readonly source: Source; readonly lines: readonly TrancheLineRead[] } | null,
): PricedLines<Source> | null {
  const repositories = useRepositories();
  const shares = (asked?.lines ?? []).map((line) => line.percent);
  const query = useQuery({
    queryKey: queryKeys.settings.trancheSchedule(tenantId, shares),
    queryFn: ({ signal }) =>
      repositories.settings.previewTrancheSchedule(
        { lines: shares.map((percent) => ({ percent })) },
        signal,
      ),
    enabled: asked !== null,
    ...ASKED_ONCE,
  });
  const lastPriced = useRef<{ editor: object; priced: PricedLines<Source> } | null>(null);
  if (asked === null || editor === null) return null;
  const read = readOf(query);
  if (read.kind === 'ready') {
    const priced = { ...asked, schedule: read.value };
    lastPriced.current = { editor, priced };
    return priced;
  }
  const kept = lastPriced.current;
  if (read.kind === 'failed' && kept !== null && kept.editor === editor) return kept.priced;
  return { ...asked, schedule: null };
}
