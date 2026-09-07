import type { ClockTime } from './clock-time';
import type { CallingWindow, MessagingWindow } from './pack';

/**
 * The two window rules `F1-15` and `F1-17` state. Both read ONE clock — the tenant's (`F1-10`)
 * — and neither learns which: a `ClockTime` carries no zone, and the caller holding the
 * tenant resolves it before asking. That is what stops a floor and its narrowing being compared
 * across two frames.
 */

/**
 * Whether a tenant's own window sits inside the statutory one (`F1-17`). Equal bounds are inside
 * — narrowing to exactly the floor is not widening it. A market with `NO_WINDOW` bounds nothing,
 * so any tenant window is inside it.
 *
 * The settings surface asks this before it saves (`M01`, `M07`). A window that would widen the
 * floor is REFUSED, never clamped: clamping saves a setting the tenant believes it made.
 */
export function isWithinFloor(statutory: MessagingWindow, tenant: CallingWindow): boolean {
  if (statutory === null) return true;
  return tenant.opens >= statutory.opens && tenant.closes <= statutory.closes;
}

/**
 * The window actually in force. A tenant window that narrows the floor wins; one that would
 * widen it is discarded and the floor stands. There is no override flag and no support bypass
 * (`F1-12`, `F1-17`, `F1` §5), so this function has no third answer to give.
 */
export function windowInForce(
  statutory: MessagingWindow,
  tenant: CallingWindow | null,
): MessagingWindow {
  if (tenant === null) return statutory;
  return isWithinFloor(statutory, tenant) ? tenant : statutory;
}

/**
 * Where a resolved send lands, and on which day. Before the window opens the last lawful moment
 * is the PREVIOUS day's close, and a clock time alone would read as today's close — which is
 * after the slot — so the day travels with the time and a scheduler cannot drop it.
 */
export interface LawfulSendTime {
  readonly at: ClockTime;
  readonly day: 'same' | 'previous';
}

/**
 * When a scheduled transactional message actually goes (`F1-15`). The send hour is a DEFAULT and
 * the window a FLOOR, so a slot outside the window yields to it on BOTH sides — "the last lawful
 * moment before it, never after": past the close the message goes at that day's close, and
 * before the open at the previous day's close. One rule either side keeps a time-critical
 * message always earlier than its slot and never later.
 *
 * With `NO_WINDOW` every hour is lawful and the slot stands unchanged. That is the India case
 * (`F1-62`b): the evening-before crew message and every dunning rung are never held, delayed or
 * refused for the time of day.
 *
 * The near side is reached only where a pack revision moves the floor: `M01-56`'s gate refuses a
 * tenant narrowing that would leave the send hour outside the window in force, and an
 * early-evening slot never precedes a statutory morning open. `M07-35`'s forward shift is voice
 * lane 2 and is not this rule.
 */
export function lawfulSendTime(statutory: MessagingWindow, slot: ClockTime): LawfulSendTime {
  if (statutory === null) return { at: slot, day: 'same' };
  if (slot < statutory.opens) return { at: statutory.closes, day: 'previous' };
  return { at: slot > statutory.closes ? statutory.closes : slot, day: 'same' };
}
