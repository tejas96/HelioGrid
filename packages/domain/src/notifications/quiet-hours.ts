import type { ClockTime } from '../calling/clock-time';
import { clockTime } from '../calling/clock-time';
import type { CallingRulesPack } from '../calling/pack';
import { localMinutes, nextLocalTime } from '../format/zone';
import type { NotificationUrgency } from './types';

/**
 * When a push falls due (`F6-13`, `F6-14`).
 *
 * The RECORD is never held — it is the truth and lands at emit (`F6-06`). Only the push waits,
 * and only for a standard type: an immediate one is what the class exists to say, and the window
 * does not touch it. No staff notification wakes a phone at night.
 *
 * Pure: the instant is handed in as epoch milliseconds, never read from a clock and never
 * constructed — `new Date(…)` is how a clock read gets into this package and the spelling is
 * banned outright (`packages/domain/CLAUDE.md`). The window is the tenant's own, read in the
 * tenant's own timezone (`F1-10`): the same instant answers differently for two tenants, which
 * is the point.
 */

/**
 * The hours a tenant's staff are not to be pushed, on the tenant's own clock (`F1-10`).
 *
 * `ClockTime` is minutes past midnight and carries no zone, so this is compared as one number.
 * Unlike a `CallingWindow` it may CROSS midnight, which is the ordinary shape of a night.
 * Equal ends mean the tenant keeps no quiet hours at all.
 */
export interface QuietWindow {
  readonly start: ClockTime;
  readonly end: ClockTime;
}

/** No quiet hours at all: a window with no length holds nothing. */
const ALWAYS_AUDIBLE: QuietWindow = { start: clockTime('00:00'), end: clockTime('00:00') };

/**
 * The market's default (`F6-14`): the hours OUTSIDE its lawful calling window.
 *
 * Derived rather than authored, and the row is why — `F6-14` explains its own default by saying
 * agent calls run in the market's lawful calling window, so the window a market already declares
 * IS its statement of when a person may be contacted. A second number beside it could only
 * disagree with it.
 *
 * A market that declares NO voice ruleset declares no such hours, so the product holds nothing
 * back and a tenant that wants a window sets one. Inventing a night for it would be inventing
 * the very number this function exists to avoid.
 */
export function marketQuietHours(rules: CallingRulesPack): QuietWindow {
  if (!rules.voice.declared) return ALWAYS_AUDIBLE;
  const lawful = rules.voice.promotionalWindow.value;
  return { start: lawful.closes, end: lawful.opens };
}

/** Whether a local time falls inside the window, which may cross midnight. */
function insideWindow(minutes: number, window: QuietWindow): boolean {
  const { start, end } = window;
  if (start === end) return false;
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

/**
 * The instant this notification's push becomes due — `emittedAt` unless the tenant's quiet window
 * holds it, in which case the window's end.
 */
export function pushDueAt(
  urgency: NotificationUrgency,
  emittedAt: number,
  window: QuietWindow,
  timezone: string,
): number {
  if (urgency === 'immediate') return emittedAt;
  if (!insideWindow(localMinutes(emittedAt, timezone), window)) return emittedAt;
  return nextLocalTime(emittedAt, window.end, timezone);
}
