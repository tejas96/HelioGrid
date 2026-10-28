import {
  type CreateHeaders,
  type ProposalTemplate,
  type ProposalTemplateRead,
  type TimelineTemplate,
  type TimelineTemplateRead,
  type TrancheSchedulePreview,
  type TrancheSchedulePreviewRequest,
  type TrancheTemplateList,
  type TrancheTemplate as TrancheTemplateWire,
  type TrancheTemplateWrite,
  tenantSettingsContract,
} from '@heliogrid/contracts';
import {
  allocationVerdict,
  type BasisPoints,
  basisPointsToPercent,
  minorUnits,
  percentToBasisPoints,
  sectionsIncluded,
  type TrancheTemplateContent,
} from '@heliogrid/domain';
import {
  minorUnitsToDecimal,
  PREVIEW_CONTRACT_VALUE,
  previewTrancheAmounts,
} from '@heliogrid/domain/server';
import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { ContractException } from '../../common/errors/contract-exception';
import {
  lastSaveWire,
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
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  async proposalTemplate(tenantId: string): Promise<ProposalTemplateRead> {
    const [effective, last] = await Promise.all([
      this.settings.effective(tenantId),
      this.scoped.proposalTemplateLastSave(tenantId),
    ]);
    return { ...effective.proposalTemplate.value, changed: lastSaveWire(last) };
  }

  /** The terms stay in whatever the list said (`SCR-M01-19`): the set is made whole in domain before it lands. */
  async saveProposalTemplate(
    tenantId: string,
    body: ProposalTemplate,
    act: Act,
  ): Promise<ProposalTemplateRead> {
    const saved = await this.scoped.saveProposalTemplate(
      tenantId,
      { ...body, sectionsIncluded: sectionsIncluded(body.sectionsIncluded) },
      act,
    );
    return {
      cover: saved.cover,
      sectionsIncluded: [...saved.sectionsIncluded],
      defaultTerms: perLanguageWire(saved.defaultTerms, richTextWire),
      changed: lastSaveWire(await this.scoped.proposalTemplateLastSave(tenantId)),
    };
  }

  async timelineTemplate(tenantId: string): Promise<TimelineTemplateRead> {
    const [effective, last] = await Promise.all([
      this.settings.effective(tenantId),
      this.scoped.timelineTemplateLastSave(tenantId),
    ]);
    return { ...effective.timelineTemplate.value, changed: lastSaveWire(last) };
  }

  async saveTimelineTemplate(
    tenantId: string,
    body: TimelineTemplate,
    act: Act,
  ): Promise<TimelineTemplateRead> {
    const saved = await this.scoped.saveTimelineTemplate(tenantId, body.phases, act);
    return {
      ...timelineWire(saved.phases),
      changed: lastSaveWire(await this.scoped.timelineTemplateLastSave(tenantId)),
    };
  }

  async trancheTemplates(tenantId: string): Promise<TrancheTemplateList> {
    const { templates, lastSave } = await this.tranches.trancheTemplates(tenantId);
    return { items: templates.map(trancheTemplateWire), lastSaved: lastSaveWire(lastSave) };
  }

  /**
   * The schedule on the sample contract in the tenant's currency (`F4-04`: the server works out
   * every money figure). Writes nothing; refused, as a save is, unless the shares are whole.
   */
  async previewTrancheSchedule(
    tenantId: string,
    body: TrancheSchedulePreviewRequest,
  ): Promise<TrancheSchedulePreview> {
    const shares = wholeShares(body.lines.map((line) => percentToBasisPoints(line.percent)));
    const { currency, minorUnitDigits } = (await this.settings.packOf(tenantId)).formats;
    const contract = minorUnits(PREVIEW_CONTRACT_VALUE * 10 ** minorUnitDigits);
    return {
      currencyCode: currency,
      contract: minorUnitsToDecimal(contract, minorUnitDigits),
      amounts: previewTrancheAmounts(contract, shares).map((amount) =>
        minorUnitsToDecimal(amount, minorUnitDigits),
      ),
    };
  }

  async createTrancheTemplate(
    tenantId: string,
    body: TrancheTemplateWrite,
    headers: CreateHeaders,
    act: Act,
  ): Promise<TrancheTemplateWire> {
    const route = tenantSettingsContract.createTrancheTemplate;
    const key = creationKeyOf(headers, act.actorUserId, route, body);
    const keyed = await this.tranches.createTrancheTemplate(tenantId, wholeContent(body), act, key);
    return trancheTemplateWire(this.replies.rowOf(keyed, route, tenantId));
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

  async restoreTrancheTemplate(
    tenantId: string,
    id: string,
    act: Act,
  ): Promise<TrancheTemplateWire> {
    return admitted(await this.tranches.restoreTrancheTemplate(tenantId, id, act));
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
  wholeShares(lines.map((line) => line.share));
  return { name: body.name, lines };
}

/** The shares, admitted only when they total the whole; the refusal names what is still unplaced. */
function wholeShares(shares: readonly BasisPoints[]): readonly BasisPoints[] {
  const verdict = allocationVerdict(shares);
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
  return shares;
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
