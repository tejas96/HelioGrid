import type { NotificationPreference } from '@heliogrid/contracts';
import {
  mayMute,
  type NotificationTypeGroup,
  pushGroupsShownTo,
  type RolePreset,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { NotificationPreferencesRepository } from './notification.preferences.repository';

/**
 * A person's push mutes, read and written (`F6-15`).
 *
 * Every group the person is shown is answered, every time — a person who has stored nothing still
 * sees a row per group, because the preferences surface asks what is possible and not what happens
 * to be on disk. Which groups are shown and which may be muted are `packages/domain`'s rules, and
 * both are applied on BOTH sides here: the write refuses a group the read does not show and a mute
 * the read would disregard, so a row that outlives a preset change can never quietly silence
 * something it may not.
 */
@Injectable()
export class NotificationPreferencesService {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(NotificationPreferencesRepository)
    private readonly stored: NotificationPreferencesRepository,
  ) {}

  async read(
    tenantId: string,
    userRef: string,
    presets: readonly RolePreset[],
  ): Promise<NotificationPreference[]> {
    const rows = await this.stored.mutedGroups(tenantId, userRef);
    const muted = new Set(rows.filter((row) => row.pushMuted).map((row) => row.group));
    return pushGroupsShownTo(presets).map((group) => this.answer(group, muted.has(group), presets));
  }

  /**
   * Null where a rule refuses the change — a group the person is not shown, or a mute they may not
   * make. The route answers 403 with it, and the row is never written, so a refusal leaves no trace
   * to disregard later.
   */
  async write(
    tenantId: string,
    userRef: string,
    presets: readonly RolePreset[],
    group: NotificationTypeGroup,
    pushMuted: boolean,
  ): Promise<NotificationPreference | null> {
    if (!pushGroupsShownTo(presets).includes(group)) return null;
    if (pushMuted && !mayMute(group, presets)) return null;
    await this.stored.setMuted(tenantId, userRef, group, pushMuted);
    return this.answer(group, pushMuted, presets);
  }

  /** One group as its owner sees it: what is stored, and whether they may change it. */
  private answer(
    group: NotificationTypeGroup,
    pushMuted: boolean,
    presets: readonly RolePreset[],
  ): NotificationPreference {
    const mutable = mayMute(group, presets);
    /* A stored mute the rule refuses is reported as OFF, because that is what delivery does with
       it (`F6-15`): the row outlives a preset change, and the reader is told the truth about
       what will reach them rather than what is on disk. */
    return { group, pushMuted: mutable && pushMuted, mutable };
  }
}
