'use client';
import { type Assignee, MAX_PAGE_LIMIT } from '@heliogrid/contracts';
import { mapRead, type Read, type TeamConfirmState } from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { readOf } from './read';
import { useLeadAssignees } from './use-lead-assignees';
import { useSession } from './use-session';
import { membersRead } from './use-team';

/** The open leads a person holds: their ids, every page of them. */
interface OpenLeads {
  readonly ids: readonly string[];
}

/** A deactivation's open leads, and who takes them (`SCR-M01-12`), as the confirm draws them. */
export interface DeactivateReassign {
  /** How many open leads the person going holds — `empty` for none; `null` while no deactivation asks. */
  readonly open: Read<number> | null;
  /** Who takes them; `null` until chosen. */
  readonly to: Assignee | null;
  /** The picker is open: the confirm steps aside for it, and comes back once someone is picked. */
  readonly picking: boolean;
  /** Everyone the picker lists but the person going. */
  readonly people: readonly Assignee[];
  readonly peopleRead: ReturnType<typeof useLeadAssignees>['read'];
  choose(): void;
  pick(userId: string): void;
  closePicker(): void;
  /**
   * Gives every open lead to the chosen person, a hundred at a time, each assignment carrying
   * `reason` (`M02-30`); nothing when no one is chosen. A failure throws, so the deactivation that
   * waits on it is not sent.
   */
  move(): Promise<void>;
}

/** The bulk assign takes at most this many leads at once (`bulkAssignSchema`). */
const BULK_LIMIT = MAX_PAGE_LIMIT;

/**
 * SCR-M01-12's deactivate confirm gains the person's open work (`SCR-M01-12`): their open leads, read
 * through `leads.list` with their id, and the one picker that moves them all in bulk with the
 * deactivation's reason before the person goes.
 */
export function useDeactivateReassign(
  confirm: TeamConfirmState,
  reason: string,
): DeactivateReassign {
  const { user } = useSession();
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = user?.tenant?.id ?? '';
  const members = useQuery(membersRead(repositories, tenantId, tenantId !== ''));
  const team = useLeadAssignees();
  const [to, setTo] = useState<Assignee | null>(null);
  const [picking, setPicking] = useState(false);
  const going =
    confirm.kind === 'asking' && confirm.act === 'deactivate'
      ? (members.data?.find((member) => member.membershipId === confirm.row.id)?.userId ?? null)
      : null;
  const ask = { ownerId: going, state: 'active' } as const;
  const leads = useQuery({
    queryKey: queryKeys.crm.leads(tenantId, ask),
    queryFn: () => openLeadsOf(repositories, going ?? ''),
    enabled: going !== null,
  });
  /* A different person asks afresh: the last one's choice never carries over. */
  const [chosenFor, setChosenFor] = useState<string | null>(null);
  const chosen = chosenFor === going ? to : null;

  return {
    open:
      going === null
        ? null
        : mapRead(
            readOf(leads, (held) => held.ids.length === 0),
            (held) => held.ids.length,
          ),
    to: chosen,
    picking: picking && going !== null,
    people: team.people.filter((person) => person.userId !== going),
    peopleRead: team.read,
    choose: () => setPicking(true),
    pick: (userId) => {
      const person = team.people.find((one) => one.userId === userId);
      if (person === undefined) return;
      setTo(person);
      setChosenFor(going);
      setPicking(false);
    },
    closePicker: () => setPicking(false),
    move: async () => {
      const ids = leads.data?.ids ?? [];
      if (chosen === null || ids.length === 0) return;
      for (let at = 0; at < ids.length; at += BULK_LIMIT) {
        await repositories.leadAssign.bulkAssign({
          leadIds: [...ids.slice(at, at + BULK_LIMIT)],
          assigneeId: chosen.userId,
          reason,
        });
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.crm.all(tenantId) });
    },
  };
}

/** Every open lead the person owns, read a page at a time at the largest page the api serves. */
async function openLeadsOf(
  repositories: ReturnType<typeof useRepositories>,
  ownerId: string,
): Promise<OpenLeads> {
  const ids: string[] = [];
  for (let page = 1; ; page += 1) {
    const answer = await repositories.leads.list({
      ownerId,
      state: 'active',
      limit: MAX_PAGE_LIMIT,
      page,
    });
    ids.push(...answer.items.map((lead) => lead.id));
    if (answer.items.length === 0 || page * MAX_PAGE_LIMIT >= answer.totalCount) return { ids };
  }
}
