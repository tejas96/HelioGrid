import { acceptanceRecord, type DbTransaction, linkEvent, type TenantPool } from '@heliogrid/db';
import {
  type DeviceClass,
  type LinkEventType,
  type LinkSection,
  type MarketPack,
  PROPOSAL_TASK_PROVENANCES,
  type ProposalActResult,
  type ProposalAnswer,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { TENANT_DB } from '../../common/db/tenant.token';
import { closeTasksRaisedBy, raiseTask, recordActivity } from '../crm/crm.public';
import {
  recordAnswer,
  type ServedVersion,
  servedFigures,
  stampOpened,
} from '../proposals/proposals.public';
import {
  auditCustomerAct,
  customerActor,
  gone,
  heldVisit,
  type LinkActOutcome,
  type LinkNotice,
  leadOf,
  notifyAbout,
  refused,
  respondRefusal,
  versionOf,
  viaOf,
} from './customer-link.act-effects.repository';
import { CustomerProjectsRegistry } from './customer-link.projects.repository';
import type { PresentedToken } from './customer-link.token.admin.repository';
import { isCompanyMember, type LinkVisit, visitOf } from './customer-link.visit.repository';

/** The one moment more than the link is recorded: the accepting session's own facts (`F5-46`). */
export interface AcceptingSession {
  readonly networkAddress: string;
  readonly userAgent: string;
}

export interface AnswerAsk {
  readonly answer: ProposalAnswer;
  /** The version the page showed, by id: a newer proposal's version of the same number is not it. */
  readonly versionId: string;
  /** The customer's own words on a change request or a decline, as written. */
  readonly words: string | null;
  readonly session: AcceptingSession;
  /** The company's market pack: what the served version's figures are judged current against. */
  readonly pack: MarketPack;
}

const ANSWER_EVENT: Readonly<Record<ProposalAnswer, LinkEventType>> = {
  accept: 'accepted',
  negotiate: 'negotiate_requested',
  decline: 'declined',
};
const ANSWER_AUDIT = {
  accept: 'customer_link.accepted',
  negotiate: 'customer_link.negotiation_requested',
  decline: 'customer_link.declined',
} as const;
const ANSWER_NOTICE = {
  accept: 'proposal_accepted',
  negotiate: 'negotiation_requested',
  decline: 'proposal_declined',
} as const;

/**
 * What the customer does to a proposal on their link (`F5-27`, `F5-43`, `F5-46`): opens it, reads
 * it, answers it. Each act is one transaction of the link's own company: the lead is held first,
 * the link and the deal are read after the lock, a refusal writes nothing, and what stands is
 * written with its audit entry, its timeline entry, the task it raises and the notice it sends.
 */
@Injectable()
export class CustomerLinkActsRepository {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TENANT_DB) private readonly db: TenantPool,
    @Inject(CustomerProjectsRegistry) private readonly projects: CustomerProjectsRegistry,
  ) {}

  /** The link's deal as it stands, with no lock: what an act's words are rendered from. */
  visit(token: PresentedToken, now: number): Promise<LinkVisit | null> {
    return this.db.withTenantTransaction(token.tenantId, (tx) =>
      visitOf(tx, token, this.projects, now),
    );
  }

  /**
   * One open (`F5-27`, `F5-29`): the link, the moment and a device class — nothing of the reader.
   * The first open of the version the link serves stamps the proposal, joins the timeline and
   * tells the lead's holder (`M06-54`). A link that does not serve records nothing.
   */
  opened(
    token: PresentedToken,
    deviceClass: DeviceClass,
    notice: LinkNotice,
    now: number,
  ): Promise<readonly string[]> {
    const at = new Date(now);
    return this.db.withTenantTransaction(token.tenantId, async (tx) => {
      const held = await heldVisit(tx, token, this.projects, now);
      if (held === null || held.visit.serving.kind !== 'serves') return [];
      const { visit } = held;
      const served = held.visit.serving.phase === 'proposal' ? visit.served : null;
      await tx.insert(linkEvent).values({
        tenantId: visit.tenantId,
        linkId: visit.linkId,
        eventType: 'opened',
        occurredAt: at,
        proposalVersion: served?.version ?? null,
        deviceClass,
      });
      await auditCustomerAct(tx, visit, 'customer_link.opened', at);
      return served === null ? [] : firstOpen(tx, visit, served, deviceClass, notice, at);
    });
  }

  /** Whether `userId` is an active member of the link's company — whichever company they act under. */
  belongsToCompany(token: PresentedToken, userId: string): Promise<boolean> {
    return this.db.withTenantTransaction(token.tenantId, (tx) =>
      isCompanyMember(tx, token.tenantId, userId),
    );
  }

  /** How long a section was on screen (`F5-28`) — the product's own evidence, on a serving proposal page only. */
  viewed(token: PresentedToken, section: LinkSection, seconds: number, now: number): Promise<void> {
    return this.db.withTenantTransaction(token.tenantId, async (tx) => {
      const visit = await visitOf(tx, token, this.projects, now);
      if (visit === null || visit.serving.kind !== 'serves' || visit.served === null) return;
      if (visit.serving.phase !== 'proposal') return;
      await tx.insert(linkEvent).values({
        tenantId: visit.tenantId,
        linkId: visit.linkId,
        eventType: 'section_viewed',
        occurredAt: new Date(now),
        proposalVersion: visit.served.version,
        section,
        durationSeconds: seconds,
      });
    });
  }

  /**
   * Accept, a change asked, or a decline (`F5-43`, `F5-47`, `M06-45`): one answer per version,
   * re-checked on the server against the version the link serves now. Only this writes an
   * acceptance; nothing here creates a project or marks a lead lost.
   */
  answer(
    token: PresentedToken,
    ask: AnswerAsk,
    notice: LinkNotice,
    now: number,
  ): Promise<LinkActOutcome> {
    const at = new Date(now);
    return this.db.withTenantTransaction(token.tenantId, async (tx) => {
      const held = await heldVisit(tx, token, this.projects, now);
      if (held === null) return gone();
      const { visit, locked } = held;
      const refusal = respondRefusal(visit, 'respond');
      if (refusal !== null || visit.served === null) return refused(refusal ?? 'link_off');
      if (ask.versionId !== visit.served.versionId) return refused('version_not_current');
      const result = await recordAnswer(tx, locked, {
        proposalId: visit.served.proposalId,
        version: visit.served.version,
        answer: ask.answer,
        figures: servedFigures(visit.served, ask.pack),
        at,
      });
      if (result.kind === 'refused') return refused(result.refusal);
      await writeAnswer(tx, visit, visit.served, ask, at);
      await moveTasks(tx, visit, result, at);
      const about = { kind: 'proposal', ref: visit.served.proposalId } as const;
      const notified = await notifyAbout(tx, visit, ANSWER_NOTICE[ask.answer], about, notice, at);
      return { outcome: 'done', notified };
    });
  }
}

/** The first open of the served version: stamped once, on the timeline, and told to the lead's holder. */
async function firstOpen(
  tx: DbTransaction,
  visit: LinkVisit,
  served: ServedVersion,
  deviceClass: DeviceClass,
  notice: LinkNotice,
  at: Date,
): Promise<readonly string[]> {
  const { proposalId, version } = served;
  if (!(await stampOpened(tx, visit.tenantId, { proposalId, version, at }))) return [];
  await recordActivity(tx, {
    ...leadOf(visit),
    kind: 'proposal_opened',
    body: { ...versionOf(visit), ...viaOf(visit), deviceClass },
    actor: customerActor(),
    capturedAt: at,
  });
  return notifyAbout(
    tx,
    visit,
    'proposal_opened',
    { kind: 'proposal', ref: proposalId },
    notice,
    at,
  );
}

/** An answer's own rows: the link's event, the acceptance where it is one, the audit and timeline entries. */
async function writeAnswer(
  tx: DbTransaction,
  visit: LinkVisit,
  served: ServedVersion,
  ask: AnswerAsk,
  at: Date,
): Promise<void> {
  await tx.insert(linkEvent).values({
    tenantId: visit.tenantId,
    linkId: visit.linkId,
    eventType: ANSWER_EVENT[ask.answer],
    occurredAt: at,
    proposalVersion: served.version,
    words: ask.answer === 'accept' ? null : ask.words,
  });
  if (ask.answer === 'accept') {
    // Written once, at this moment (`F5-46`): nothing of the session is kept while a customer only reads.
    await tx.insert(acceptanceRecord).values({
      tenantId: visit.tenantId,
      linkId: visit.linkId,
      tokenId: visit.tokenId,
      contactId: visit.contactId,
      proposalId: served.proposalId,
      proposalVersionId: served.versionId,
      challenge: 'off',
      networkAddress: ask.session.networkAddress,
      userAgent: ask.session.userAgent,
      acceptedAt: at,
    });
  }
  await auditCustomerAct(tx, visit, ANSWER_AUDIT[ask.answer], at, served.proposalId);
  await recordActivity(tx, {
    ...leadOf(visit),
    ...answerEntry(visit, ask),
    actor: customerActor(),
    capturedAt: at,
  });
}

/** The timeline entry of an answer, with the customer's words where they wrote some (`F5-53`). */
function answerEntry(visit: LinkVisit, ask: AnswerAsk) {
  const on = { ...versionOf(visit), ...viaOf(visit) };
  if (ask.answer === 'accept') return { kind: 'proposal_accepted' as const, body: on };
  if (ask.answer === 'negotiate') {
    return {
      kind: 'proposal_negotiation_requested' as const,
      body: { ...on, words: ask.words ?? '' },
    };
  }
  return { kind: 'proposal_declined' as const, body: { ...on, reason: ask.words } };
}

/**
 * The tasks an answer moves (`M06-55`, `T-F5-008`): the open proposal follow-up closes — nobody
 * chases a customer who answered — and an Accept or a Decline raises the next act, due the same
 * day, on the person the page names. The Confirm won task carries the link's name and its contact,
 * so the confirming call checks it was the right person.
 */
async function moveTasks(
  tx: DbTransaction,
  visit: LinkVisit,
  result: Extract<ProposalActResult, { kind: 'moved' }>,
  at: Date,
): Promise<void> {
  if (result.closesFollowUp) {
    await closeTasksRaisedBy(tx, visit.tenantId, visit.leadId, PROPOSAL_TASK_PROVENANCES);
  }
  if (result.raisesTask === null || visit.person === null) return;
  await raiseTask(tx, {
    tenantId: visit.tenantId,
    leadId: visit.leadId,
    assigneeUserId: visit.person.userId,
    kind: 'follow_up',
    provenance: result.raisesTask,
    dueAt: at,
    title: visit.contactName === null ? visit.label : `${visit.label} · ${visit.contactName}`,
    raisedBy: null,
    at,
  });
}
