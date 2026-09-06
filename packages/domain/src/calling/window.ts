import type { ClockTime } from './clock-time';
import type { CallingWindow, MessagingWindow } from './pack';

/**
 * The two window rules `F1-15` and `F1-17` state. Both read ONE clock — the tenant's (`F1-10`,
 * `Q58`) — and neither learns which: a `ClockTime` carries no zone, and the caller holding the
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
 * When a scheduled transactional message actually goes (`F1-15`). The send hour is a DEFAULT and
 * the window a FLOOR, so a slot outside the window yields to it: past the close the message goes
 * AT the close — "the last lawful moment before it, never after".
 *
 * With `NO_WINDOW` every hour is lawful and the slot stands unchanged. That is the India case
 * (`F1-62`b): the evening-before crew message and every dunning rung are never held, delayed or
 * refused for the time of day.
 *
 * A slot BEFORE the window opens is REFUSED. Read literally `F1-15` puts it at the PREVIOUS day's
 * close, which would send an evening-before message two evenings early; no authored pack reaches
 * the case, and the resolution is `Q86` — unruled. Refusing is the posture `tax/breakdown.ts`
 * already takes to `document_level`: vocabulary the engine will not act on until a ruling exists.
 */
export function lawfulSendTime(statutory: MessagingWindow, slot: ClockTime): ClockTime {
  if (statutory === null) return slot;
  if (slot < statutory.opens) {
    throw new RangeError(
      `a send slot before the window opens has no ruled resolution (F1-15; open question Q86)`,
    );
  }
  return slot > statutory.closes ? statutory.closes : slot;
}
