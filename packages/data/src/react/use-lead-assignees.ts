'use client';
import type { Assignee } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { readOf } from './read';
import { useSession } from './use-session';

/** The people a lead can go to, as the assign picker and the inbox's faces read them. */
export interface LeadAssignees {
  /** `empty` when no one may hold a lead yet. */
  readonly read: Read<readonly Assignee[]>;
  /** The people listed — none until the read is in. */
  readonly people: readonly Assignee[];
}

/**
 * Every active member who may hold a lead, with their open and overdue counts at this moment
 * (`M02-28`), read once for the inbox's faces and the picker alike (`M02-29`) — so both show the
 * same figures. Who is listed is the server's: a deactivated member never is (`M02-28`). Any CRM write
 * refreshes it, since it sits under the CRM prefix.
 */
export function useLeadAssignees(): LeadAssignees {
  const { user } = useSession();
  const repositories = useRepositories();
  const tenantId = user?.tenant?.id ?? '';
  const query = useQuery({
    queryKey: queryKeys.crm.assignees(tenantId),
    queryFn: ({ signal }) => repositories.leadAssign.assignees(signal),
    enabled: tenantId !== '',
  });
  const read = readOf(query, (answer) => answer.items.length === 0);
  return {
    read: read.kind === 'ready' ? { kind: 'ready', value: read.value.items } : read,
    people: query.data?.items ?? [],
  };
}
