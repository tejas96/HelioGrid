import {
  type ComposedMessageWire,
  type ComposeMessage,
  type CreateHeaders,
  leadMessagesContract,
} from '@heliogrid/contracts';
import {
  composeMessage,
  type FormatPack,
  formatDate,
  formatPhone,
  formatTime,
} from '@heliogrid/domain';
import { createTranslator, crmMessageTemplate } from '@heliogrid/i18n';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { SettingsService } from '../settings/settings.public';
import { CrmMessagesRepository, type MessageFacts } from './crm.messages.repository';
import type { LeadReader } from './internal/reader';

/**
 * Customer messages as copy-paste text (`M02-33`, `M02-47`, `M02-48`, T-M02-013): the message's
 * words in the language the customer reads, filled with this lead's facts — what, when, who is
 * coming and their number — and handed back to be sent from the person's own phone. Nothing is
 * sent, so nothing claims a delivery.
 */
@Injectable()
export class CrmMessagesService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmMessagesRepository) private readonly messages: CrmMessagesRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  async compose(
    reader: LeadReader,
    leadId: string,
    body: ComposeMessage,
    headers: CreateHeaders,
    act: Act,
  ): Promise<ComposedMessageWire> {
    const route = leadMessagesContract.compose;
    const key = creationKeyOf(headers, act.actorUserId, route, { leadId, ...body });
    const request = {
      templateKey: body.templateKey,
      visitId: body.visitId ?? null,
      capturedAt: new Date(body.capturedAt),
    };
    const outcome = await this.messages.compose(reader, leadId, request, act, key);
    if (outcome.outcome === 'not-found') throw new NotFoundException('No such lead or visit.');
    const facts = this.replies.rowOf(outcome, route, reader.tenantId);
    const { formats } = await this.settings.packOf(reader.tenantId);
    return { text: await textOf(facts, formats) };
  }
}

/** The message's words filled with its facts; a fact the lead lacks is left out cleanly. */
async function textOf(facts: MessageFacts, formats: FormatPack): Promise<string> {
  const { t } = await createTranslator(facts.language);
  const visit = facts.visit;
  const values = {
    customer: facts.customerName ?? undefined,
    company: facts.companyName,
    sender: facts.sender.name ?? undefined,
    senderPhone: formatPhone(formats, facts.sender.phoneE164),
    ...(visit !== null && {
      date: formatDate(formats, visit.date, facts.language),
      time: formatTime(formats, visit.time),
      surveyor: visit.surveyor.name ?? undefined,
      surveyorPhone: formatPhone(formats, visit.surveyor.phoneE164),
      address: visit.address,
    }),
  };
  return composeMessage(crmMessageTemplate(t, facts.templateKey), values).text;
}
