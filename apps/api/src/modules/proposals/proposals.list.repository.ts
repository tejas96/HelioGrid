import {
  customer,
  design,
  lead,
  project,
  proposal,
  proposalVersion,
  type TenantPool,
  type TenantScopedDb,
  userAccount,
} from '@heliogrid/db';
import {
  listFilterOf,
  PROPOSAL_STATUSES,
  type ProposalEntryFilter,
  type ProposalListFilter,
} from '@heliogrid/domain';
import { fieldSetOf } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, inArray, not, or, type SQL, sql } from 'drizzle-orm';
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

const proposalOnLead = and(eq(lead.id, proposal.leadId), eq(lead.tenantId, proposal.tenantId));
const designOnLead = and(eq(lead.id, design.leadId), eq(lead.tenantId, design.tenantId));
const customerOfLead = and(eq(customer.id, lead.customerId), eq(customer.tenantId, lead.tenantId));

/** One proposal as a list row reads it: its lead, its customer, its creator, its deal and its latest version. */
function proposalRows(tx: TenantScopedDb) {
  const onLatest = and(
    eq(proposalVersion.proposalId, proposal.id),
    eq(proposalVersion.tenantId, proposal.tenantId),
    eq(proposalVersion.version, proposal.latestVersion),
  );
  return tx
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
    .innerJoin(lead, proposalOnLead)
    .innerJoin(customer, customerOfLead)
    .leftJoin(userAccount, eq(userAccount.id, proposal.createdBy))
    .leftJoin(
      project,
      and(eq(project.leadId, proposal.leadId), eq(project.tenantId, proposal.tenantId)),
    )
    .leftJoin(proposalVersion, onLatest);
}

/** Each chip's count over the reader's proposals, with what each group is worth. */
function proposalGroups(tx: TenantScopedDb, reach: SQL | undefined, won: SQL) {
  return tx
    .select({
      status: proposal.status,
      won: sql<boolean>`${won}`,
      n: count(),
      payable: sql<string>`coalesce(sum(${payableOnLink}), 0)`,
    })
    .from(proposal)
    .innerJoin(lead, proposalOnLead)
    .where(reach)
    .groupBy(proposal.status, won);
}

export interface ProposalListAsk {
  readonly filter: ProposalListFilter;
  readonly mine: boolean;
  readonly limit: number;
  readonly offset: number;
}

export interface ProposalEntriesAsk {
  readonly filter: ProposalEntryFilter;
  readonly limit: number;
  readonly offset: number;
}

/**
 * The proposals list (`M06-48`, `T-M06-019`) and the Proposals page (`T-M05-001b`): the proposals
 * of the leads the reader may see — and, on the page, each design with no proposal yet — newest
 * change first, with each chip's count over the same leads; one tenant transaction, no read per row.
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
      const rows = await proposalRows(tx)
        .where(shown)
        .orderBy(desc(proposal.updatedAt), desc(proposal.id))
        .limit(ask.limit)
        .offset(ask.offset);
      const [total] = await tx
        .select({ n: count() })
        .from(proposal)
        .innerJoin(lead, proposalOnLead)
        .where(shown);
      const byStatus = await proposalGroups(tx, reach, won);
      return {
        rows: rows.map((row) => ({ ...row, fieldSet: fieldSetOf(row.fieldSet) })),
        totalCount: total?.n ?? 0,
        byStatus,
      };
    });
  }

  /**
   * The page's rows: one ordered, paged union of the proposals and the designs a chip holds — a
   * design only under `all` and `3d`, a proposal under its own chip and `all` — then each side read
   * whole by its ids. A design reaches the reader as its lead does (`F2.M02.lead-visibility`).
   */
  entries(reader: LeadReader, ask: ProposalEntriesAsk) {
    const { tenantId } = reader;
    const inScope = leadScopeWhere(reader.scope, reader.actorId);
    const proposalReach = and(eq(proposal.tenantId, tenantId), inScope);
    const designReach = and(eq(design.tenantId, tenantId), inScope);
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const won = dealWon(tx);
      const proposalsShown =
        ask.filter === '3d'
          ? sql`false`
          : ask.filter === 'all'
            ? proposalReach
            : and(proposalReach, underChip(ask.filter, won));
      const designsShown = ask.filter === 'all' || ask.filter === '3d' ? designReach : sql`false`;
      const page = await tx
        .select({
          kind: sql<'proposal' | 'design'>`'proposal'`.as('kind'),
          id: proposal.id,
          updatedAt: proposal.updatedAt,
        })
        .from(proposal)
        .innerJoin(lead, proposalOnLead)
        .where(proposalsShown)
        .unionAll(
          tx
            .select({
              kind: sql<'proposal' | 'design'>`'design'`.as('kind'),
              id: design.id,
              updatedAt: design.updatedAt,
            })
            .from(design)
            .innerJoin(lead, designOnLead)
            .where(designsShown),
        )
        .orderBy(sql`updated_at desc`, sql`id desc`)
        .limit(ask.limit)
        .offset(ask.offset);
      const idsOf = (kind: 'proposal' | 'design') =>
        page.filter((entry) => entry.kind === kind).map((entry) => entry.id);
      const proposalIds = idsOf('proposal');
      const designIds = idsOf('design');
      const proposals =
        proposalIds.length === 0
          ? []
          : await proposalRows(tx).where(and(proposalReach, inArray(proposal.id, proposalIds)));
      const designs =
        designIds.length === 0
          ? []
          : await tx
              .select({
                id: design.id,
                leadId: design.leadId,
                ordinal: design.ordinal,
                mount: design.mount,
                status: design.status,
                updatedAt: design.updatedAt,
                updatedBy: design.updatedBy,
                updaterName: memberNameOf(userAccount),
                customerName: customer.name,
                city: customer.city,
              })
              .from(design)
              .innerJoin(lead, designOnLead)
              .innerJoin(customer, customerOfLead)
              .leftJoin(userAccount, eq(userAccount.id, design.updatedBy))
              .where(and(designReach, inArray(design.id, designIds)));
      const byStatus = await proposalGroups(tx, proposalReach, won);
      const [designTotal] = await tx
        .select({ n: count() })
        .from(design)
        .innerJoin(lead, designOnLead)
        .where(designReach);
      return {
        page: page.map(({ kind, id }) => ({ kind, id })),
        proposals: proposals.map((row) => ({ ...row, fieldSet: fieldSetOf(row.fieldSet) })),
        designs,
        byStatus,
        designCount: designTotal?.n ?? 0,
      };
    });
  }
}

export type ProposalListRead = Awaited<ReturnType<ProposalsListRepository['list']>>;
export type ProposalEntriesRead = Awaited<ReturnType<ProposalsListRepository['entries']>>;
