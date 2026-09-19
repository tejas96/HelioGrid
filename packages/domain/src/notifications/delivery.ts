import type { NotificationChannel } from './types';

/**
 * Whether a push leaves NOW (`F6-06`, `F6-13`).
 *
 * Four facts decide it and nothing else: the channels this type still delivers on for this
 * reader — which is `channelsOwed`'s answer, mute and all — the instant the push fell due, the
 * marker saying one already went, and the clock. Pure: `now` arrives as a parameter, because a
 * sender that read its own clock could not be replayed.
 *
 * It is deliberately readable by two callers. A push that is due at emit leaves inside the same
 * request; a push the quiet window held falls due later and is claimed by a drain. Both ask this
 * one question, so neither can decide differently from the other.
 */
export function pushIsDue(
  channels: readonly NotificationChannel[],
  pushDueAt: number,
  pushSentAt: number | null,
  now: number,
): boolean {
  if (pushSentAt !== null) return false;
  if (!channels.includes('push')) return false;
  return now >= pushDueAt;
}
