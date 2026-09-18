import { httpStatusFor, notificationContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { sessionOf, tenantIdOf } from '../../common/auth/session-context';
import { ContractException } from '../../common/errors/contract-exception';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(NotificationService) private readonly notifications: NotificationService) {}

  @TsRestHandler(notificationContract)
  // `member`, not a capability: these are the reader's OWN records, and `F6-09` puts the inbox,
  // the badge and the history in the always-on set — no matrix cell gates a person's own post.
  @RouteAccessMap(notificationContract, {
    inbox: 'member',
    unreadCount: 'member',
    markRead: 'member',
  })
  handler(@Req() req: Request) {
    const recipient = () => sessionOf(req).actor.userId;
    return tsRestHandler(notificationContract, {
      inbox: async ({ query }) => ({
        status: 200,
        body: await this.notifications.inbox(tenantIdOf(req), recipient(), query),
      }),
      unreadCount: async () => ({
        status: 200,
        body: { unreadCount: await this.notifications.unreadCount(tenantIdOf(req), recipient()) },
      }),
      markRead: async ({ params }) => {
        const marked = await this.notifications.markRead(tenantIdOf(req), recipient(), params.id);
        // Someone else's record, or another company's: 404, never 403 — never reveal it exists.
        if (marked === null) {
          throw new ContractException(
            'NOT_FOUND',
            'No such notification',
            httpStatusFor('NOT_FOUND'),
          );
        }
        return { status: 200 as const, body: marked };
      },
    });
  }
}
