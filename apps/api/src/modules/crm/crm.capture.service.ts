import {
  type CreateHeaders,
  type CreateLead,
  type CustomerMatch,
  type EnquiryLogged,
  type LeadDetail,
  type LogEnquiry,
  leadCaptureContract,
  type OwnerRequest,
  type OwnerRequestSent,
} from '@heliogrid/contracts';
import {
  callBackWindowOf,
  can,
  type FormatPack,
  formatPhone,
  phoneE164Of,
} from '@heliogrid/domain';
import { leadEnquiryNotice } from '@heliogrid/i18n';
import {
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { refusalWithFacts } from '../../common/errors/contract-exception';
import {
  NotificationPushService,
  renderedInEveryLanguage,
} from '../notification/notification.public';
import { SettingsService } from '../settings/settings.public';
import { type CaptureInput, CrmCaptureRepository } from './crm.capture.repository';
import {
  CrmEnquiriesRepository,
  type EnquiryInput,
  type EnquiryNotice,
} from './crm.enquiries.repository';
import { moneyOf } from './internal/lead-wire';
import { marketPhoneOf } from './internal/market-phone';
import type { LeadReader } from './internal/reader';

const notFound = () => new NotFoundException('No such lead or customer.');

/** What a capture typed, with its number read the market's way — refused when it cannot be. */
function enquiryOf(formats: FormatPack, body: LogEnquiry): EnquiryInput {
  return {
    phoneE164: marketPhoneOf(formats, body.phoneE164),
    name: body.name ?? null,
    city: body.city ?? null,
    segment: body.segment ?? null,
    capturedAt: new Date(body.capturedAt),
  };
}

/**
 * Capture (`SCR-M02-01`): the live number check, the quick add, and the dedupe sheet's enquiry
 * answers. The number is the identity, read once the market's way (`M02-02`), and everything the
 * sheet needs travels with its refusal so the screen answers in one round trip.
 */
@Injectable()
export class CrmCaptureService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmCaptureRepository) private readonly captures: CrmCaptureRepository,
    @Inject(CrmEnquiriesRepository) private readonly enquiries: CrmEnquiriesRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(NotificationPushService) private readonly push: NotificationPushService,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  /** A number no market spelling makes whole belongs to nobody yet. */
  async match(reader: LeadReader, typed: string): Promise<CustomerMatch> {
    const { formats } = await this.settings.packOf(reader.tenantId);
    const phone = phoneE164Of(formats, typed);
    return { match: phone === null ? null : await this.captures.match(reader, phone) };
  }

  async create(
    reader: LeadReader,
    body: CreateLead,
    headers: CreateHeaders,
    act: Act,
  ): Promise<LeadDetail> {
    if (body.keepBoth !== undefined && !can(reader.roles, 'crm.dedupe_override')) {
      throw new ForbiddenException('Keeping both records needs the dedupe override.');
    }
    const { formats, callingRules } = await this.settings.packOf(reader.tenantId);
    const route = leadCaptureContract.create;
    const input: CaptureInput = {
      ...enquiryOf(formats, body),
      referrerId: body.referredBy?.customerId ?? null,
      referredByName: body.referredBy?.name ?? null,
      keepBoth: body.keepBoth ?? null,
    };
    const key = creationKeyOf(headers, act.actorUserId, route, body);
    const callBackWindow = callBackWindowOf(callingRules, null);
    const money = moneyOf(formats);
    const outcome = await this.captures.create(reader, input, money, act, key, callBackWindow);
    if (outcome.outcome === 'not-found') throw notFound();
    if (outcome.outcome === 'duplicate') {
      throw refusalWithFacts(route.responses[409], HttpStatus.CONFLICT, {
        code: 'DUPLICATE_PHONE',
        message: 'This number already belongs to a customer.',
        facts: outcome.facts,
      });
    }
    return this.replies.rowOf(outcome, route, reader.tenantId);
  }

  /**
   * Log enquiry on existing (`M02-11`): one entry on the lead, and its owner told — the lead as it
   * stands, or only which and when for a lead outside the reader's scope (`M02-08`).
   */
  async logEnquiry(
    reader: LeadReader,
    askerName: string,
    leadId: string,
    body: LogEnquiry,
    headers: CreateHeaders,
    act: Act,
  ): Promise<LeadDetail | EnquiryLogged> {
    const route = leadCaptureContract.logEnquiry;
    const pack = await this.settings.packOf(reader.tenantId);
    const enquiry = enquiryOf(pack.formats, body);
    const notice = await this.noticeOf(reader.tenantId, pack.formats, leadId, askerName, false);
    const key = creationKeyOf(headers, act.actorUserId, route, { leadId, ...body });
    const { answer, notified } = await this.enquiries.logEnquiry(
      reader,
      leadId,
      enquiry,
      notice,
      moneyOf(pack.formats),
      act,
      key,
    );
    if (answer.outcome === 'not-found') throw notFound();
    await this.push.deliverAfterCommit(reader.tenantId, notified, new Date(act.now));
    return this.replies.rowOf(answer, route, reader.tenantId);
  }

  /** Open existing outside the reader's scope (`M02-08`): an enquiry naming them, to the owner. */
  async askOwner(
    reader: LeadReader,
    askerName: string,
    leadId: string,
    body: OwnerRequest,
    headers: CreateHeaders,
    act: Act,
  ): Promise<OwnerRequestSent> {
    const route = leadCaptureContract.askOwner;
    const { formats } = await this.settings.packOf(reader.tenantId);
    const enquiry = enquiryOf(formats, body);
    const notice = await this.noticeOf(reader.tenantId, formats, leadId, askerName, true);
    const key = creationKeyOf(headers, act.actorUserId, route, { leadId, ...body });
    const asker = { userId: act.actorUserId, name: askerName };
    const { answer, notified } = await this.enquiries.askOwner(
      reader,
      asker,
      leadId,
      enquiry,
      notice,
      act,
      key,
    );
    if (answer.outcome === 'not-found') throw notFound();
    await this.push.deliverAfterCommit(reader.tenantId, notified, new Date(act.now));
    return this.replies.rowOf(answer, route, reader.tenantId);
  }

  /**
   * The `lead_enquiry` words in every language, rendered before the write holds its locks: the
   * lead as it reads in a list — its name, or its number while it has none (`M02-03`).
   */
  private async noticeOf(
    tenantId: string,
    formats: FormatPack,
    leadId: string,
    asker: string,
    asked: boolean,
  ): Promise<EnquiryNotice> {
    const facts = await this.enquiries.noticeFactsOf(tenantId, leadId);
    if (facts === null) throw notFound();
    const name = facts.name ?? formatPhone(formats, facts.phoneE164);
    return {
      wordsIn: await renderedInEveryLanguage((translate) =>
        leadEnquiryNotice(translate, { name, asker, asked }),
      ),
      quietHours: await this.settings.quietHoursOf(tenantId),
    };
  }
}
