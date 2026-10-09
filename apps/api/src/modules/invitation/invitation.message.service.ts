import { MESSAGE_DELIVERY, type MessageDelivery } from '@heliogrid/contracts';
import type {
  InviteMessageStepInput,
  InviteMessageStepResult,
} from '@heliogrid/contracts/workflows';
import { inviteLandingPath, platformMessage } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { keyedSecret } from '../../common/auth/secrets';
import { ENV } from '../../config/env';
import { MarketPackService } from '../market/market.public';
import { InvitationRepository } from './invitation.repository';

/**
 * The secret in an invite's link, made again from its id: the send stores only its hash, and the
 * text's step — a run later, with ids alone — makes the same link the hash was taken from.
 */
export function inviteLinkSecret(invitationId: string): string {
  return keyedSecret(ENV.INVITE_LINK_SECRET, invitationId);
}

/**
 * The invite's text (`M01-12`) — the one step of the worker's `inviteMessage` run, after the send
 * committed. An invite no longer pending gets none. A carrier refusal is thrown for the run to
 * retry, named and logged by the invitation's id, never the phone.
 */
@Injectable()
export class InvitationMessageService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(InvitationRepository) private readonly scoped: InvitationRepository,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
    @Inject(MESSAGE_DELIVERY) private readonly delivery: MessageDelivery,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InvitationMessageService.name);
  }

  async send(step: InviteMessageStepInput, now: number): Promise<InviteMessageStepResult> {
    const facts = await this.scoped.awaitingMessage(step.tenantId, step.invitationId, now);
    if (facts === null) return { sent: false };
    const pack = await this.markets.deliverablePack(facts.phoneE164);
    const message = platformMessage(pack.callingRules, 'team_invite', facts.defaultLanguage, {
      inviter: facts.inviterName,
      company: facts.companyName,
      link: `${ENV.WEB_ORIGIN}${inviteLandingPath(inviteLinkSecret(step.invitationId))}`,
    });
    try {
      await this.delivery.send({ phoneE164: facts.phoneE164, channel: 'sms', message });
    } catch (error) {
      // The refusal's own message may name the phone, and what a step throws is written to the
      // run's history and the worker log: only its kind is logged, and a new error is thrown with
      // no cause attached.
      const cause = error instanceof Error ? error.name : 'unknown';
      this.logger.warn(
        { invitationId: step.invitationId, cause },
        'the carrier refused an invite text',
      );
      throw new Error(`the carrier refused the text of invitation ${step.invitationId}`);
    }
    return { sent: true };
  }
}
