import {
  type CreateHeaders,
  type GenerateProposal,
  PROPOSAL_NOT_READY,
  type ProposalDetail,
  proposalNotReadyEnvelope,
  proposalsContract,
} from '@heliogrid/contracts';
import { type InputPins, type MarketPack, PROPOSAL_ENGINES } from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { ContractException, refusalWithFacts } from '../../common/errors/contract-exception';
import { EntitlementBlockedException } from '../../common/errors/entitlement-blocked';
import { BillingUsageService } from '../billing/billing.public';
import type { LeadReader } from '../crm/crm.public';
import { verdictWire } from './internal/document-wire';
import { ProposalsAssembler, rightsOf } from './proposals.assembler.service';
import { ProposalsGenerateRepository } from './proposals.generate.repository';
import { ProposalsReadRepository } from './proposals.read.repository';
import { conflictOf, ProposalsService, refusedAct } from './proposals.service';

/** What a version records of what it was computed from (`F8-14`): the pack's keys it read, and the engine. */
export function pinsOf(pack: MarketPack): InputPins {
  return {
    marketPack: {
      version: pack.version,
      keysRead: ['tax', 'subsidy', 'certificationSchemes', 'formats'],
    },
    engines: PROPOSAL_ENGINES,
  };
}

/**
 * Generate (`M06-22`, `M06-23`, `M06-36`, `M06-37`): every check the proposal enforces, once, as
 * one list — the same from Quick mode, a duplicate and the full rail — then a version frozen whole
 * with the proposal's number. A retry of the same send answers the version the first made.
 */
@Injectable()
export class ProposalsGenerateService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProposalsGenerateRepository) private readonly versions: ProposalsGenerateRepository,
    @Inject(ProposalsReadRepository) private readonly reads: ProposalsReadRepository,
    @Inject(ProposalsAssembler) private readonly assembler: ProposalsAssembler,
    @Inject(ProposalsService) private readonly proposals: ProposalsService,
    @Inject(BillingUsageService) private readonly usage: BillingUsageService,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  async generate(
    reader: LeadReader,
    proposalId: string,
    body: GenerateProposal,
    headers: CreateHeaders,
    act: Act,
  ): Promise<{ proposal: ProposalDetail; number: string; version: number }> {
    const route = proposalsContract.generate;
    const key = creationKeyOf(headers, act.actorUserId, route, { proposalId, ...body });
    const { tenantId } = reader;
    const base = await this.assembler.contextFor(tenantId, null, null);
    const facts = await this.reads.facts(reader, proposalId, base.pack.formats);
    if (facts === null) throw new NotFoundException('No such proposal.');
    // The document's words are frozen in the customer's language, with the company's own number.
    const context = await this.assembler.contextFor(
      tenantId,
      facts.deal.preferredLanguage,
      facts.owner,
    );
    const { formats } = context.pack;
    const { seesCost } = rightsOf(reader.roles);
    const outcome = await this.versions.generate(
      reader,
      proposalId,
      {
        revision: body.revision,
        changeNote: body.changeNote,
        belowCostConfirmed: body.belowCostConfirmed,
        capturedAt: new Date(body.capturedAt),
      },
      key,
      act,
      {
        money: { currencyCode: formats.currency, minorUnitDigits: formats.minorUnitDigits },
        formats,
        allowance: await this.usage.proposalAllowance(tenantId, act.now),
        pins: pinsOf(context.pack),
        freeze: (fields, deal, by) => {
          // `null` freshness: a version's figures are a record, never recomputed (`F8-15`).
          const document = this.assembler.document(context, fields, deal.deal, by, null);
          return { document, verdict: this.assembler.verdict(context, document, seesCost) };
        },
      },
    );
    switch (outcome.outcome) {
      case 'done':
      case 'replayed':
      case 'key-reused': {
        const made = this.replies.rowOf(
          outcome.outcome === 'key-reused'
            ? outcome
            : { outcome: outcome.outcome === 'done' ? 'created' : 'replayed', row: outcome },
          route,
          tenantId,
        );
        return {
          proposal: await this.proposals.detail(reader, proposalId),
          number: made.number,
          version: made.version,
        };
      }
      case 'not-found':
        throw new NotFoundException('No such proposal.');
      case 'stale':
        throw conflictOf(outcome);
      case 'refused':
        throw refusedAct(outcome.refusal);
      case 'note-missing':
        throw new ContractException(
          'VALIDATION_FAILED',
          'Say what changed and why: a new version carries its note.',
          HttpStatus.BAD_REQUEST,
          [{ path: 'changeNote', issue: 'required_from_version_2' }],
        );
      case 'over-limit':
        throw new EntitlementBlockedException({
          reason: 'cap',
          capability: 'sell_and_deliver',
          key: 'proposals_per_cycle',
          resetsAt: outcome.resetsAt.toISOString(),
          used: outcome.used,
          limit: outcome.limit,
        });
      case 'not-ready':
        throw refusalWithFacts(proposalNotReadyEnvelope, HttpStatus.UNPROCESSABLE_ENTITY, {
          code: PROPOSAL_NOT_READY,
          message: 'Fix what the check lists, then generate.',
          facts: { verdict: verdictWire(outcome.verdict, formats.minorUnitDigits) },
        });
    }
  }
}
