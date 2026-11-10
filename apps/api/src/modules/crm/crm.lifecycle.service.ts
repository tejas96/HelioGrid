import {
  type DisqualifyLead,
  LEAD_TRANSITION_REFUSED,
  type LeadAct,
  type LeadDetail,
  leadLifecycleContract,
  type SnoozeLead,
} from '@heliogrid/contracts';
import { disqualify, junk, markQualified, reopen, snooze, wakeNow } from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { refusalWithFacts } from '../../common/errors/contract-exception';
import { SettingsService } from '../settings/settings.public';
import {
  blockWrongNumber,
  CrmLifecycleRepository,
  type LeadActPlan,
} from './crm.lifecycle.repository';
import { moneyOf } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

/**
 * The lead's life after capture (`M02-45`, `M02-49`…`M02-56`, T-M02-015): each act is domain's
 * decision on the locked lead, and a move the machine does not allow from where the lead stands is
 * refused with domain's reason (`F4-16`) — stage and state stay two fields throughout.
 */
@Injectable()
export class CrmLifecycleService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmLifecycleRepository) private readonly lifecycle: CrmLifecycleRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  /** *Mark qualified* (`M02-45`): the six answers inform, a person decides. */
  markQualified(reader: LeadReader, leadId: string, body: LeadAct, act: Act) {
    return this.run(reader, leadId, body, act, { decide: (lead) => markQualified(lead) });
  }

  /** Snooze to a date after today (`M02-51`); the lead wakes at 09:00 tenant time that day. */
  snooze(reader: LeadReader, leadId: string, body: SnoozeLead, act: Act) {
    return this.run(reader, leadId, body, act, {
      decide: (lead, context) => snooze(lead, body.wakeOn, context.today),
    });
  }

  /** *Wake up now* (`M02-51`): back to its stage at once, with no task raised for the waker. */
  wake(reader: LeadReader, leadId: string, body: LeadAct, act: Act) {
    return this.run(reader, leadId, body, act, { decide: (lead) => wakeNow(lead) });
  }

  /** Disqualify with one of the six (`M02-42`, `M02-53`); a wrong number blocks every dial (`M02-44`). */
  disqualify(reader: LeadReader, leadId: string, body: DisqualifyLead, act: Act) {
    return this.run(reader, leadId, body, act, {
      decide: (lead, context) => disqualify(lead, body.reason, context),
      ...(body.reason === 'wrong_number' && { follows: blockWrongNumber }),
    });
  }

  /** Junk (`M02-55`): out of every queue, found by search alone, never deleted. */
  junk(reader: LeadReader, leadId: string, body: LeadAct, act: Act) {
    return this.run(reader, leadId, body, act, { decide: (lead, context) => junk(lead, context) });
  }

  /** Reopen (`M02-56`): back at its stage, the close kept, the reopen counted. */
  reopen(reader: LeadReader, leadId: string, body: LeadAct, act: Act) {
    return this.run(reader, leadId, body, act, { decide: (lead) => reopen(lead) });
  }

  private async run(
    reader: LeadReader,
    leadId: string,
    body: LeadAct,
    act: Act,
    plan: LeadActPlan,
  ): Promise<LeadDetail> {
    const money = moneyOf((await this.settings.packOf(reader.tenantId)).formats);
    const capturedAt = new Date(body.capturedAt);
    const outcome = await this.lifecycle.act(reader, leadId, plan, capturedAt, money, act);
    if (outcome.outcome === 'not-found') throw new NotFoundException('No such lead.');
    if (outcome.outcome === 'refused') {
      throw refusalWithFacts(
        leadLifecycleContract.snooze.responses[422],
        HttpStatus.UNPROCESSABLE_ENTITY,
        {
          code: LEAD_TRANSITION_REFUSED,
          message: 'The lead cannot make that move from where it stands.',
          facts: { refusal: outcome.refusal },
        },
      );
    }
    return outcome.detail;
  }
}
