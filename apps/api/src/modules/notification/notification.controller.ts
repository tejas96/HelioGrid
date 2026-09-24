import { httpStatusFor, notificationContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { rolesOf, sessionOf, tenantIdOf } from '../../common/auth/session-context';
import { ContractException } from '../../common/errors/contract-exception';
import { NotificationDevicesService } from './notification.devices.service';
import { NotificationPreferencesService } from './notification.preferences.service';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(NotificationService) private readonly notifications: NotificationService,
    @Inject(NotificationPreferencesService)
    private readonly preferences: NotificationPreferencesService,
    @Inject(NotificationDevicesService) private readonly devices: NotificationDevicesService,
  ) {}

  @TsRestHandler(notificationContract)
  // `member`, not a capability: these are the reader's OWN records, and `F6-09` puts the inbox,
  // the badge and the history in the always-on set — no matrix cell gates a person's own post.
  @RouteAccessMap(notificationContract, {
    inbox: 'member',
    unreadCount: 'member',
    markRead: 'member',
    markAllRead: 'member',
    // Also `member`: these are the reader's OWN mutes. Which groups they may mute is a rule
    // about their presets (`F6-15`), answered inside the route, not a capability that reaches it.
    preferences: 'member',
    setPreference: 'member',
    // Also `member`: a handset is registered against the person the session names, never one the
    // request chose, so there is nothing for a capability to gate.
    registerDevice: 'member',
    forgetDevice: 'member',
  })
  handler(@Req() req: Request) {
    const recipient = () => sessionOf(req).actor.userId;
    const presets = () => rolesOf(req);
    return tsRestHandler(notificationContract, {
      inbox: async ({ query }) => ({
        status: 200,
        body: await this.notifications.inbox(tenantIdOf(req), recipient(), query),
      }),
      unreadCount: async () => ({
        status: 200,
        body: { unreadCount: await this.notifications.unreadCount(tenantIdOf(req), recipient()) },
      }),
      registerDevice: async ({ body }) => {
        await this.devices.register(recipient(), body, new Date());
        return { status: 200 as const, body: { registered: true as const } };
      },
      forgetDevice: async ({ body }) => {
        await this.devices.forget(body.token);
        return { status: 200 as const, body: { registered: false as const } };
      },
      preferences: async () => ({
        status: 200,
        body: {
          preferences: await this.preferences.read(tenantIdOf(req), recipient(), presets()),
        },
      }),
      setPreference: async ({ params, body }) => {
        const written = await this.preferences.write(
          tenantIdOf(req),
          recipient(),
          presets(),
          params.group,
          body.pushMuted,
        );
        // `F6-15` — the billing group is not the Owner's to mute, and saying so is not a leak:
        // the group is one of five the reader was just shown.
        if (written === null) {
          throw new ContractException(
            'FORBIDDEN',
            'Billing notifications stay on for the account owner',
            httpStatusFor('FORBIDDEN'),
          );
        }
        return { status: 200 as const, body: written };
      },
      markAllRead: async ({ body }) => ({
        status: 200,
        body: { marked: await this.notifications.markAllRead(tenantIdOf(req), recipient(), body) },
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
