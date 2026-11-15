import {
  customer,
  type DbTransaction,
  lead,
  membershipRole,
  proposal,
  tenantMembership,
  userAccount,
} from '@heliogrid/db';
import {
  FOUNDER_ROLE,
  type FormatPack,
  type LeadLifecycle,
  minorUnits,
  type ProposalDealFacts,
  phoneDigitsMismatch,
  type UiLanguage,
} from '@heliogrid/domain';
import { fieldSetOf } from '@heliogrid/domain/server';
import { and, asc, eq } from 'drizzle-orm';
import {
  type LeadReader,
  leadLifecycleColumns,
  leadScopeWhere,
  lifecycleOf,
  memberNameOf,
} from '../crm/crm.public';

/*
 * What a proposal reads of itself, its lead and its company (`T-M06-032`), each on the CALLER's
 * transaction and each naming its tenant. A proposal is visible exactly where its lead is
 * (`F2.M02.lead-visibility`): a proposal on a lead outside the reader's scope answers as absent.
 */

const proposalColumns = {
  id: proposal.id,
  leadId: proposal.leadId,
  number: proposal.number,
  status: proposal.status,
  quickMode: proposal.quickMode,
  revision: proposal.revision,
  fieldSet: proposal.fieldSet,
  payableMinor: proposal.payableMinor,
  latestVersion: proposal.latestVersion,
  sharedVersion: proposal.sharedVersion,
  sharedAt: proposal.sharedAt,
  openedAt: proposal.openedAt,
  answer: proposal.answer,
  answeredAt: proposal.answeredAt,
  countedAt: proposal.countedAt,
  createdAt: proposal.createdAt,
  createdBy: proposal.createdBy,
  updatedAt: proposal.updatedAt,
};

export type ProposalRecord = NonNullable<Awaited<ReturnType<typeof proposalInScope>>>;

/**
 * The proposal, when its lead is in this company and the reader's scope; `null` otherwise — another
 * company's and one out of scope answer alike, as 404. `locked` holds the row for the rest of the
 * transaction: taken AFTER the lead's lock, as every proposal write takes them.
 */
export async function proposalInScope(
  tx: DbTransaction,
  reader: LeadReader,
  proposalId: string,
  locked = false,
) {
  const query = tx
    .select(proposalColumns)
    .from(proposal)
    .innerJoin(lead, and(eq(lead.id, proposal.leadId), eq(lead.tenantId, proposal.tenantId)))
    .where(
      and(
        eq(proposal.tenantId, reader.tenantId),
        eq(proposal.id, proposalId),
        leadScopeWhere(reader.scope, reader.actorId),
      ),
    );
  const [found] = await (locked ? query.for('update', { of: proposal }) : query);
  return found === undefined ? null : { ...found, fieldSet: fieldSetOf(found.fieldSet) };
}

/** The lead a proposal hangs on, by the proposal's id — what an act locks before it reads the proposal. */
export async function leadIdOfProposal(
  tx: DbTransaction,
  tenantId: string,
  proposalId: string,
): Promise<string | null> {
  const [row] = await tx
    .select({ leadId: proposal.leadId })
    .from(proposal)
    .where(and(eq(proposal.tenantId, tenantId), eq(proposal.id, proposalId)));
  return row?.leadId ?? null;
}

/** A proposal's lead and customer as the proposal reads them — never copied into the draft. */
export interface DealRecord {
  readonly leadId: string;
  readonly customerId: string;
  readonly lifecycle: LeadLifecycle;
  readonly owner: { readonly userId: string; readonly name: string } | null;
  readonly city: string | null;
  readonly customerPhoneE164: string;
  /** False when the customer is do-not-call or a wrong number: no dial offer anywhere (`M02-44`). */
  readonly canDial: boolean;
  readonly preferredLanguage: UiLanguage | null;
  readonly deal: ProposalDealFacts;
}

export async function dealOf(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
  formats: FormatPack,
): Promise<DealRecord> {
  const owner = userAccount;
  const [row] = await tx
    .select({
      customerId: lead.customerId,
      ...leadLifecycleColumns,
      ownerName: memberNameOf(owner),
      segment: lead.segment,
      siteAddress: lead.siteAddress,
      siteArea: lead.siteArea,
      siteDistrict: lead.siteDistrict,
      sanctionedLoadKw: lead.sanctionedLoadKw,
      supplyPhase: lead.supplyPhase,
      monthlyBillMinor: lead.monthlyBillMinor,
      name: customer.name,
      city: customer.city,
      phoneE164: customer.phoneE164,
      doNotCallSetAt: customer.doNotCallSetAt,
      wrongNumberAt: customer.wrongNumberAt,
      preferredLanguage: customer.preferredLanguage,
    })
    .from(lead)
    .innerJoin(
      customer,
      and(eq(customer.id, lead.customerId), eq(customer.tenantId, lead.tenantId)),
    )
    .leftJoin(owner, eq(owner.id, lead.ownerUserId))
    .where(and(eq(lead.tenantId, tenantId), eq(lead.id, leadId)));
  if (row === undefined) throw new Error(`proposal names lead ${leadId} its company lacks`);
  return {
    leadId,
    customerId: row.customerId,
    lifecycle: lifecycleOf(row),
    owner: row.ownerId === null ? null : { userId: row.ownerId, name: row.ownerName ?? '' },
    city: row.city,
    customerPhoneE164: row.phoneE164,
    canDial: row.doNotCallSetAt === null && row.wrongNumberAt === null,
    preferredLanguage: row.preferredLanguage,
    deal: {
      segment: row.segment,
      area: row.siteArea === null ? null : { area: row.siteArea, district: row.siteDistrict },
      siteAddress: row.siteAddress,
      sanctionedLoadKw: row.sanctionedLoadKw,
      supplyPhase: row.supplyPhase,
      monthlyBill: row.monthlyBillMinor === null ? null : minorUnits(row.monthlyBillMinor),
      clientName: row.name,
      clientPhoneValid: phoneDigitsMismatch(formats, row.phoneE164) === null,
    },
  };
}

/** A person of this company as a document names them: the cover's "Prepared by". */
export interface NamedPerson {
  readonly userId: string;
  readonly name: string;
  readonly phoneE164: string | null;
}

export async function personNamed(tx: DbTransaction, userId: string): Promise<NamedPerson> {
  const [row] = await tx
    .select({ name: memberNameOf(userAccount), phoneE164: userAccount.phoneE164 })
    .from(userAccount)
    .where(eq(userAccount.id, userId));
  return { userId, name: row?.name ?? '', phoneE164: row?.phoneE164 ?? null };
}

/**
 * The company's EPC Owner — the first active one: whose number is the company's contact fact until
 * it sets its own (`M06-07`), and who can add a company fact a rep finds missing (`M06-17`).
 */
export async function companyOwner(
  tx: DbTransaction,
  tenantId: string,
): Promise<NamedPerson | null> {
  const [row] = await tx
    .select({
      userId: userAccount.id,
      name: memberNameOf(userAccount),
      phoneE164: userAccount.phoneE164,
    })
    .from(membershipRole)
    .innerJoin(tenantMembership, eq(tenantMembership.id, membershipRole.membershipId))
    .innerJoin(userAccount, eq(userAccount.id, tenantMembership.userAccountId))
    .where(
      and(
        eq(membershipRole.tenantId, tenantId),
        eq(membershipRole.rolePreset, FOUNDER_ROLE),
        eq(tenantMembership.status, 'active'),
      ),
    )
    .orderBy(asc(tenantMembership.id))
    .limit(1);
  return row === undefined ? null : { ...row, name: row.name ?? '' };
}
