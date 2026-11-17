import {
  type CreateDesign,
  type CreateHeaders,
  DESIGN_ACT_REFUSED,
  type DesignDetail,
  type DesignSet,
  designActRefusedEnvelope,
  type SaveSite,
  studioContract,
} from '@heliogrid/contracts';
import { can, type DesignActRefusal } from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { type ContractException, refusalWithFacts } from '../../common/errors/contract-exception';
import { type LeadReader, moneyOf } from '../crm/crm.public';
import { SettingsService } from '../settings/settings.public';
import { designDetailOf, designWireOf } from './internal/design-wire';
import { StudioRepository } from './studio.repository';
import { StudioWritesRepository } from './studio.writes.repository';

const DESIGN = 'studio.create_edit_designs' as const;

/** A refusal the design's lead gave, as the route declares it. */
function refusedAct(refusal: DesignActRefusal): ContractException {
  return refusalWithFacts(designActRefusedEnvelope, HttpStatus.UNPROCESSABLE_ENTITY, {
    code: DESIGN_ACT_REFUSED,
    message: 'The design cannot do that from where its lead stands.',
    facts: { refusal },
  });
}

/**
 * The studio's designs as HelioGrid hosts them: made on a lead, read by whoever may read that
 * lead, changed by whoever holds the create-and-edit grant. The site a design is for is the lead's.
 */
@Injectable()
export class StudioService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(StudioRepository) private readonly designs: StudioRepository,
    @Inject(StudioWritesRepository) private readonly writes: StudioWritesRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  /** The lead's designs; 404 where the lead is not the reader's to see. */
  async designsOf(reader: LeadReader, leadId: string): Promise<DesignSet> {
    const rows = await this.designs.designsOf(reader, leadId);
    if (rows === null) throw new NotFoundException('No such lead.');
    return { designs: rows.map(designWireOf), canDesign: can(reader.roles, DESIGN) };
  }

  /** One design opened; 404 where its lead is not the reader's to see. */
  async detail(reader: LeadReader, designId: string): Promise<DesignDetail> {
    const facts = await this.designs.factsOf(reader, designId);
    if (facts === null) throw new NotFoundException('No such design.');
    return designDetailOf(facts, can(reader.roles, DESIGN));
  }

  /** The lead's next design, or the one an earlier send with the same retry key made. */
  async create(
    reader: LeadReader,
    leadId: string,
    body: CreateDesign,
    headers: CreateHeaders,
    act: Act,
  ): Promise<DesignDetail> {
    const route = studioContract.create;
    const key = creationKeyOf(headers, act.actorUserId, route, { leadId, ...body });
    const outcome = await this.writes.create(reader, leadId, body, key, act);
    switch (outcome.outcome) {
      case 'not-found':
        throw new NotFoundException('No such lead.');
      case 'copy-not-found':
        throw new NotFoundException('No such design to copy.');
      case 'refused':
        throw refusedAct(outcome.refusal);
      default:
        return this.detail(reader, this.replies.rowOf(outcome, route, reader.tenantId));
    }
  }

  /** Site details saved whole, on the lead that holds the site and on the design. */
  async saveSite(
    reader: LeadReader,
    designId: string,
    body: SaveSite,
    act: Act,
  ): Promise<DesignDetail> {
    const pack = await this.settings.packOf(reader.tenantId);
    const outcome = await this.writes.saveSite(reader, designId, body, moneyOf(pack.formats), act);
    if (outcome.outcome === 'not-found') throw new NotFoundException('No such design.');
    if (outcome.outcome === 'refused') throw refusedAct(outcome.refusal);
    return this.detail(reader, designId);
  }

  /** The recommended mark set or taken off, answered with the lead's designs as they now stand. */
  async recommend(reader: LeadReader, designId: string, recommended: boolean): Promise<DesignSet> {
    const leadId = await this.writes.recommend(reader, designId, recommended);
    if (leadId === null) throw new NotFoundException('No such design.');
    return this.designsOf(reader, leadId);
  }
}
