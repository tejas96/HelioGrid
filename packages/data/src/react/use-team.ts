'use client';
import { MAX_PAGE_LIMIT, type Paginated } from '@heliogrid/contracts';
import {
  type TeamLoad,
  type TeamRosterView,
  type TeamStatusFilter,
  type TeamSurface,
  teamRoster,
  teamRosterView,
  teamSurface,
  type UiLanguage,
} from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { useSession } from './use-session';

/** The Team screen's read (`SCR-M01-12`), as both platforms render it (Law 11). */
export interface Team {
  /** Every read answered, one is still out, or one got no answer (the screen shows the error state). */
  readonly load: TeamLoad;
  readonly view: TeamRosterView;
  /** Which body the list shows — `teamSurface`'s answer. */
  readonly surface: TeamSurface;
  readonly query: string;
  readonly status: TeamStatusFilter;
  find(query: string): void;
  filter(status: TeamStatusFilter): void;
  /** Asks again for every read: a list missing half its people is not shown. */
  retry(): void;
}

/** Every page of a list, read at the largest page the api serves — a team fits in a few. */
async function everyPage<T>(read: (page: number) => Promise<Paginated<T>>): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const answer = await read(page);
    items.push(...answer.items);
    if (answer.items.length === 0 || page * MAX_PAGE_LIMIT >= answer.totalCount) return items;
  }
}

/**
 * The roster and both open-and-run-out invite lists, joined by domain's `teamRoster` and narrowed by
 * `teamRosterView`. Mounted only under a session that acts for a company.
 */
export function useTeam(language: UiLanguage): Team {
  const { user } = useSession();
  const repositories = useRepositories();
  const tenantId = user?.tenant?.id ?? '';
  const viewerUserId = user?.id ?? '';
  const [query, find] = useState('');
  const [status, filter] = useState<TeamStatusFilter>('all');

  const reading = tenantId !== '';
  const members = useQuery({
    queryKey: queryKeys.team.members(tenantId),
    queryFn: ({ signal }) =>
      everyPage((page) => repositories.tenant.members({ page, limit: MAX_PAGE_LIMIT }, signal)),
    enabled: reading,
  });
  const invites = (standing: 'pending' | 'expired') => ({
    queryKey: queryKeys.team.invites(tenantId, standing),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      everyPage((page) =>
        repositories.invitation.list({ page, limit: MAX_PAGE_LIMIT, status: standing }, signal),
      ),
    enabled: reading,
  });
  const pending = useQuery(invites('pending'));
  const expired = useQuery(invites('expired'));

  const reads = [members, pending, expired];
  const load: TeamLoad = reads.some((read) => read.isError)
    ? 'failed'
    : reads.every((read) => read.isSuccess)
      ? 'ready'
      : 'loading';
  const rows = useMemo(
    () =>
      teamRoster(
        members.data ?? [],
        [...(pending.data ?? []), ...(expired.data ?? [])],
        viewerUserId,
        Date.now(),
        language,
      ),
    [members.data, pending.data, expired.data, viewerUserId, language],
  );
  const view = useMemo(() => teamRosterView(rows, query, status), [rows, query, status]);

  return {
    load,
    view,
    surface: teamSurface(load, view, query, status),
    query,
    status,
    find,
    filter,
    retry: () => {
      for (const read of reads) void read.refetch();
    },
  };
}
