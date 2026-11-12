import {
  type CreateHeaders,
  LEAD_TRANSITION_REFUSED,
  leadTransitionRefusedEnvelope,
  type MarkWon,
  projectActsContract,
} from '@heliogrid/contracts';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { ContractException, refusalWithFacts } from '../../common/errors/contract-exception';
import { EntitlementBlockedException } from '../../common/errors/entitlement-blocked';
import { minorUnitsOnField } from '../../common/errors/minor-units-on-field';
import { EntitlementService } from '../billing/billing.public';
import type { LeadReader } from '../crm/crm.public';
import { NotificationPushService } from '../notification/notification.public';
import { SettingsService } from '../settings/settings.public';
import { ProjectsPaymentWordsService } from './projects.payment-words.service';
import { ProjectsWonRepository } from './projects.won.repository';

/**
 * *Mark won* (`M07-62`): the lead is won and its project exists in the same act
 * (`M08-02`). The plan's active-project limit gates creating one and nothing else (`M08-07`). A
 * second send of the same Won — a retry after a dropped answer — finds the project the first made.
 */
@Injectable()
export class ProjectsWonService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProjectsWonRepository) private readonly won: ProjectsWonRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(EntitlementService) private readonly entitlements: EntitlementService,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
    @Inject(ProjectsPaymentWordsService) private readonly paymentWords: ProjectsPaymentWordsService,
    @Inject(NotificationPushService) private readonly push: NotificationPushService,
  ) {}

  async markWon(
    reader: LeadReader,
    leadId: string,
    body: MarkWon,
    headers: CreateHeaders,
    act: Act,
  ): Promise<{ projectId: string; number: string }> {
    const route = projectActsContract.markWon;
    const key = creationKeyOf(headers, act.actorUserId, route, { leadId, ...body });
    const pack = await this.settings.packOf(reader.tenantId);
    minorUnitsOnField(body.finalValue, pack.formats.minorUnitDigits, 'finalValue');
    const limit = (await this.entitlements.limitsOf(reader.tenantId))?.get(
      'active_projects',
    )?.limit;
    const outcome = await this.won.markWon(
      reader,
      leadId,
      body,
      pack,
      pack.version,
      typeof limit === 'number' ? limit : null,
      act,
      key,
      await this.paymentWords.wordsOf(reader.tenantId),
    );
    if (outcome.outcome === 'done') {
      await this.push.deliverAfterCommit(
        reader.tenantId,
        outcome.notified ?? [],
        new Date(act.now),
      );
    }
    switch (outcome.outcome) {
      case 'done':
      case 'replayed':
      case 'key-reused':
        return this.replies.rowOf(
          outcome.outcome === 'key-reused'
            ? outcome
            : { outcome: outcome.outcome === 'done' ? 'created' : 'replayed', row: outcome },
          route,
          reader.tenantId,
        );
      case 'not-found':
        throw new NotFoundException('No such lead.');
      case 'not-a-manager':
        throw new ContractException(
          'VALIDATION_FAILED',
          'Pick a project manager or the owner.',
          HttpStatus.BAD_REQUEST,
          [{ path: 'managerId', issue: 'not_a_manager' }],
        );
      case 'install-date-past':
        throw new ContractException(
          'VALIDATION_FAILED',
          'The install date is a promise: today or later.',
          HttpStatus.BAD_REQUEST,
          [{ path: 'expectedInstallOn', issue: 'not_before_today' }],
        );
      case 'over-limit':
        throw new EntitlementBlockedException({
          reason: 'cap',
          capability: 'sell_and_deliver',
          key: 'active_projects',
          resetsAt: null,
        });
      case 'refused':
        throw refusalWithFacts(leadTransitionRefusedEnvelope, HttpStatus.UNPROCESSABLE_ENTITY, {
          code: LEAD_TRANSITION_REFUSED,
          message: 'The lead cannot be won from where it stands.',
          facts: { refusal: outcome.refusal },
        });
    }
  }
}
