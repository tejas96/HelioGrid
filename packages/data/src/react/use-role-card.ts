'use client';
import { mapRead, type Read, type RoleCard, type RoleCardNames, roleCard } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useDataLayer, useRepositories } from './context';
import { readOf } from './read';
import { companyRead, membershipRead } from './shell-reads';
import { ownersRead } from './use-owners';
import { useSession } from './use-session';

/**
 * The role card's facts on both platforms (Law 11): the card domain decides from the session's
 * roles, the company and who set the roles from the shell's own reads, and the owners for the note.
 * At first run the join's carry names the company and the inviter — who set the roles at the join —
 * until those reads land, so the heading and the credit line draw at once. The rows wait for the
 * owners read; any read failing is the card's error, and its *Try again* is `refresh`.
 */
export interface RoleCardRead {
  readonly card: RoleCard;
  readonly facts: RoleCardNames;
  /** The card's state: loading while the owners read is out; any read failing fails it. */
  readonly read: Read<RoleCardNames>;
  /**
   * The company or the setter is still being read and no carry names them: the first-run heading
   * and credit line wait undrawn rather than show a title that changes (`SCR-M01-10`).
   * The reopened card needs none of it: its sheet is titled by the role alone.
   */
  readonly namesPending: boolean;
  /**
   * The card is opened again: who set the roles and who the owners are may have changed, and a
   * read that failed is asked again.
   */
  refresh(): void;
}

export function useRoleCard(): RoleCardRead {
  const { user, ended } = useSession();
  const repositories = useRepositories();
  const carry = useDataLayer().session.firstRunCarry();
  const tenantId = user?.tenant?.id ?? '';
  const roles = user?.tenant?.roles;
  const card = useMemo(() => roleCard(roles ?? []), [roles]);
  /* As the shell does: once access is removed, every read would be refused. */
  const reading = tenantId !== '' && ended === null;

  const company = useQuery(companyRead(repositories, tenantId, reading));
  const membership = useQuery(membershipRead(repositories, tenantId, reading));
  const owners = useQuery(ownersRead(repositories, tenantId, reading && card.ownerNote));
  const companyAnswer = readOf(company);
  const membershipAnswer = readOf(membership);
  const ownersAnswer = readOf(owners);

  const { refetch: refetchCompany } = company;
  const { refetch: refetchMembership } = membership;
  const { refetch: refetchOwners } = owners;
  const { ownerNote } = card;
  const companyFailed = companyAnswer.kind === 'failed';
  const refresh = useCallback(() => {
    if (companyFailed) void refetchCompany();
    void refetchMembership();
    if (ownerNote) void refetchOwners();
  }, [companyFailed, refetchCompany, refetchMembership, refetchOwners, ownerNote]);

  const ownersData = owners.data;
  const facts: RoleCardNames = {
    companyName: company.data?.companyName ?? carry?.companyName ?? null,
    setterName: membership.data?.rolesSetBy?.name ?? carry?.inviterName ?? null,
    owners: ownersData
      ? { names: ownersData.owners.map((owner) => owner.name), more: ownersData.more }
      : null,
  };
  /* The heading draws from the carry while the company and the setter are read: only the owners hold the rows. */
  const [failure] = [companyAnswer, membershipAnswer, ...(ownerNote ? [ownersAnswer] : [])].flatMap(
    (answer) => (answer.kind === 'failed' ? [answer.failure] : []),
  );
  const rows: Read<RoleCardNames> = ownerNote
    ? mapRead(ownersAnswer, () => facts)
    : { kind: 'ready', value: facts };
  const read: Read<RoleCardNames> =
    failure === undefined ? rows : { kind: 'failed', failure, retry: refresh };
  return {
    card,
    facts,
    read,
    namesPending:
      reading && carry === null && !(answered(companyAnswer) && answered(membershipAnswer)),
    refresh,
  };
}

/** The read has its answer, a value or a failure: nothing more is coming for it. */
function answered(read: Read<unknown>): boolean {
  return read.kind === 'ready' || read.kind === 'failed';
}
