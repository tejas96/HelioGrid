import {
  type Assignees,
  type AssignLead,
  type BulkAssign,
  type BulkAssigned,
  type LeadDetail,
  leadAssignContract,
  leadTransitionRefusedEnvelope,
} from '@heliogrid/contracts';
import { type FormatPack, formatPhone } from '@heliogrid/domain';
import { leadAssignedNotice } from '@heliogrid/i18n';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { ContractException, refusalWithFacts } from '../../common/errors/contract-exception';
import {
  NotificationPushService,
  renderedInEveryLanguage,
} from '../notification/notification.public';
import { SettingsService } from '../settings/settings.public';
import { CrmAssignRepository } from './crm.assign.repository';
import type { AssignNotice } from './crm.assignment.repository';
import { moneyOf } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

const assigneeUnavailable = () =>
  new ContractException(
    'ASSIGNEE_UNAVAILABLE',
    'This person cannot hold leads.',
    HttpStatus.UNPROCESSABLE_ENTITY,
    [{ path: 'assigneeId', issue: 'an active member who adds and edits leads' }],
  );

/**
 * Assignment (`M02-27`…`M02-31`): the picker's people with their load, the one-tap assign that
 * loses a race honestly (`M02-67`), and a selection to one person. Every assignment is recorded
 * with the assignee's load at that moment, and the new owner is told once per act.
 */
@Injectable()
export class CrmAssignService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmAssignRepository) private readonly assigns: CrmAssignRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(NotificationPushService) private readonly push: NotificationPushService,
  ) {}

  async assignees(tenantId: string, now: number): Promise<Assignees> {
    return { items: await this.assigns.assignees(tenantId, new Date(now)) };
  }

  async assign(
    reader: LeadReader,
    assignerName: string,
    leadId: string,
    body: AssignLead,
    act: Act,
  ): Promise<LeadDetail> {
    const { formats } = await this.settings.packOf(reader.tenantId);
    const notice = await this.noticeOf(reader.tenantId, formats, assignerName);
    const order = { ...body, reason: body.reason ?? null };
    const outcome = await this.assigns.assign(reader, leadId, order, notice, moneyOf(formats), act);
    switch (outcome.outcome) {
      case 'not-found':
        throw new NotFoundException('No such lead.');
      case 'assignee-unavailable':
        throw assigneeUnavailable();
      case 'already-assigned':
        throw refusalWithFacts(leadAssignContract.assign.responses[409], HttpStatus.CONFLICT, {
          code: 'LEAD_ALREADY_ASSIGNED',
          message: 'Someone assigned this lead first.',
          facts: { owner: outcome.owner },
        });
      case 'refused':
        throw refusalWithFacts(leadTransitionRefusedEnvelope, HttpStatus.UNPROCESSABLE_ENTITY, {
          code: 'LEAD_TRANSITION_REFUSED',
          message: 'This lead is closed. Reopen it first.',
          facts: { refusal: outcome.refusal },
        });
      case 'assigned':
        await this.push.deliverAfterCommit(reader.tenantId, outcome.notified, new Date(act.now));
        return outcome.detail;
    }
  }

  async bulkAssign(
    reader: LeadReader,
    assignerName: string,
    body: BulkAssign,
    act: Act,
  ): Promise<BulkAssigned> {
    const { formats } = await this.settings.packOf(reader.tenantId);
    const notice = await this.noticeOf(reader.tenantId, formats, assignerName);
    const order = { ...body, reason: body.reason ?? null };
    const outcome = await this.assigns.bulkAssign(reader, order, notice, act);
    switch (outcome.outcome) {
      case 'assignee-unavailable':
        throw assigneeUnavailable();
      case 'done':
        await this.push.deliverAfterCommit(reader.tenantId, outcome.notified, new Date(act.now));
        return { results: outcome.results };
    }
  }

  /**
   * The `lead_assigned` notice: the push's clock, read before the write, and its words in every
   * language once the write knows what it gave — one lead as it reads in a list (its name, or its
   * number while it has none, `M02-03`), or how many.
   */
  private async noticeOf(
    tenantId: string,
    formats: FormatPack,
    assigner: string,
  ): Promise<AssignNotice> {
    return {
      wordsFor: (given) =>
        renderedInEveryLanguage((translate) =>
          leadAssignedNotice(
            translate,
            'count' in given
              ? { assigner, count: given.count }
              : { assigner, name: given.name ?? formatPhone(formats, given.phoneE164) },
          ),
        ),
      quietHours: await this.settings.quietHoursOf(tenantId),
    };
  }
}
