import { PUSH_DELIVERY, type PushDelivery } from '@heliogrid/contracts';
import { channelsOwed, NOTIFICATION_REGISTRY, pushIsDue } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PushDeviceAdminRepository } from './notification.devices.admin.repository';
import { NotificationPreferencesRepository } from './notification.preferences.repository';
import { NotificationPushAdminRepository } from './notification.push.admin.repository';

/**
 * Sending one notification's push (`F6-06`, `F6-13`).
 *
 * Every decision belongs to `packages/domain` and this orders the reads around them: whether a
 * push is owed at all is `channelsOwed` — the mute, and the type's registered channels — and
 * whether it leaves NOW is `pushIsDue`, over the instant the quiet window let it go
 * (`T-FPLAT-018`). Nothing here re-decides either.
 *
 * Push is best effort by contract (`F6-06`). A transport failure is logged and swallowed: the
 * record is the truth, the inbox already has it, and an emit must not fail because a third party
 * did. A token the provider calls dead is deleted and never retried (`F6` §F6.2).
 *
 * It is called AFTER the emitting transaction commits, never inside it — a push sent for a row
 * that then rolled back cannot be recalled.
 */
@Injectable()
export class NotificationPushService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(NotificationPushAdminRepository)
    private readonly records: NotificationPushAdminRepository,
    @Inject(PushDeviceAdminRepository) private readonly devices: PushDeviceAdminRepository,
    @Inject(NotificationPreferencesRepository)
    private readonly preferences: NotificationPreferencesRepository,
    @Inject(PUSH_DELIVERY) private readonly transport: PushDelivery,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NotificationPushService.name);
  }

  /**
   * Sends this record's push if one is owed and due, and marks it. Silent and harmless when it
   * is not: a muted group, a type that never pushes, a window that has not ended, a person with
   * no handset, or a push already sent all take the same quiet exit.
   */
  async deliver(tenantId: string, notificationId: string, now: Date): Promise<void> {
    const record = await this.records.forPush(tenantId, notificationId);
    if (record === null || record.pushDueAt === null) return;

    const [stored, presets] = await Promise.all([
      this.preferences.mutedGroups(tenantId, record.recipientUserRef),
      this.preferences.presetsOf(tenantId, record.recipientUserRef),
    ]);
    const muted = stored.filter((row) => row.pushMuted).map((row) => row.group);
    const channels = channelsOwed(record.type, muted, presets);
    const due = pushIsDue(
      channels,
      record.pushDueAt.getTime(),
      record.pushSentAt?.getTime() ?? null,
      now.getTime(),
    );
    if (!due) return;

    const tokens = await this.devices.tokensOf(record.recipientUserRef);
    if (tokens.length === 0) return;

    try {
      const { deadTokens } = await this.transport.send({
        tokens,
        title: record.title,
        body: record.body,
        subjectKind: record.subjectKind,
        subjectRef: record.subjectRef,
        urgency: NOTIFICATION_REGISTRY[record.type].urgency,
      });
      await this.devices.forgetDead(deadTokens);
      await this.records.markPushSent(tenantId, notificationId, now);
    } catch (failure) {
      /* Best effort by contract: the inbox already holds the record, so a provider that refused
         loses nothing. It is logged rather than thrown, because the act that earned the
         notification has already committed and must not be reported as failed. */
      this.logger.warn({ err: failure, notificationId }, 'a push did not leave');
    }
  }
}
