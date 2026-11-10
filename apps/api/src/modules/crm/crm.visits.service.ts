import {
  type BookVisit,
  type CreateHeaders,
  LEAD_TRANSITION_REFUSED,
  type LeadDetail,
  type RescheduleVisit,
  type VisitSurveyors,
  visitsContract,
} from '@heliogrid/contracts';
import { clockTime } from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { ContractException, refusalWithFacts } from '../../common/errors/contract-exception';
import { SettingsService } from '../settings/settings.public';
import { CrmVisitsRepository, type VisitOutcome, type VisitSlot } from './crm.visits.repository';
import { moneyOf } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

type VisitRoute = (typeof visitsContract)['book' | 'reschedule'];

/** The slot as sent: the date and time on the tenant's clock, the surveyor, the address. */
function slotOf(body: RescheduleVisit): VisitSlot {
  return {
    date: body.date,
    time: clockTime(body.time),
    surveyorId: body.surveyorId ?? null,
    address: body.address ?? null,
    capturedAt: new Date(body.capturedAt),
  };
}

/**
 * Booking the site visit (`M02-46`…`M02-48`, T-M02-014): date, time, surveyor and the confirmed
 * address, the lead moved to `survey`, and a no-show rescheduled into one successor. The visit's
 * confirmation and its one reminder are composed as text (`crm.messages.service.ts`).
 */
@Injectable()
export class CrmVisitsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmVisitsRepository) private readonly visits: CrmVisitsRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  /** Who Book visit offers: the members a booking accepts as its surveyor. */
  async surveyors(tenantId: string): Promise<VisitSurveyors> {
    return { items: await this.visits.surveyors(tenantId) };
  }

  async book(
    reader: LeadReader,
    leadId: string,
    body: BookVisit,
    headers: CreateHeaders,
    act: Act,
  ): Promise<LeadDetail> {
    const route = visitsContract.book;
    const money = moneyOf((await this.settings.packOf(reader.tenantId)).formats);
    const key = creationKeyOf(headers, act.actorUserId, route, { leadId, ...body });
    const outcome = await this.visits.book(reader, leadId, slotOf(body), money, act, key);
    return this.answerOf(outcome, route, reader.tenantId);
  }

  async reschedule(
    reader: LeadReader,
    visitId: string,
    body: RescheduleVisit,
    headers: CreateHeaders,
    act: Act,
  ): Promise<LeadDetail> {
    const route = visitsContract.reschedule;
    const money = moneyOf((await this.settings.packOf(reader.tenantId)).formats);
    const key = creationKeyOf(headers, act.actorUserId, route, { visitId, ...body });
    const outcome = await this.visits.reschedule(reader, visitId, slotOf(body), money, act, key);
    return this.answerOf(outcome, route, reader.tenantId);
  }

  private answerOf(outcome: VisitOutcome, route: VisitRoute, tenantId: string): LeadDetail {
    switch (outcome.outcome) {
      case 'not-found':
        throw new NotFoundException('No such lead or visit.');
      case 'already-booked':
        throw new ContractException(
          'VISIT_ALREADY_BOOKED',
          'This lead already has a visit booked; reschedule it instead.',
          HttpStatus.CONFLICT,
        );
      case 'already-rescheduled':
        throw new ContractException(
          'VISIT_ALREADY_RESCHEDULED',
          'This visit was already rescheduled.',
          HttpStatus.CONFLICT,
        );
      case 'surveyor-unavailable':
        throw new ContractException(
          'SURVEYOR_UNAVAILABLE',
          'That person cannot take a survey visit.',
          HttpStatus.UNPROCESSABLE_ENTITY,
          [{ path: 'surveyorId', issue: 'an active member who holds survey' }],
        );
      case 'refused':
        throw refusalWithFacts(
          visitsContract.book.responses[422].options[0],
          HttpStatus.UNPROCESSABLE_ENTITY,
          {
            code: LEAD_TRANSITION_REFUSED,
            message: 'A closed lead takes no visit until it is reopened.',
            facts: { refusal: outcome.refusal },
          },
        );
      default:
        return this.replies.rowOf(outcome, route, tenantId);
    }
  }
}
