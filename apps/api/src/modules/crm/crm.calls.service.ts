import {
  type AddNote,
  type CreateHeaders,
  type LeadDetail,
  type LogCall,
  leadCallsContract,
} from '@heliogrid/contracts';
import { callBackWindowOf } from '@heliogrid/domain';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { SettingsService } from '../settings/settings.public';
import { CrmCallsRepository, type LeadWorkOutcome } from './crm.calls.repository';
import { moneyOf } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

/**
 * Calls and notes on a lead (`M02-35`, `M02-43`, T-M02-010): the attempt log and its one retry,
 * held to the market's calling window on the tenant's clock (`M02-15`). Nothing is handed to the
 * voice agent: the lead shows its failed tries until voice returns (owner ruling 2026-11-09).
 */
@Injectable()
export class CrmCallsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmCallsRepository) private readonly calls: CrmCallsRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  async logCall(
    reader: LeadReader,
    leadId: string,
    body: LogCall,
    headers: CreateHeaders,
    act: Act,
  ): Promise<LeadDetail> {
    const route = leadCallsContract.logCall;
    const pack = await this.settings.packOf(reader.tenantId);
    const key = creationKeyOf(headers, act.actorUserId, route, { leadId, ...body });
    const call = {
      outcome: body.outcome,
      note: body.note ?? null,
      capturedAt: new Date(body.capturedAt),
    };
    const window = callBackWindowOf(pack.callingRules, null);
    const money = moneyOf(pack.formats);
    const outcome = await this.calls.logCall(reader, leadId, call, window, money, act, key);
    return this.answerOf(outcome, route, reader.tenantId);
  }

  async addNote(
    reader: LeadReader,
    leadId: string,
    body: AddNote,
    headers: CreateHeaders,
    act: Act,
  ): Promise<LeadDetail> {
    const route = leadCallsContract.addNote;
    const money = moneyOf((await this.settings.packOf(reader.tenantId)).formats);
    const key = creationKeyOf(headers, act.actorUserId, route, { leadId, ...body });
    const note = { text: body.text, capturedAt: new Date(body.capturedAt) };
    const outcome = await this.calls.addNote(reader, leadId, note, money, act, key);
    return this.answerOf(outcome, route, reader.tenantId);
  }

  private answerOf(
    outcome: LeadWorkOutcome,
    route: (typeof leadCallsContract)[keyof typeof leadCallsContract],
    tenantId: string,
  ): LeadDetail {
    if (outcome.outcome === 'not-found') throw new NotFoundException('No such lead.');
    return this.replies.rowOf(outcome, route, tenantId);
  }
}
