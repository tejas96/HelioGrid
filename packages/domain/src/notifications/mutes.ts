import { FOUNDER_ROLE, type RolePreset } from '../authz/roles';
import { NOTIFICATION_REGISTRY, typeGroupOf } from './registry';
import type { NotificationChannel, NotificationType, NotificationTypeGroup } from './types';

/**
 * Whether a push is owed (`F6-15`).
 *
 * Minimal and honest: a person mutes PUSH for a whole group, and nothing else. There is no
 * per-event snooze, and no mute reaches the record — the record always lands and is the truth
 * (`F6-06`), so the answer here is never an empty set of channels.
 *
 * Pure: the mutes a person has stored and the presets they hold are both handed in. This decides.
 */

/**
 * Whether this group may be muted at all.
 *
 * `F6-15` withholds "audit-relevant billing/compliance events for the Owner". It names a CLASS
 * and not its members, and every billing row in the matrix addresses the Owner — so the group is
 * the list, and no hand-kept set of types can fall out of step with it.
 */
export function mayMute(group: NotificationTypeGroup, presets: readonly RolePreset[]): boolean {
  return !(group === 'billing' && presets.includes(FOUNDER_ROLE));
}

/**
 * Whether a stored mute stands when a push resolves.
 *
 * Read as well as written, because the two can disagree honestly: a person may mute billing and
 * be made Owner afterwards, and the row outlives the preset change. The rule is the same one on
 * both sides, so the write refuses what the read would disregard.
 */
export function pushMuted(
  group: NotificationTypeGroup,
  mutedGroups: readonly NotificationTypeGroup[],
  presets: readonly RolePreset[],
): boolean {
  return mutedGroups.includes(group) && mayMute(group, presets);
}

/**
 * The channels this type still delivers on for this person — its registration's, less push where
 * a mute stands. Never empty: `in_app` is what the record is.
 */
export function channelsOwed(
  type: NotificationType,
  mutedGroups: readonly NotificationTypeGroup[],
  presets: readonly RolePreset[],
): readonly NotificationChannel[] {
  const registered = NOTIFICATION_REGISTRY[type].channels;
  if (!pushMuted(typeGroupOf(type), mutedGroups, presets)) return registered;
  return registered.filter((channel) => channel !== 'push');
}
