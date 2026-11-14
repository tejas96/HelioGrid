import {
  contact,
  customerLink,
  type DbTransaction,
  linkEvent,
  project,
  proposalShare,
  proposalVersion,
  userAccount,
} from '@heliogrid/db';
import { type DeviceClass, type LinkSection } from '@heliogrid/domain';
import { versionSnapshotOf } from '@heliogrid/domain/server';
import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { memberNameOf } from '../crm/crm.public';

/*
 * What a proposal's track screen reads beside the proposal itself (`M06-42`, `M06-53`, `M06-54`):
 * its versions, when each was shared, the lead's links and what the customer's link saw, and the
 * project the deal became — each inside the caller's tenant transaction and naming its tenant.
 */

/** Every version of a proposal, newest first, as a list names it (`M06-42`). */
export async function versionsOf(tx: DbTransaction, tenantId: string, proposalId: string) {
  return tx
    .select({
      id: proposalVersion.id,
      version: proposalVersion.version,
      generatedAt: proposalVersion.generatedAt,
      generatedBy: proposalVersion.generatedBy,
      generatorName: memberNameOf(userAccount),
      trigger: proposalVersion.trigger,
      changeNote: proposalVersion.changeNote,
      payableMinor: proposalVersion.payableMinor,
      pins: proposalVersion.pins,
    })
    .from(proposalVersion)
    .leftJoin(userAccount, eq(userAccount.id, proposalVersion.generatedBy))
    .where(and(eq(proposalVersion.tenantId, tenantId), eq(proposalVersion.proposalId, proposalId)))
    .orderBy(desc(proposalVersion.version));
}
export type VersionRow = Awaited<ReturnType<typeof versionsOf>>[number];

/** One version's frozen record, or `null` where the proposal has no such version. */
export async function versionOf(
  tx: DbTransaction,
  tenantId: string,
  proposalId: string,
  version: number,
) {
  const [row] = await tx
    .select({ id: proposalVersion.id, snapshot: proposalVersion.snapshot })
    .from(proposalVersion)
    .where(
      and(
        eq(proposalVersion.tenantId, tenantId),
        eq(proposalVersion.proposalId, proposalId),
        eq(proposalVersion.version, version),
      ),
    );
  return row === undefined ? null : { ...row, snapshot: versionSnapshotOf(row.snapshot) };
}

/** When each version was marked shared, by its first share (`M06-53`). */
export async function sharesOf(tx: DbTransaction, tenantId: string, proposalId: string) {
  return tx
    .select({
      version: proposalShare.version,
      sharedAt: proposalShare.sharedAt,
      sharedBy: proposalShare.sharedBy,
      sharerName: memberNameOf(userAccount),
    })
    .from(proposalShare)
    .leftJoin(userAccount, eq(userAccount.id, proposalShare.sharedBy))
    .where(and(eq(proposalShare.tenantId, tenantId), eq(proposalShare.proposalId, proposalId)))
    .orderBy(asc(proposalShare.sharedAt), asc(proposalShare.id));
}

/** The lead's named links: how many are live, and what each is called (`F5-26`). */
export async function linksOfLead(tx: DbTransaction, tenantId: string, leadId: string) {
  const rows = await tx
    .select({ label: customerLink.label })
    .from(customerLink)
    .where(
      and(
        eq(customerLink.tenantId, tenantId),
        eq(customerLink.leadId, leadId),
        eq(customerLink.status, 'active'),
      ),
    )
    .orderBy(asc(customerLink.mintedAt), asc(customerLink.id));
  return { count: rows.length, labels: rows.map((row) => row.label) };
}

/** The project the lead's deal became, and the version it runs on (`M07-62`, `M08-50`). */
export async function projectOfLead(tx: DbTransaction, tenantId: string, leadId: string) {
  const [won] = await tx
    .select({
      id: project.id,
      number: project.number,
      proposalVersionId: project.proposalVersionId,
    })
    .from(project)
    .where(and(eq(project.tenantId, tenantId), eq(project.leadId, leadId)));
  return won ?? null;
}

/** What the customer's link saw of the version it serves, since that version was shared (`M06-54`). */
export interface LinkEvidence {
  readonly firstOpenedAt: Date | null;
  readonly lastOpenedAt: Date | null;
  readonly deviceClass: DeviceClass | null;
  readonly viewedSeconds: number | null;
  readonly longestSection: LinkSection | null;
  readonly answerWords: string | null;
  readonly answeredVia: { readonly label: string; readonly contactName: string | null } | null;
}

const NOTHING_SEEN: LinkEvidence = {
  firstOpenedAt: null,
  lastOpenedAt: null,
  deviceClass: null,
  viewedSeconds: null,
  longestSection: null,
  answerWords: null,
  answeredVia: null,
};

/**
 * The product's own evidence of a shared version (`F5-27`, `F5-28`): its opens, how long it was
 * read and where longest, and which named link answered. Never a delivery: none is recorded.
 */
export async function linkEvidenceOf(
  tx: DbTransaction,
  tenantId: string,
  of: {
    readonly leadId: string;
    readonly sharedVersion: number | null;
    readonly sharedAt: Date | null;
  },
): Promise<LinkEvidence> {
  if (of.sharedVersion === null || of.sharedAt === null) return NOTHING_SEEN;
  const served = and(
    eq(linkEvent.tenantId, tenantId),
    eq(customerLink.leadId, of.leadId),
    gte(linkEvent.occurredAt, of.sharedAt),
  );
  const onLink = and(
    eq(customerLink.id, linkEvent.linkId),
    eq(customerLink.tenantId, linkEvent.tenantId),
  );
  const [opens] = await tx
    .select({
      first: sql<Date | null>`min(${linkEvent.occurredAt})`.mapWith(linkEvent.occurredAt),
      last: sql<Date | null>`max(${linkEvent.occurredAt})`.mapWith(linkEvent.occurredAt),
    })
    .from(linkEvent)
    .innerJoin(customerLink, onLink)
    .where(and(served, eq(linkEvent.eventType, 'opened')));
  if (opens === undefined || opens.first === null) return NOTHING_SEEN;
  const [lastOpen] = await tx
    .select({ deviceClass: linkEvent.deviceClass })
    .from(linkEvent)
    .innerJoin(customerLink, onLink)
    .where(and(served, eq(linkEvent.eventType, 'opened')))
    .orderBy(desc(linkEvent.occurredAt), desc(linkEvent.id))
    .limit(1);
  const views = await tx
    .select({
      section: linkEvent.section,
      seconds: sql<number>`sum(${linkEvent.durationSeconds})`.mapWith(Number),
    })
    .from(linkEvent)
    .innerJoin(customerLink, onLink)
    .where(and(served, eq(linkEvent.eventType, 'section_viewed')))
    .groupBy(linkEvent.section);
  const longest = [...views].sort((a, b) => b.seconds - a.seconds)[0];
  const [answer] = await tx
    .select({
      words: linkEvent.words,
      label: customerLink.label,
      contactName: contact.name,
    })
    .from(linkEvent)
    .innerJoin(customerLink, onLink)
    .leftJoin(contact, eq(contact.id, customerLink.contactId))
    .where(
      and(
        served,
        inArray(linkEvent.eventType, ['accepted', 'negotiate_requested', 'declined']),
        eq(linkEvent.proposalVersion, of.sharedVersion),
      ),
    )
    .orderBy(desc(linkEvent.occurredAt), desc(linkEvent.id))
    .limit(1);
  return {
    firstOpenedAt: opens.first,
    lastOpenedAt: opens.last,
    deviceClass: lastOpen?.deviceClass ?? null,
    viewedSeconds: views.length === 0 ? null : views.reduce((sum, view) => sum + view.seconds, 0),
    longestSection: longest?.section ?? null,
    answerWords: answer?.words ?? null,
    answeredVia:
      answer === undefined ? null : { label: answer.label, contactName: answer.contactName },
  };
}
