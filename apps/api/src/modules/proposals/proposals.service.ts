import {
  type CreateHeaders,
  type EditProposal,
  PROPOSAL_ACT_REFUSED,
  PROPOSAL_CHANGED_ELSEWHERE,
  PROPOSAL_LEAD_MOVED,
  type ProposalDetail,
  proposalActRefusedEnvelope,
  proposalConflictEnvelope,
  proposalsContract,
  type StartProposal,
} from '@heliogrid/contracts';
import { type ProposalActRefusal, type ProposalFieldSet } from '@heliogrid/domain';
import { paymentFromTemplate, timelineFromTemplate } from '@heliogrid/domain/server';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { ContractException, refusalWithFacts } from '../../common/errors/contract-exception';
import { minorUnitsOnField } from '../../common/errors/minor-units-on-field';
import type { LeadReader } from '../crm/crm.public';
import { SettingsService } from '../settings/settings.public';
import { nobody, refuseTooManyBrands, seededFieldSet } from './internal/draft-seed';
import { amountsTyped, fieldSetWithEdit } from './internal/field-set-wire';
import { type AssemblyContext, ProposalsAssembler, rightsOf } from './proposals.assembler.service';
import { ProposalsEnergyService } from './proposals.energy.service';
import { ProposalsReadRepository } from './proposals.read.repository';
import {
  type CommitOutcome,
  type DraftChange,
  type DraftFigures,
  ProposalsRepository,
} from './proposals.repository';

/** A refusal the status machine or the lead's state gave (`M06-45`), as the route declares it. */
export function refusedAct(refusal: ProposalActRefusal): ContractException {
  return refusalWithFacts(proposalActRefusedEnvelope, HttpStatus.UNPROCESSABLE_ENTITY, {
    code: PROPOSAL_ACT_REFUSED,
    message: 'The proposal cannot do that from where it stands.',
    facts: { refusal },
  });
}

/** A commit the draft could not take (`M06-25`): the typed value stays, nothing was overwritten. */
export function conflictOf(
  outcome: Extract<CommitOutcome, { outcome: 'stale' | 'lead-moved' }>,
): ContractException {
  const moved = outcome.outcome === 'lead-moved';
  return refusalWithFacts(proposalConflictEnvelope, HttpStatus.CONFLICT, {
    code: moved ? PROPOSAL_LEAD_MOVED : PROPOSAL_CHANGED_ELSEWHERE,
    message: moved
      ? 'This lead moved to someone else.'
      : 'Changed on another device. Reload to see it.',
    facts: {
      revision: outcome.revision,
      movedTo: moved ? outcome.movedTo : null,
    },
  });
}

/**
 * A proposal's draft (`M06-02`, `M06-25`, `T-M06-032`): started on a lead, read whole, and saved
 * step by step on the revision each step was typed on. Every figure it answers is domain's, worked
 * out on the server (`F4-04`).
 */
@Injectable()
export class ProposalsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProposalsRepository) private readonly drafts: ProposalsRepository,
    @Inject(ProposalsReadRepository) private readonly reads: ProposalsReadRepository,
    @Inject(ProposalsAssembler) private readonly assembler: ProposalsAssembler,
    @Inject(ProposalsEnergyService) private readonly energy: ProposalsEnergyService,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  /** One proposal's whole read; 404 where its lead is not the reader's to see. */
  async detail(reader: LeadReader, proposalId: string): Promise<ProposalDetail> {
    const pack = await this.settings.packOf(reader.tenantId);
    const facts = await this.reads.facts(reader, proposalId, pack.formats);
    if (facts === null) throw new NotFoundException('No such proposal.');
    return this.assembler.detail(reader, facts);
  }

  /** Starts a proposal on the lead, or opens its one draft again (`T-M06-001`). */
  async start(
    reader: LeadReader,
    leadId: string,
    body: StartProposal,
    headers: CreateHeaders,
    act: Act,
  ): Promise<{ readonly created: boolean; readonly proposal: ProposalDetail }> {
    const route = proposalsContract.start;
    const key = creationKeyOf(headers, act.actorUserId, route, { leadId, ...body });
    // The draft is filled in the document's language: the customer's, else the company's.
    const outcome = await this.drafts.start(reader, leadId, body, key, act, async (deal) =>
      seededFieldSet(
        await this.assembler.contextFor(reader.tenantId, deal.preferredLanguage, null),
        deal.segment,
      ),
    );
    switch (outcome.outcome) {
      case 'not-found':
        throw new NotFoundException('No such lead.');
      case 'copy-not-found':
        throw new NotFoundException('No such proposal to copy.');
      case 'refused':
        throw refusedAct(outcome.refusal);
      case 'resumed':
        return { created: false, proposal: await this.detail(reader, outcome.proposalId) };
      default: {
        const made = this.replies.rowOf(
          outcome.outcome === 'key-reused'
            ? outcome
            : { outcome: outcome.outcome, row: outcome.proposalId },
          route,
          reader.tenantId,
        );
        return { created: true, proposal: await this.detail(reader, made) };
      }
    }
  }

  /** One commit: the steps and lead facts sent, on the revision they were typed on (`M06-25`). */
  async edit(
    reader: LeadReader,
    proposalId: string,
    body: EditProposal,
    act: Act,
  ): Promise<ProposalDetail> {
    const context = await this.assembler.contextFor(reader.tenantId, null, null);
    const figures = this.figuresFor(context);
    const wire = {
      minorUnitDigits: figures.money.minorUnitDigits,
      seesCost: rightsOf(reader.roles).seesCost,
    };
    const { fields } = body;
    if (fields !== undefined) {
      for (const [path, amount] of amountsTyped(fields)) {
        minorUnitsOnField(amount, wire.minorUnitDigits, path);
      }
      refuseTooManyBrands(fields.components);
    }
    const bill = body.deal?.monthlyBill;
    if (bill != null) minorUnitsOnField(bill, wire.minorUnitDigits, 'deal.monthlyBill');
    const change: DraftChange = {
      ...(fields === undefined
        ? {}
        : { fields: (stored: ProposalFieldSet) => fieldSetWithEdit(stored, fields, wire) }),
      ...(body.deal === undefined ? {} : { deal: body.deal }),
      ...(body.quickMode === undefined ? {} : { quickMode: body.quickMode }),
    };
    return this.committed(reader, proposalId, body.revision, change, body.capturedAt, act, figures);
  }

  /**
   * Step 4's fill (`M06-10`, `T-M06-033`): the yield for the site's point from the source of record,
   * or the built-in estimate when it does not answer; `reset` also drops the person's own figures.
   */
  async fillEnergy(
    reader: LeadReader,
    proposalId: string,
    body: {
      readonly revision: number;
      readonly mode: 'fill' | 'reset';
      readonly capturedAt: string;
    },
    act: Act,
  ): Promise<ProposalDetail> {
    const context = await this.assembler.contextFor(reader.tenantId, null, null);
    const facts = await this.reads.facts(reader, proposalId, context.pack.formats);
    if (facts === null) throw new NotFoundException('No such proposal.');
    const site = facts.deal.deal.area;
    const filled = site === null ? null : await this.energy.yieldFor(context.pack, site);
    if (filled === null) {
      throw new ContractException(
        'DOMAIN_RULE_VIOLATION',
        site === null
          ? 'Pick where the system goes first: the estimate is for that place.'
          : 'No estimate is held for that place.',
        HttpStatus.UNPROCESSABLE_ENTITY,
        [{ path: 'deal.area', issue: site === null ? 'missing' : 'no_estimate' }],
      );
    }
    const change: DraftChange = {
      fields: (stored) => ({
        ...stored,
        performance: {
          ...stored.performance,
          ...filled,
          ...(body.mode === 'reset' ? { editedMonthlyKwh: null, editedAtCapacityKw: null } : {}),
        },
      }),
    };
    const figures = this.figuresFor(context);
    return this.committed(reader, proposalId, body.revision, change, body.capturedAt, act, figures);
  }

  /** *Reset*: the timeline or the payment plan takes the company's template in force again (`M06-12`, `M06-13`). */
  async resetStep(
    reader: LeadReader,
    proposalId: string,
    body: {
      readonly revision: number;
      readonly step: 'timeline' | 'payment';
      readonly capturedAt: string;
    },
    act: Act,
  ): Promise<ProposalDetail> {
    const pack = await this.settings.packOf(reader.tenantId);
    const facts = await this.reads.facts(reader, proposalId, pack.formats);
    if (facts === null) throw new NotFoundException('No such proposal.');
    // The template is read in the document's language, as it was when the draft was filled.
    const context = await this.assembler.contextFor(
      reader.tenantId,
      facts.deal.preferredLanguage,
      facts.owner,
    );
    const { inForce } = context.settings;
    const change: DraftChange = {
      fields: (stored) =>
        body.step === 'timeline'
          ? { ...stored, timeline: timelineFromTemplate(inForce.timelineTemplate.value.phases) }
          : { ...stored, payment: paymentFromTemplate(inForce.defaultTrancheTemplate.value) },
    };
    const figures = this.figuresFor(context);
    return this.committed(reader, proposalId, body.revision, change, body.capturedAt, act, figures);
  }

  /** Discards a draft never generated; a generated proposal is withdrawn instead. */
  async discard(reader: LeadReader, proposalId: string): Promise<void> {
    const outcome = await this.drafts.discard(reader, proposalId);
    if (outcome === 'not-found') throw new NotFoundException('No such proposal.');
    if (outcome === 'already-generated') throw refusedAct('already_generated');
  }

  private async committed(
    reader: LeadReader,
    proposalId: string,
    revision: number,
    change: DraftChange,
    capturedAt: string,
    act: Act,
    figures: DraftFigures,
  ): Promise<ProposalDetail> {
    const outcome = await this.drafts.commit(
      reader,
      proposalId,
      revision,
      change,
      new Date(capturedAt),
      act,
      figures,
    );
    if (outcome.outcome === 'not-found') throw new NotFoundException('No such proposal.');
    if (outcome.outcome === 'stale' || outcome.outcome === 'lead-moved') throw conflictOf(outcome);
    return this.detail(reader, proposalId);
  }

  /** The server's own figures for a field set on its lead — what a commit stores beside it. */
  private figuresFor(context: AssemblyContext): DraftFigures {
    const { formats } = context.pack;
    return {
      money: { currencyCode: formats.currency, minorUnitDigits: formats.minorUnitDigits },
      formats,
      figuresOf: (fields, deal) => {
        const { money } = this.assembler.document(context, fields, deal, nobody);
        return { payable: money?.payable ?? null, discount: money?.discount ?? null };
      },
    };
  }
}
