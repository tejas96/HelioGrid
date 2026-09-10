import type {
  ProposalTemplate,
  TimelineTemplate,
  TrancheTemplate as TrancheTemplateWire,
  TrancheTemplateWrite,
} from '@heliogrid/contracts';
import {
  allocationVerdict,
  basisPointsToPercent,
  sectionsIncluded,
  type TrancheTemplateContent,
} from '@heliogrid/domain';
import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { ContractException } from '../../common/errors/contract-exception';
import {
  perLanguageWire,
  richTextWire,
  timelineWire,
  trancheLineFromWire,
  trancheTemplateWire,
} from './internal/wire';
import { SettingsService } from './settings.service';
import { SettingsTemplatesRepository } from './settings.templates.repository';
import { SettingsTranchesRepository, type TemplateOutcome } from './settings.tranches.repository';

/**
 * The document templates (`M01-51`, `M01-52`, `M01-54`): the proposal and timeline templates,
 * and the payment-term templates with the one sum rule. The verdict is domain's; a refusal
 * names what is still unplaced, and nothing is written until the lines are whole.
 */
@Injectable()
export class SettingsTemplatesService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(SettingsTemplatesRepository) private readonly scoped: SettingsTemplatesRepository,
    @Inject(SettingsTranchesRepository) private readonly tranches: SettingsTranchesRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  async proposalTemplate(tenantId: string): Promise<ProposalTemplate> {
    return (await this.settings.effective(tenantId)).proposalTemplate.value;
  }

  /** The terms stay in whatever the list said (`SCR-M01-19`): the set is made whole in domain before it lands. */
  async saveProposalTemplate(
    tenantId: string,
    body: ProposalTemplate,
    act: Act,
  ): Promise<ProposalTemplate> {
    const saved = await this.scoped.saveProposalTemplate(
      tenantId,
      { ...body, sectionsIncluded: sectionsIncluded(body.sectionsIncluded) },
      act,
    );
    return {
      cover: saved.cover,
      sectionsIncluded: [...saved.sectionsIncluded],
      defaultTerms: perLanguageWire(saved.defaultTerms, richTextWire),
    };
  }

  async timelineTemplate(tenantId: string): Promise<TimelineTemplate> {
    return (await this.settings.effective(tenantId)).timelineTemplate.value;
  }

  async saveTimelineTemplate(
    tenantId: string,
    body: TimelineTemplate,
    act: Act,
  ): Promise<TimelineTemplate> {
    return timelineWire(
      (await this.scoped.saveTimelineTemplate(tenantId, body.phases, act)).phases,
    );
  }

  async trancheTemplates(tenantId: string): Promise<{ items: TrancheTemplateWire[] }> {
    return { items: (await this.tranches.trancheTemplates(tenantId)).map(trancheTemplateWire) };
  }

  async createTrancheTemplate(
    tenantId: string,
    body: TrancheTemplateWrite,
    act: Act,
  ): Promise<TrancheTemplateWire> {
    return trancheTemplateWire(
      await this.tranches.createTrancheTemplate(tenantId, wholeContent(body), act),
    );
  }

  async saveTrancheTemplate(
    tenantId: string,
    id: string,
    body: TrancheTemplateWrite,
    act: Act,
  ): Promise<TrancheTemplateWire> {
    return admitted(await this.tranches.saveTrancheTemplate(tenantId, id, wholeContent(body), act));
  }

  async archiveTrancheTemplate(
    tenantId: string,
    id: string,
    act: Act,
  ): Promise<TrancheTemplateWire> {
    return admitted(await this.tranches.archiveTrancheTemplate(tenantId, id, act));
  }

  async makeDefaultTrancheTemplate(
    tenantId: string,
    id: string,
    act: Act,
  ): Promise<TrancheTemplateWire> {
    return admitted(await this.tranches.makeDefaultTrancheTemplate(tenantId, id, act));
  }
}

/** The lines as domain holds them, admitted only when they total the whole (`M01-54`). */
function wholeContent(body: TrancheTemplateWrite): TrancheTemplateContent {
  const lines = body.lines.map(trancheLineFromWire);
  const verdict = allocationVerdict(lines.map((line) => line.share));
  if (verdict.state !== 'met') {
    const remainder = basisPointsToPercent(Math.abs(verdict.remainder));
    throw new ContractException(
      'TRANCHES_NOT_WHOLE',
      verdict.state === 'under'
        ? `${remainder}% is still unallocated.`
        : `${remainder}% over the whole.`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
  return { name: body.name, lines };
}

/** The template a transition produced, or its refusal as the contract declares it. */
function admitted(result: TemplateOutcome): TrancheTemplateWire {
  switch (result.outcome) {
    case 'done':
      return trancheTemplateWire(result.template);
    case 'not-found':
      throw new NotFoundException('That template is not this company’s.');
    case 'archived':
      throw new ConflictException('That template is archived.');
    case 'is-default':
      throw new ConflictException('Make another template the default first.');
  }
}
