'use client';
import type { Assignee, LeadDetail, MemberRef } from '@heliogrid/contracts';
import { type LeadActFailure, mapRead, type Read } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useAction } from './action';
import { useRepositories } from './context';
import { leadActFailureOf, useLeadDetailCache } from './lead-detail-cache';
import { readOf } from './read';
import { useSession } from './use-session';
import { useTenantId } from './use-tenant-id';

/** How the last assign came back undone: someone assigned it first (`M02-67`), or it failed. */
export type LeadAssignReturn =
  | { readonly kind: 'already_assigned'; readonly userId: string; readonly owner: MemberRef | null }
  | { readonly kind: 'failed'; readonly userId: string; readonly failure: LeadActFailure };

/**
 * The owner chip's picker (`M02-29`): the same people, with the same open and overdue counts, as
 * the inbox's — one tap assigns, compare-and-set on the owner this screen showed.
 */
export interface LeadAssign {
  readonly open: boolean;
  show(): void;
  /** Refused while an assign is out. */
  hide(): void;
  readonly people: Read<readonly Assignee[]>;
  /** The reader, when they are one of the people a lead can go to. */
  readonly readerId: string | null;
  pick(userId: string): void;
  /** The person an assign is out to. */
  readonly pendingUserId: string | null;
  readonly returned: LeadAssignReturn | null;
}

export function useLeadAssign(leadId: string, lead: LeadDetail | null): LeadAssign {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const { user } = useSession();
  const cache = useLeadDetailCache(leadId);
  const [open, setOpen] = useState(false);
  const [returned, setReturned] = useState<LeadAssignReturn | null>(null);
  const [asked, setAsked] = useState<string | null>(null);
  const peopleQuery = useQuery({
    queryKey: queryKeys.crm.assignees(tenantId),
    queryFn: ({ signal }) => repositories.leadAssign.assignees(signal),
    enabled: open && tenantId !== '',
  });
  const people = mapRead(
    readOf(peopleQuery, (answer) => answer.items.length === 0),
    (answer) => answer.items,
  );
  const assign = useAction(
    (userId: string) =>
      repositories.leadAssign.assign(leadId, {
        assigneeId: userId,
        expectedOwnerId: lead?.lead.owner?.userId ?? null,
      }),
    {
      onDone: (outcome, userId) => {
        if (outcome.kind === 'assigned') {
          cache.landed(outcome.lead);
          setOpen(false);
          return;
        }
        setReturned({ kind: 'already_assigned', userId, owner: outcome.owner });
        cache.refresh();
      },
      onFailed: (error, userId) =>
        setReturned({ kind: 'failed', userId, failure: leadActFailureOf(error) }),
    },
  );
  const readerId = user?.id ?? null;
  return {
    open,
    show: () => {
      setReturned(null);
      setOpen(true);
    },
    hide: () => {
      if (!assign.isOut()) setOpen(false);
    },
    people,
    readerId:
      people.kind === 'ready' && people.value.some((person) => person.userId === readerId)
        ? readerId
        : null,
    pick: (userId) => {
      if (assign.isOut()) return;
      setReturned(null);
      setAsked(userId);
      void assign.run(userId);
    },
    pendingUserId: assign.pending ? asked : null,
    returned,
  };
}
