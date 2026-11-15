import {
  customer,
  lead,
  project,
  proposal,
  proposalVersion,
  type TenantPool,
  userAccount,
} from '@heliogrid/db';
import { listFilterOf, PROPOSAL_STATUSES, type ProposalListFilter } from '@heliogrid/domain';
import { fieldSetOf } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, not, or, type SQL, sql } from 'drizzle-orm';
import { payableOnLink, versionOnLink } from '../../common/db/proposal-on-link.repository';
import { TENANT_DB } from '../../common/db/tenant.token';
import { type LeadReader, leadScopeWhere, memberNameOf } from '../crm/crm.public';
import { dealWon } from './proposals.pipeline.repository';

/**
 * The rows a chip holds, written from `listFilterOf` itself: every status, won or not, whose chip
 * it is — so the database filter and the counts never sort a proposal differently.
 */
function underChip(filter: Exclude<ProposalListFilter, 'all'>, won: SQL): SQL | undefined {
  return or(
    ...PROPOSAL_STATUSES.flatMap((status) =>
      [false, true]
        .filter((isWon) => listFilterOf(status, isWon) === filter)
        .map((isWon) => and(eq(proposal.status, status), isWon ? won : not(won))),
    ),
  );
}

export interface ProposalListAsk {
  readonly filter: ProposalListFilter;
  readonly mine: boolean;
  readonly limit: number;
  readonly offset: number;
}

/**
 * The proposals list (`M06-48`, `T-M06-019`): the proposals of the leads the reader may see, newest
 * change first, with each chip's count over the same leads — one tenant transaction, no read per row.
 */
@Injectable()
export class ProposalsListRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  list(reader: LeadReader, ask: ProposalListAsk) {
    const { tenantId } = reader;
    const reach: SQL | undefined = and(
      eq(proposal.tenantId, tenantId),
      leadScopeWhere(reader.scope, reader.actorId),
      ask.mine ? eq(proposal.createdBy, reader.actorId) : undefined,
    );
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const won = dealWon(tx);
      const shown = ask.filter === 'all' ? reach : and(reach, underChip(ask.filter, won));
      const onLead = and(eq(lead.id, proposal.leadId), eq(lead.tenantId, proposal.tenantId));
      const onLatest = and(
        eq(proposalVersion.proposalId, proposal.id),
        eq(proposalVersion.tenantId, proposal.tenantId),
        eq(proposalVersion.version, proposal.latestVersion),
      );
      const rows = await tx
        .select({
          id: proposal.id,
          leadId: proposal.leadId,
          number: proposal.number,
          status: proposal.status,
          latestVersion: proposal.latestVersion,
          sharedVersion: proposal.sharedVersion,
          versionOnLink,
          sharedAt: proposal.sharedAt,
          openedAt: proposal.openedAt,
          answer: proposal.answer,
          answeredAt: proposal.answeredAt,
          fieldSet: proposal.fieldSet,
          payableMinor: payableOnLink,
          updatedAt: proposal.updatedAt,
          createdBy: proposal.createdBy,
          creatorName: memberNameOf(userAccount),
          customerName: customer.name,
          city: customer.city,
          siteAddress: lead.siteAddress,
          siteArea: lead.siteArea,
          siteDistrict: lead.siteDistrict,
          wonAt: project.createdAt,
          latestPins: proposalVersion.pins,
          generatedAt: proposalVersion.generatedAt,
        })
        .from(proposal)
        .innerJoin(lead, onLead)
        .innerJoin(
          customer,
          and(eq(customer.id, lead.customerId), eq(customer.tenantId, lead.tenantId)),
        )
        .leftJoin(userAccount, eq(userAccount.id, proposal.createdBy))
        .leftJoin(
          project,
          and(eq(project.leadId, proposal.leadId), eq(project.tenantId, proposal.tenantId)),
        )
        .leftJoin(proposalVersion, onLatest)
        .where(shown)
        .orderBy(desc(proposal.updatedAt), desc(proposal.id))
        .limit(ask.limit)
        .offset(ask.offset);
      const [total] = await tx
        .select({ n: count() })
        .from(proposal)
        .innerJoin(lead, onLead)
        .where(shown);
      const byStatus = await tx
        .select({
          status: proposal.status,
          won: sql<boolean>`${won}`,
          n: count(),
          payable: sql<string>`coalesce(sum(${payableOnLink}), 0)`,
        })
        .from(proposal)
        .innerJoin(lead, onLead)
        .where(reach)
        .groupBy(proposal.status, won);
      return {
        rows: rows.map((row) => ({ ...row, fieldSet: fieldSetOf(row.fieldSet) })),
        totalCount: total?.n ?? 0,
        byStatus,
      };
    });
  }
}

export type ProposalListRead = Awaited<ReturnType<ProposalsListRepository['list']>>;
