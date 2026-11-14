import type { Task } from '@heliogrid/contracts';
import { acceptanceRecord, proposalVersion, type TenantPool } from '@heliogrid/db';
import type { FormatPack } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { type LeadReader, openTasksOf } from '../crm/crm.public';
import {
  companyOwner,
  type DealRecord,
  dealOf,
  type NamedPerson,
  type ProposalRecord,
  personNamed,
  proposalInScope,
} from './proposals.facts.repository';
import {
  type LinkEvidence,
  linkEvidenceOf,
  linksOfLead,
  projectOfLead,
  sharesOf,
  type VersionRow,
  versionOf,
  versionsOf,
} from './proposals.track.repository';

/** Everything one proposal's screens read of the store, from one tenant transaction. */
export interface ProposalFacts {
  readonly proposal: ProposalRecord;
  readonly deal: DealRecord;
  /** The company's EPC Owner; `null` only for a company with no active one. */
  readonly owner: NamedPerson | null;
  /** Who made the proposal — the cover's "Prepared by" until a version names its generator. */
  readonly maker: NamedPerson;
  readonly versions: readonly VersionRow[];
  readonly shares: Awaited<ReturnType<typeof sharesOf>>;
  /** The versions the customer accepted, by number. */
  readonly accepted: ReadonlyMap<number, Date>;
  readonly evidence: LinkEvidence;
  readonly links: { readonly count: number; readonly labels: string[] };
  readonly project: Awaited<ReturnType<typeof projectOfLead>>;
  readonly openTasks: readonly Task[];
}

/** One version, frozen, with the proposal it belongs to. */
export interface VersionFacts extends ProposalFacts {
  readonly frozen: NonNullable<Awaited<ReturnType<typeof versionOf>>>;
  readonly before: Awaited<ReturnType<typeof versionOf>>;
}

/**
 * A proposal's reads on the runtime pool (`T-M06-032`): visible exactly where its lead is, so one
 * out of the reader's scope and another company's answer alike — `null`, a 404.
 */
@Injectable()
export class ProposalsReadRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  facts(
    reader: LeadReader,
    proposalId: string,
    formats: FormatPack,
  ): Promise<ProposalFacts | null> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const found = await proposalInScope(tx, reader, proposalId);
      if (found === null) return null;
      const accepted = await tx
        .select({ version: proposalVersion.version, acceptedAt: acceptanceRecord.acceptedAt })
        .from(acceptanceRecord)
        .innerJoin(proposalVersion, eq(proposalVersion.id, acceptanceRecord.proposalVersionId))
        .where(
          and(eq(acceptanceRecord.tenantId, tenantId), eq(acceptanceRecord.proposalId, found.id)),
        );
      return {
        proposal: found,
        deal: await dealOf(tx, tenantId, found.leadId, formats),
        owner: await companyOwner(tx, tenantId),
        maker: await personNamed(tx, found.createdBy),
        versions: await versionsOf(tx, tenantId, found.id),
        shares: await sharesOf(tx, tenantId, found.id),
        accepted: new Map(accepted.map((row) => [row.version, row.acceptedAt])),
        evidence: await linkEvidenceOf(tx, tenantId, found),
        links: await linksOfLead(tx, tenantId, found.leadId),
        project: await projectOfLead(tx, tenantId, found.leadId),
        openTasks: await openTasksOf(tx, tenantId, found.leadId),
      };
    });
  }

  /** A person of this company as a message names them: the sender's own number. */
  person(tenantId: string, userId: string): Promise<NamedPerson> {
    return this.db.withTenantTransaction(tenantId, (tx) => personNamed(tx, userId));
  }

  /** One version with the one before it, for its document and what moved (`M06-42`). */
  async version(
    reader: LeadReader,
    proposalId: string,
    version: number,
    formats: FormatPack,
  ): Promise<VersionFacts | null> {
    const facts = await this.facts(reader, proposalId, formats);
    if (facts === null) return null;
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const frozen = await versionOf(tx, reader.tenantId, proposalId, version);
      if (frozen === null) return null;
      const before =
        version > 1 ? await versionOf(tx, reader.tenantId, proposalId, version - 1) : null;
      return { ...facts, frozen, before };
    });
  }
}
