import {
  type DbTransaction,
  lead,
  project,
  projectTranche,
  proposal,
  proposalVersion,
} from '@heliogrid/db';
import {
  isClosedStage,
  type KeptPart,
  type MinorUnits,
  minorUnits,
  type ProjectActRefusal,
  type ProjectStage,
  type ProposalVersionSnapshot,
  type ScheduleInForce,
  type VersionInForceRefusal,
  versionInForceRefusal,
} from '@heliogrid/domain';
import { scheduleInForce, versionSnapshotOf } from '@heliogrid/domain/server';
import { and, desc, eq, max } from 'drizzle-orm';
import { stoodPartsOf } from './internal/money';
import { partFactsOf } from './projects.money.repository';
import { planOfVersion } from './projects.won-basis.repository';

/*
 * What a project stands on when a newer proposal version is put in force (`M08-50`, `M11-14`): the
 * version it runs on, the one asked for, and what the schedule becomes — each read on the caller's
 * transaction, every figure domain's.
 */

/** What a project stands on when a version is asked to be put in force. */
export interface InForceFacts {
  readonly projectId: string;
  readonly leadId: string;
  readonly managerId: string;
  readonly leadOwnerId: string | null;
  readonly closed: boolean;
  /** The version the project runs on; `null` for a deal won with no accepted proposal. */
  readonly inForce: {
    readonly versionId: string;
    readonly proposalId: string;
    readonly version: number;
  } | null;
  /** The proposal a version is put in force from: the one in force, else the lead's latest generated. */
  readonly proposalId: string | null;
  /** That proposal's number, as the server assigned it. */
  readonly proposalNumber: number | null;
  readonly latestVersion: number | null;
  /** The asked version, where the proposal holds it. */
  readonly asked: {
    readonly versionId: string;
    readonly version: number;
    readonly payable: MinorUnits;
    readonly snapshot: ProposalVersionSnapshot;
  } | null;
}

/** The project's proposal, its version in force and the one asked for — read on the caller's transaction. */
export async function inForceFactsOf(
  tx: DbTransaction,
  tenantId: string,
  projectId: string,
  askedVersion: number | null,
): Promise<InForceFacts | null> {
  const [row] = await tx
    .select({
      leadId: project.leadId,
      managerId: project.managerId,
      stage: project.stage,
      versionId: project.proposalVersionId,
      leadOwnerId: lead.ownerUserId,
    })
    .from(project)
    .innerJoin(lead, and(eq(lead.id, project.leadId), eq(lead.tenantId, project.tenantId)))
    .where(and(eq(project.tenantId, tenantId), eq(project.id, projectId)));
  if (row === undefined) return null;
  const [running] =
    row.versionId === null
      ? []
      : await tx
          .select({
            versionId: proposalVersion.id,
            proposalId: proposalVersion.proposalId,
            version: proposalVersion.version,
          })
          .from(proposalVersion)
          .where(
            and(eq(proposalVersion.tenantId, tenantId), eq(proposalVersion.id, row.versionId)),
          );
  const proposalId = running?.proposalId ?? (await latestGeneratedOf(tx, tenantId, row.leadId));
  const [latest] =
    proposalId === null
      ? []
      : await tx
          .select({ version: max(proposalVersion.version), number: proposal.number })
          .from(proposalVersion)
          .innerJoin(
            proposal,
            and(
              eq(proposal.id, proposalVersion.proposalId),
              eq(proposal.tenantId, proposalVersion.tenantId),
            ),
          )
          .where(
            and(eq(proposalVersion.tenantId, tenantId), eq(proposalVersion.proposalId, proposalId)),
          )
          .groupBy(proposal.number);
  const [asked] =
    proposalId === null || askedVersion === null
      ? []
      : await tx
          .select({
            versionId: proposalVersion.id,
            version: proposalVersion.version,
            payableMinor: proposalVersion.payableMinor,
            snapshot: proposalVersion.snapshot,
          })
          .from(proposalVersion)
          .where(
            and(
              eq(proposalVersion.tenantId, tenantId),
              eq(proposalVersion.proposalId, proposalId),
              eq(proposalVersion.version, askedVersion),
            ),
          );
  return {
    projectId,
    leadId: row.leadId,
    managerId: row.managerId,
    leadOwnerId: row.leadOwnerId,
    closed: isClosedStage(row.stage),
    inForce: running ?? null,
    proposalId,
    proposalNumber: latest?.number ?? null,
    latestVersion: latest?.version ?? null,
    asked:
      asked === undefined
        ? null
        : {
            versionId: asked.versionId,
            version: asked.version,
            payable: minorUnits(asked.payableMinor),
            snapshot: versionSnapshotOf(asked.snapshot),
          },
  };
}

/** The lead's proposal that last generated a version — where a deal won without one may take one from. */
async function latestGeneratedOf(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<string | null> {
  const [found] = await tx
    .select({ id: proposal.id })
    .from(proposal)
    .innerJoin(
      proposalVersion,
      and(
        eq(proposalVersion.proposalId, proposal.id),
        eq(proposalVersion.tenantId, proposal.tenantId),
      ),
    )
    .where(and(eq(proposal.tenantId, tenantId), eq(proposal.leadId, leadId)))
    .orderBy(desc(proposalVersion.generatedAt), desc(proposal.id))
    .limit(1);
  return found?.id ?? null;
}

/** The schedule as a version in force would leave it: the kept parts, the new ones and the sums. */
export interface InForcePlan {
  readonly kept: readonly {
    readonly id: string;
    readonly label: string;
    readonly amount: MinorUnits;
    readonly was: MinorUnits;
    readonly state: 'paid' | 'part_paid';
    readonly dueOnStage: ProjectStage;
    readonly paidOn: string | null;
  }[];
  /** The unpaid parts the new version replaces. */
  readonly replaced: readonly string[];
  readonly made: ScheduleInForce;
  readonly collected: MinorUnits;
  /** The highest position any of the project's parts holds, replaced ones too: the next part's is past it. */
  readonly lastPosition: number;
}

/**
 * What putting `asked` in force does to the project's schedule (`M11-14`), worked out by domain's
 * `scheduleInForce`: a part with money against it, or a waived one, stays; an untouched part is
 * replaced by the new version's plan for what remains.
 */
export async function inForcePlanOf(
  tx: DbTransaction,
  tenantId: string,
  projectId: string,
  asked: NonNullable<InForceFacts['asked']>,
): Promise<InForcePlan> {
  const parts = stoodPartsOf((await partFactsOf(tx, tenantId, [projectId])).get(projectId) ?? []);
  const stays = parts.filter((part) => part.facts.receivedMinor > 0 || part.facts.waived !== null);
  const partPaid = (part: (typeof parts)[number]) =>
    part.facts.waived === null && part.standing.outstanding > 0;
  const kept: KeptPart[] = stays.map((part) => ({
    amount: minorUnits(part.facts.amountMinor),
    floor: minorUnits(partPaid(part) ? part.facts.receivedMinor : part.facts.amountMinor),
  }));
  const collected = minorUnits(parts.reduce((sum, part) => sum + part.facts.receivedMinor, 0));
  const made = scheduleInForce(asked.payable, planOfVersion(asked.snapshot), kept, collected);
  return {
    kept: stays.map((part, index) => ({
      id: part.facts.id,
      label: part.facts.label,
      amount: made.kept[index] ?? minorUnits(part.facts.amountMinor),
      was: minorUnits(part.facts.amountMinor),
      state: partPaid(part) ? 'part_paid' : 'paid',
      dueOnStage: part.facts.dueOnStage,
      paidOn: part.facts.lastPaidOn,
    })),
    replaced: parts.filter((part) => !stays.includes(part)).map((part) => part.facts.id),
    made,
    collected,
    lastPosition: await lastPositionOf(tx, tenantId, projectId),
  };
}

/** A replaced part keeps its position under the unique index, so the count runs over every row. */
async function lastPositionOf(
  tx: DbTransaction,
  tenantId: string,
  projectId: string,
): Promise<number> {
  const [row] = await tx
    .select({ last: max(projectTranche.position) })
    .from(projectTranche)
    .where(and(eq(projectTranche.tenantId, tenantId), eq(projectTranche.projectId, projectId)));
  return row?.last ?? 0;
}

/** Why a version may not be put in force where the project stands; `null` lets it. */
export function inForceRefusalOf(
  facts: InForceFacts,
): ProjectActRefusal | VersionInForceRefusal | null {
  if (facts.closed) return 'project_closed';
  if (facts.asked === null) return 'version_unknown';
  return versionInForceRefusal(
    facts.inForce?.version ?? null,
    facts.asked.version,
    facts.latestVersion,
  );
}
