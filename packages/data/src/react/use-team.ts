'use client';
import { type Invitation, MAX_PAGE_LIMIT, type Member, type Paginated } from '@heliogrid/contracts';
import {
  type RolePreset,
  type TeamLoad,
  type TeamRosterView,
  type TeamRow,
  type TeamStatusFilter,
  type TeamSurface,
  teamRoster,
  teamRosterView,
  teamSurface,
  type UiLanguage,
} from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  /** The whole list, before any search or Status chip — what a row's act is judged against. */
  readonly roster: readonly TeamRow[];
  /**
   * Reads every list again and answers with the whole list as it now stands — null when a read got
   * no answer, so a caller never judges a write against the list it had before (`F8-36`).
   */
  reread(): Promise<readonly TeamRow[] | null>;
  /**
   * A write the server answered 200: the person's row holds `roles` at once, so the list is right
   * while its re-read is out. A re-read that gets no answer still shows the list's load failure
   * (`F8-36`): a list that could not be read is never drawn as if it were.
   */
  holds(membershipId: string, roles: readonly RolePreset[]): void;
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
 * The roster and every invitation, joined by domain's `teamRoster` and narrowed by
 * `teamRosterView`. Mounted only under a session that acts for a company.
 */
export function useTeam(language: UiLanguage): Team {
  const { user } = useSession();
  const repositories = useRepositories();
  const queryClient = useQueryClient();
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
  const invites = useQuery({
    queryKey: queryKeys.team.invites(tenantId),
    queryFn: ({ signal }) =>
      everyPage((page) => repositories.invitation.list({ page, limit: MAX_PAGE_LIMIT }, signal)),
    enabled: reading,
  });

  const reads = [members, invites];
  const load: TeamLoad = reads.some((read) => read.isError)
    ? 'failed'
    : reads.every((read) => read.isSuccess)
      ? 'ready'
      : 'loading';
  const rosterOf = (held: readonly Member[] | undefined, sent: readonly Invitation[] | undefined) =>
    teamRoster(held ?? [], sent ?? [], viewerUserId, Date.now(), language);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `rosterOf` reads only these inputs.
  const roster = useMemo(
    () => rosterOf(members.data, invites.data),
    [members.data, invites.data, viewerUserId, language],
  );
  const reread = async () => {
    const [held, sent] = await Promise.all([members.refetch(), invites.refetch()]);
    return held.isError || sent.isError ? null : rosterOf(held.data, sent.data);
  };
  const holds = (membershipId: string, roles: readonly RolePreset[]) => {
    const key = queryKeys.team.members(tenantId);
    /* A read already out began before the write; landing after it, it would draw the old set. */
    void queryClient.cancelQueries({ queryKey: key });
    queryClient.setQueryData<Member[]>(key, (held) =>
      held?.map((member) =>
        member.membershipId === membershipId ? { ...member, roles: [...roles] } : member,
      ),
    );
  };
  const view = useMemo(() => teamRosterView(roster, query, status), [roster, query, status]);

  return {
    load,
    view,
    surface: teamSurface(load, view, query, status),
    query,
    status,
    find,
    filter,
    roster,
    reread,
    holds,
    retry: () => void reread(),
  };
}
