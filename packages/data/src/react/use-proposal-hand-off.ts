'use client';
import type {
  ComposedMessage,
  ProjectDetail,
  ProposalDocument,
  VersionInForcePreview,
  WonBasisWire,
} from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { ProjectActRefusedError } from '../projects/projects-repository';
import { useAction } from './action';
import { useRepositories } from './context';
import { type ProposalActFailure, proposalActFailureOf } from './proposal-cache';
import { recordReadOf } from './read';
import { useTenantId } from './use-tenant-id';

type RecordRead<T> = Exclude<Read<T>, { readonly kind: 'empty' }>;

/**
 * What *Mark won* takes from the lead's proposal (`M07-62`): the accepted version's value — shown,
 * never typed — and its plan, or why the value is typed. Read only while the sheet is open; the
 * server finds the version from the lead itself (`F4-04`).
 */
export function useWonBasis(leadId: string, open: boolean): RecordRead<WonBasisWire> {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const basis = useQuery({
    queryKey: queryKeys.proposals.wonBasis(tenantId, leadId),
    queryFn: ({ signal }) => repositories.projects.wonBasis(leadId, signal),
    enabled: tenantId !== '' && leadId !== '' && open,
    // An answer may have landed since the sheet was last open: it reads again each time.
    staleTime: 0,
  });
  return recordReadOf(basis);
}

/**
 * *Put version N in force* after Won (`M08-50`, `M11-14`): what it would do — the new total, what
 * is paid and stays, the plan for the rest — read while its sheet names a version, and the act,
 * which answers the project as it now stands. Every receipt is kept.
 */
export interface VersionInForce {
  /** The sheet's facts for the version named; `null` when none is. */
  readonly preview: RecordRead<VersionInForcePreview> | null;
  /** The person confirms the customer agreed. A second press while one is out sends nothing. */
  put(): void;
  readonly putting: boolean;
  /** The version now in force, once the act landed. */
  readonly inForce: number | null;
  readonly failure: ProposalActFailure | null;
  clear(): void;
}

export function useVersionInForce(projectId: string, version: number | null): VersionInForce {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const [inForce, setInForce] = useState<number | null>(null);
  const preview = useQuery({
    queryKey: queryKeys.projects.versionInForce(tenantId, projectId, version ?? 0),
    queryFn: ({ signal }) =>
      repositories.projects.versionInForcePreview(projectId, version ?? 0, signal),
    enabled: tenantId !== '' && projectId !== '' && version !== null,
    staleTime: 0,
  });
  const put = useAction(
    (named: number) =>
      repositories.projects.acts.putVersionInForce(projectId, {
        version: named,
        capturedAt: new Date().toISOString(),
      }),
    {
      onDone: (project: ProjectDetail, named) => {
        setInForce(named);
        queryClient.setQueryData(queryKeys.projects.detail(tenantId, projectId), project);
        // The schedule, the board's money and the proposal's versions all follow the version in force.
        void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(tenantId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all(tenantId) });
        // The owner home's money follows the tranches of the version in force.
        void queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.owner(tenantId) });
      },
    },
  );
  return {
    preview: version === null ? null : recordReadOf(preview),
    put: () => {
      if (version !== null) void put.run(version);
    },
    putting: put.pending,
    inForce,
    failure: put.failure === null ? null : inForceFailureOf(put.failure),
    clear: () => {
      setInForce(null);
      put.clear();
    },
  };
}

function inForceFailureOf(error: unknown): ProposalActFailure {
  return error instanceof ProjectActRefusedError
    ? { kind: 'refused', refusal: error.refusal }
    : proposalActFailureOf(error);
}

/**
 * The evening-before installation message a person sends (`F5-68`), in the customer's language:
 * read while its sheet is open. Composed by the server, sent by the person — never a delivery.
 */
export function useCrewMessage(projectId: string, open: boolean): RecordRead<ComposedMessage> {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const message = useQuery({
    queryKey: queryKeys.projects.crewMessage(tenantId, projectId),
    queryFn: ({ signal }) => repositories.projects.crewMessage(projectId, signal),
    enabled: tenantId !== '' && projectId !== '' && open,
  });
  return recordReadOf(message);
}

/**
 * A frozen version for the print page (`T-M06-017`): signed-out, behind the renderer's short-lived
 * grant. It answers exactly what the document's pages draw; the page marks itself ready to print
 * only once this is `ready`.
 */
export function usePrintableProposal(
  versionId: string,
  grant: string,
): RecordRead<ProposalDocument> {
  const { customerLinkPublic } = useRepositories();
  const document = useQuery({
    queryKey: queryKeys.customerLink.print(versionId, grant),
    queryFn: ({ signal }) => customerLinkPublic.print(versionId, grant, signal),
    enabled: versionId !== '' && grant !== '',
    // A version is frozen and the page is printed once: it is never read twice.
    staleTime: Number.POSITIVE_INFINITY,
  });
  return recordReadOf(document);
}
