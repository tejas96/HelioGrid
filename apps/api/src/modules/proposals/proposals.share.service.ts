import { type ComposedMessage, type ProposalDetail, SHARE_LINK_SLOT } from '@heliogrid/contracts';
import {
  composeMessage,
  formatMinorUnitsPlainly,
  formatNumber,
  formatPhone,
  issueBlockedBy,
  localDate,
  PROJECT_STAGE_CHAIN,
  PROPOSAL_FOLLOW_UP_AFTER_MS,
  type ProposalVersionSnapshot,
  type ShareChannel,
  scaledPower,
} from '@heliogrid/domain';
import { chatRequestUri } from '@heliogrid/domain/server';
import { createTranslator, proposalMessageTemplate } from '@heliogrid/i18n';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import type { LeadReader } from '../crm/crm.public';
import { type AssemblyContext, ProposalsAssembler } from './proposals.assembler.service';
import { ProposalLinksRegistry } from './proposals.links.repository';
import {
  type ProposalFacts,
  ProposalsReadRepository,
  type VersionFacts,
} from './proposals.read.repository';
import { ProposalsService, refusedAct } from './proposals.service';
import { ProposalsShareRepository } from './proposals.share.repository';
import { latestFreshness } from './proposals.track-wire';

/**
 * Sharing a proposal (`M06-53`, `M06-55`, `M06-57`, `F5-48`): the words are composed here, in the
 * customer's language, and SENT BY THE PERSON — a share is their tap, and nothing in it or after it
 * claims a delivery. A share mints the customer's link where none is live; a later one reuses it.
 */
@Injectable()
export class ProposalsShareService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProposalsShareRepository) private readonly shares: ProposalsShareRepository,
    @Inject(ProposalsReadRepository) private readonly reads: ProposalsReadRepository,
    @Inject(ProposalsAssembler) private readonly assembler: ProposalsAssembler,
    @Inject(ProposalsService) private readonly proposals: ProposalsService,
    @Inject(ProposalLinksRegistry) private readonly links: ProposalLinksRegistry,
  ) {}

  /** The words the share sheet shows before the tap; the link's place is held until one exists. */
  async shareMessage(
    reader: LeadReader,
    proposalId: string,
    sender: string,
  ): Promise<ComposedMessage> {
    const { facts, context, snapshot } = await this.latest(reader, proposalId);
    return this.composed(reader, facts, context, snapshot, 'proposal_share', sender);
  }

  /**
   * Marks the latest version shared (`M06-45`, `M06-53`): refused while its figures are not current
   * (`F8-17`), on a closed lead, and where nothing newer exists to revive a dead proposal.
   */
  async share(
    reader: LeadReader,
    proposalId: string,
    body: { readonly channel: ShareChannel; readonly capturedAt: string },
    sender: string,
    act: Act,
  ): Promise<{ proposal: ProposalDetail; message: ComposedMessage; followUpOn: string | null }> {
    const { facts, context } = await this.latest(reader, proposalId);
    const outcome = await this.shares.share(
      reader,
      proposalId,
      {
        channel: body.channel,
        capturedAt: new Date(body.capturedAt),
        followUpAt: new Date(act.now + PROPOSAL_FOLLOW_UP_AFTER_MS),
        // Judged on the version read just now: one generated since is judged by the next share.
        blockedBy: (stored) =>
          stored.latestVersion === facts.proposal.latestVersion ? shareBlock(facts, context) : null,
      },
      act,
    );
    if (outcome.outcome === 'not-found') throw new NotFoundException('No such proposal.');
    if (outcome.outcome === 'refused') throw refusedAct(outcome.refusal);
    const after = await this.latest(reader, proposalId);
    return {
      proposal: await this.proposals.detail(reader, proposalId),
      message: await this.composed(
        reader,
        after.facts,
        context,
        after.snapshot,
        'proposal_share',
        sender,
      ),
      followUpOn:
        outcome.followUpAt === null
          ? null
          : localDate(outcome.followUpAt.getTime(), context.settings.inForce.locale.value.timezone),
    };
  }

  /** A person withdraws their proposal (`M06-58`): its link then says it is no longer active. */
  async withdraw(
    reader: LeadReader,
    proposalId: string,
    capturedAt: string,
    act: Act,
  ): Promise<ProposalDetail> {
    const outcome = await this.shares.withdraw(reader, proposalId, new Date(capturedAt), act);
    if (outcome.outcome === 'not-found') throw new NotFoundException('No such proposal.');
    if (outcome.outcome === 'refused') throw refusedAct(outcome.refusal);
    return this.proposals.detail(reader, proposalId);
  }

  /**
   * The thank-you a person sends after an Accept (`F5-48`): the advance is "requested once
   * {person} confirms" only when the version has a part due at signing; otherwise the person calls.
   */
  async acceptanceMessage(
    reader: LeadReader,
    proposalId: string,
    sender: string,
  ): Promise<ComposedMessage> {
    const { facts, context, snapshot } = await this.served(reader, proposalId);
    if (facts.proposal.status !== 'accepted') throw refusedAct('not_shared');
    const advance = advanceOf(snapshot);
    return this.composed(
      reader,
      facts,
      context,
      snapshot,
      advance === null ? 'acceptance_confirmation_no_advance' : 'acceptance_confirmation',
      sender,
      advance === null
        ? {}
        : {
            amount: formatMinorUnitsPlainly(context.pack.formats, advance),
          },
    );
  }

  /** The proposal with its newest version — what a share sends. */
  private async latest(reader: LeadReader, proposalId: string) {
    const base = await this.assembler.contextFor(reader.tenantId, null, null);
    const head = await this.reads.facts(reader, proposalId, base.pack.formats);
    if (head === null) throw new NotFoundException('No such proposal.');
    const { latestVersion } = head.proposal;
    if (latestVersion === null) throw refusedAct('not_generated');
    return this.withVersion(reader, proposalId, latestVersion, head);
  }

  /** The proposal with the version its link serves — what an answer was given on. */
  private async served(reader: LeadReader, proposalId: string) {
    const base = await this.assembler.contextFor(reader.tenantId, null, null);
    const head = await this.reads.facts(reader, proposalId, base.pack.formats);
    if (head === null) throw new NotFoundException('No such proposal.');
    const { sharedVersion } = head.proposal;
    if (sharedVersion === null) throw refusedAct('not_shared');
    return this.withVersion(reader, proposalId, sharedVersion, head);
  }

  private async withVersion(
    reader: LeadReader,
    proposalId: string,
    version: number,
    head: ProposalFacts,
  ): Promise<{ facts: VersionFacts; context: AssemblyContext; snapshot: ProposalVersionSnapshot }> {
    const context = await this.assembler.contextFor(
      reader.tenantId,
      head.deal.preferredLanguage,
      head.owner,
    );
    const facts = await this.reads.version(reader, proposalId, version, context.pack.formats);
    if (facts === null) throw new NotFoundException('No such proposal.');
    return { facts, context, snapshot: facts.frozen.snapshot };
  }

  /** One customer message, composed in the customer's language; a fact it lacks is left out cleanly. */
  private async composed(
    reader: LeadReader,
    facts: ProposalFacts,
    context: AssemblyContext,
    snapshot: ProposalVersionSnapshot,
    key: Parameters<typeof proposalMessageTemplate>[1],
    sender: string,
    more: Readonly<Record<string, string>> = {},
  ): Promise<ComposedMessage> {
    const { formats } = context.pack;
    const { t } = await createTranslator(context.language);
    const link = await this.links.addressOf(reader.tenantId, facts.deal.leadId);
    const capacity = snapshot.fields.system.capacityKw;
    const power = capacity === null ? null : scaledPower(capacity);
    const senderPhone = (await this.reads.person(reader.tenantId, reader.actorId)).phoneE164;
    const { text } = composeMessage(proposalMessageTemplate(t, key), {
      customer: snapshot.deal.clientName ?? undefined,
      company: snapshot.company.name,
      capacity: power === null ? undefined : `${formatNumber(formats, power.amount)} ${power.unit}`,
      // A headline amount leaves a zero fraction unsaid and is never rounded.
      price: formatMinorUnitsPlainly(formats, snapshot.money.payable),
      // Before the first share no link exists: its place is held for the client to fill (`F5-20`).
      link: link ?? SHARE_LINK_SLOT,
      person: sender,
      sender,
      senderPhone: senderPhone === null ? undefined : formatPhone(formats, senderPhone),
      ...more,
    });
    return {
      language: context.language,
      text,
      link,
      chatUri: chatRequestUri(
        context.pack.paymentRails.requestChat ?? null,
        facts.deal.customerPhoneE164,
        text,
      ),
    };
  }
}

/** Why the newest version may not go out now, in the status machine's own words; `null` lets it. */
export function shareBlock(facts: ProposalFacts, context: AssemblyContext) {
  const [latest] = facts.versions;
  const freshness = latestFreshness(latest, context.pack);
  return freshness !== null && issueBlockedBy(freshness) !== null
    ? ('figures_not_current' as const)
    : null;
}

/** The part due at signing — the advance the thank-you names; `null` where the plan has none. */
function advanceOf(snapshot: ProposalVersionSnapshot) {
  const [atSigning] = PROJECT_STAGE_CHAIN;
  const part = snapshot.money.tranches?.find((tranche) => tranche.dueOnStage === atSigning);
  return part?.amount ?? null;
}
