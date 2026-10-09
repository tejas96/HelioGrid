import {
  type InviteMessageActivities,
  inviteMessageWorkflow,
} from '@heliogrid/contracts/workflows';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { TemporalActivityHost } from '../../common/temporal/temporal.activity-host';
import { InvitationMessageService } from './invitation.message.service';

/**
 * The invite text's step, registered with the step host: it runs here, beside the invitation's
 * tables, and the worker's `inviteMessage` workflow calls it on `heliogrid-team`.
 */
@Injectable()
export class InvitationActivityRegistration implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalActivityHost) private readonly host: TemporalActivityHost,
    @Inject(InvitationMessageService) private readonly messages: InvitationMessageService,
  ) {}

  onModuleInit(): void {
    const activities: InviteMessageActivities = {
      sendInviteMessage: (input) => this.messages.send(input, Date.now()),
    };
    this.host.register({ taskQueue: inviteMessageWorkflow.taskQueue, activities });
  }
}
