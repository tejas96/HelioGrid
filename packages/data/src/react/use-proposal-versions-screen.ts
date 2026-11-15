'use client';
import type { ProposalVersion, ProposalVersionSummary } from '@heliogrid/contracts';
import { allReads, type Read } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import type { ProposalActFailure } from './proposal-cache';
import { type ProposalRead, useProposal } from './use-proposal';
import { useVersionInForce, type VersionInForce } from './use-proposal-hand-off';
import { useProposalVersions } from './use-proposal-versions';
import { useTenantId } from './use-tenant-id';

/** Where the versions screen leads: one version's document, and the track screen's share. */
export interface ProposalVersionsMoves {
  toDocument(proposalId: string, version: number): void;
  toShare(proposalId: string): void;
}

/** Every version newest first, and the newest one with what moved in it. */
export interface ProposalVersionsRead {
  readonly versions: readonly ProposalVersionSummary[];
  readonly latest: ProposalVersion | null;
}

export interface ProposalVersionsScreen {
  /** The proposal itself: its number and customer name head the page. */
  readonly proposal: ProposalRead;
  readonly read: Exclude<Read<ProposalVersionsRead>, { readonly kind: 'empty' }>;
  /** The deal is won: a newer version is put in force by a person, never answered on the link. */
  readonly won: boolean;
  readonly mayShare: boolean;
  readonly mayPutInForce: boolean;
  share(version: number): void;
  view(version: number): void;
  /** *Put version N in force*: the version asked about, its preview and the act. */
  readonly inForce: {
    readonly version: number | null;
    open(version: number): void;
    close(): void;
    readonly preview: VersionInForce['preview'];
    readonly sending: boolean;
    readonly failure: ProposalActFailure | null;
    confirm(): void;
    /** The version now in force, once the act landed — the screen says so. */
    readonly done: number | null;
    dismissDone(): void;
  };
}

/**
 * A proposal's versions (`SCR-M06-16`, `M06-42`): the change note first, what moved, then every
 * version; after Won, a newer accepted version is put in force by a person (`M08-50`, `M11-14`).
 */
export function useProposalVersionsScreen(
  proposalId: string,
  moves: ProposalVersionsMoves,
): ProposalVersionsScreen {
  const proposal = useProposal(proposalId);
  const detail = proposal.kind === 'ready' ? proposal.value : null;
  const newest = detail?.versions[0]?.version ?? null;
  const versions = useProposalVersions(proposalId, newest);
  const projectId = detail?.project?.id ?? '';
  const mayPutInForce = useMayPutInForce(projectId);
  const [asked, setAsked] = useState<number | null>(null);
  const force = useVersionInForce(projectId, asked);
  const won = detail !== null && detail.project !== null;
  return {
    proposal,
    read: readOf(versions.list, versions.version),
    won,
    mayShare: detail?.rights.share === true && !won,
    mayPutInForce: won && mayPutInForce,
    share: () => moves.toShare(proposalId),
    view: (version) => moves.toDocument(proposalId, version),
    inForce: {
      // Once the version is in force its sheet has done its work: the toast says so alone.
      version: force.inForce === null ? asked : null,
      open: (version) => {
        force.clear();
        setAsked(version);
      },
      close: () => {
        if (force.putting) return;
        setAsked(null);
      },
      preview: force.preview,
      sending: force.putting,
      failure: force.failure,
      confirm: force.put,
      done: force.inForce,
      dismissDone: () => {
        force.clear();
        setAsked(null);
      },
    },
  };
}

type ListRead = Read<readonly ProposalVersionSummary[]>;
type VersionRead = Exclude<Read<ProposalVersion>, { readonly kind: 'empty' }> | null;

/** The two reads as one: the list, with the newest version once it is in. */
function readOf(list: ListRead, version: VersionRead): ProposalVersionsScreen['read'] {
  const versions: ListRead = list.kind === 'empty' ? { kind: 'ready', value: [] } : list;
  const newest: Read<ProposalVersion | null> = version ?? { kind: 'ready', value: null };
  const both = allReads([versions, newest]);
  /* Neither read is ever empty here: the list's none is the empty array above. */
  if (both.kind === 'empty') return { kind: 'ready', value: { versions: [], latest: null } };
  if (both.kind !== 'ready') return both;
  const [all, latest] = both.value;
  return { kind: 'ready', value: { versions: all, latest } };
}

/** Whether the reader may put a version in force on this project: the project's own read says. */
function useMayPutInForce(projectId: string): boolean {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const project = useQuery({
    queryKey: queryKeys.projects.detail(tenantId, projectId),
    queryFn: ({ signal }) => repositories.projects.detail(projectId, signal),
    enabled: tenantId !== '' && projectId !== '',
  });
  return project.data?.acts.versionInForce === true;
}
