'use client';
import type { TenantOwners } from '@heliogrid/contracts';
import { type RoleCard, type RoleCardNames, roleCard } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { queryKeys } from '../cache/keys';
import { ApiError } from '../errors/errors';
import { useRepositories } from './context';
import { companyRead, membershipRead } from './shell-reads';
import { useSession } from './use-session';

/**
 * The role card's facts on both platforms (Law 11): the card domain decides from the session's
 * roles, the company and who set the roles from the shell's own reads, and the owners for the note.
 * The rows wait for the owners read; any read failing is the card's error.
 */
export interface RoleCardRead {
  readonly card: RoleCard;
  readonly facts: RoleCardNames;
  readonly surface: 'loading' | 'error' | 'ready';
  /**
   * The card is opened again: who set the roles and who the owners are may have changed, and a
   * read that failed is asked again.
   */
  refresh(): void;
  /** *Try again* on the error card: the same reads. */
  retry(): void;
}

/** An api older than the owners route answers 404: the card then shows no note. */
const NO_OWNERS: TenantOwners = { owners: [], more: 0 };

export function useRoleCard(): RoleCardRead {
  const { user, ended } = useSession();
  const repositories = useRepositories();
  const tenantId = user?.tenant?.id ?? '';
  const roles = user?.tenant?.roles;
  const card = useMemo(() => roleCard(roles ?? []), [roles]);
  /* As the shell does: once access is removed, every read would be refused. */
  const reading = tenantId !== '' && ended === null;

  const company = useQuery(companyRead(repositories, tenantId, reading));
  const membership = useQuery(membershipRead(repositories, tenantId, reading));
  const owners = useQuery({
    queryKey: queryKeys.team.owners(tenantId),
    queryFn: async ({ signal }) => {
      try {
        return await repositories.tenant.owners(signal);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return NO_OWNERS;
        throw error;
      }
    },
    enabled: reading && card.ownerNote,
  });

  const { refetch: refetchCompany } = company;
  const { refetch: refetchMembership } = membership;
  const { refetch: refetchOwners } = owners;
  const { ownerNote } = card;
  const companyFailed = company.isError;
  const refresh = useCallback(() => {
    if (companyFailed) void refetchCompany();
    void refetchMembership();
    if (ownerNote) void refetchOwners();
  }, [companyFailed, refetchCompany, refetchMembership, refetchOwners, ownerNote]);

  const failed = companyFailed || membership.isError || (ownerNote && owners.isError);
  const ownersData = owners.data;
  return useMemo(
    () => ({
      card,
      facts: {
        companyName: company.data?.companyName ?? null,
        setterName: membership.data?.rolesSetBy?.name ?? null,
        owners: ownersData
          ? { names: ownersData.owners.map((owner) => owner.name), more: ownersData.more }
          : null,
      },
      surface: failed ? 'error' : ownerNote && ownersData === undefined ? 'loading' : 'ready',
      refresh,
      retry: refresh,
    }),
    [card, company.data, membership.data, ownersData, failed, ownerNote, refresh],
  );
}
