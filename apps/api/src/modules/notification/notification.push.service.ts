import { PUSH_DELIVERY, type PushDelivery } from '@heliogrid/contracts';
import {
  channelsOwed,
  MS_PER_DAY,
  NOTIFICATION_REGISTRY,
  NOTIFICATION_TYPES,
  pushIsDue,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PushDeviceAdminRepository } from './notification.devices.admin.repository';
import { NotificationPreferencesRepository } from './notification.preferences.repository';
import {
  NotificationPushAdminRepository,
  type NotificationToPush,
  type PushAttempt,
} from './notification.push.admin.repository';

/** The types whose registry row sends a push; an in-app-only notice is never the drain's. */
const PUSHED_TYPES = NOTIFICATION_TYPES.filter((type) =>
  NOTIFICATION_REGISTRY[type].channels.includes('push'),
);

/** How far back the drain looks for a push still owed: past a day, no handset is owed it. */
const DRAIN_LOOKS_BACK_MS = MS_PER_DAY;

/** The emit sends a push due at once right after its commit; the drain leaves it that long. */
const EMIT_SENDS_WITHIN_MS = 60_000;

/** At most this many pushes per run, so one run stays inside its step's timeout. */
const DRAIN_BATCH = 200;

const OWED_TO_NOBODY: PushAttempt = { outcome: 'owed_to_nobody' };

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
   * The pushes of notices already committed. A push that cannot go out never turns the act that
   * raised it into a failure: a retry would find the notices written and send no push at all
   * (`F6-06`, the record is the truth). Logged by the notice's id alone.
   */
  async deliverAfterCommit(tenantId: string, ids: readonly string[], now: Date): Promise<void> {
    for (const notificationId of ids) {
      try {
        await this.deliver(tenantId, notificationId, now);
      } catch (error) {
        this.logger.warn({ notificationId, err: error }, 'a push failed after its commit');
      }
    }
  }

  /**
   * Sends this record's push if one is owed and due, and marks it. Silent and harmless when it
   * is not: a muted group, a type that never pushes, a window that has not ended, a person with
   * no handset, or a push already sent all take the same quiet exit.
   */
  async deliver(tenantId: string, notificationId: string, now: Date): Promise<void> {
    const record = await this.records.forPush(tenantId, notificationId);
    if (record === null) return;
    if ((await this.sendOwed(record, now)).outcome === 'sent') {
      await this.records.markPushSent(tenantId, notificationId, now);
    }
  }

  /**
   * The push drain: every push a quiet window held, or a provider refused, that has fallen
   * due within the last day, sent once through the same port the emit uses. A push due this past
   * minute is still the emit's own to send, so the drain leaves it. One owed to no one — a muted
   * group, no device — is settled the first time the drain meets it, and the inbox holds the
   * record; a push a provider kept refusing stops being tried a day after it fell due.
   */
  async drainDue(now: Date): Promise<{ pushed: number }> {
    const at = now.getTime();
    const due = {
      from: new Date(at - DRAIN_LOOKS_BACK_MS),
      to: new Date(at - EMIT_SENDS_WITHIN_MS),
      now,
    };
    const pushed = await this.records.drainDue(due, PUSHED_TYPES, DRAIN_BATCH, (record) =>
      this.sendOwed(record, now),
    );
    return { pushed };
  }

  /** Sends the record's push when one is owed and due now, and says what came of it. Never throws. */
  private async sendOwed(record: NotificationToPush, now: Date): Promise<PushAttempt> {
    if (record.pushDueAt === null) return OWED_TO_NOBODY;
    const { tenantId, recipientUserRef } = record;
    const [stored, presets] = await Promise.all([
      this.preferences.mutedGroups(tenantId, recipientUserRef),
      this.preferences.presetsOf(tenantId, recipientUserRef),
    ]);
    const muted = stored.filter((row) => row.pushMuted).map((row) => row.group);
    const channels = channelsOwed(record.type, muted, presets);
    if (!channels.includes('push')) return OWED_TO_NOBODY;
    const due = pushIsDue(
      channels,
      record.pushDueAt.getTime(),
      record.pushSentAt?.getTime() ?? null,
      now.getTime(),
    );
    if (!due) return { outcome: 'held' };

    const tokens = await this.devices.tokensOf(recipientUserRef);
    if (tokens.length === 0) return OWED_TO_NOBODY;

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
      return { outcome: 'sent' };
    } catch (failure) {
      /* Best effort by contract: the inbox already holds the record, so a provider that refused
         loses nothing. It is logged rather than thrown, because the act that earned the
         notification has already committed and must not be reported as failed. */
      this.logger.warn({ err: failure, notificationId: record.id }, 'a push did not leave');
      return { outcome: 'failed' };
    }
  }
}
