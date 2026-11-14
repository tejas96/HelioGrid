import type { ClockTime } from '../calling/clock-time';
import type { CallingRulesPack, CallingWindow, MessagingWindow } from '../calling/pack';
import { lawfulSendTime, windowInForce } from '../calling/window';
import { callBackDueAt } from '../crm/crm-clock';
import type { CalendarDate } from '../format/holidays';
import { calendarDayAfter, localDate, localInstant } from '../format/zone';

/**
 * The two moments the link's work turns on, both on the TENANT's clock (`F1-10`) — never the
 * customer's — with every instant handed in: this package reads no clock.
 */

/**
 * The moment a customer's named time consents to (`F5-54`): the time itself, or `null` where they
 * named none or named one already past when they asked — a past time consents to no moment that
 * can still come.
 */
export function consentedCallTime(namedAt: number | null, requestedAt: number): number | null {
  return namedAt !== null && namedAt > requestedAt ? namedAt : null;
}

/**
 * When a customer's call request falls due (`F5-54`): at the time they consented to — their own
 * recorded consent, so it stands even outside the ordinary window — or, with none, at the next
 * lawful moment, which the page then states.
 */
export function callRequestDueAt(
  namedAt: number | null,
  requestedAt: number,
  timeZone: string,
  window: MessagingWindow,
): number {
  return consentedCallTime(namedAt, requestedAt) ?? callBackDueAt(requestedAt, timeZone, window);
}

/** The hour the evening-before message goes, and the window it must sit in — the pack's, the tenant's narrowing inside it. */
export interface CrewMessageRules {
  readonly rules: Pick<CallingRulesPack, 'messaging'>;
  /** The tenant's own narrower window, where it keeps one; never wider than the floor (`F1-17`). */
  readonly tenantWindow: CallingWindow | null;
  /** The tenant's own send hour, where it narrowed the default (`M01-56`). */
  readonly tenantSendHour: ClockTime | null;
}

/**
 * When the evening-before crew message is due (`F5-68`, `F1-15`): the day before the installation,
 * at the market's send hour on the tenant's clock. A slot outside the window in force goes at the
 * last lawful moment BEFORE it and never after — past the close at that day's close, before the
 * open at the previous day's close, the day carried with it.
 */
export function crewMessageMoment(
  installOn: CalendarDate,
  timeZone: string,
  { rules, tenantWindow, tenantSendHour }: CrewMessageRules,
): number {
  const eveningBefore = calendarDayAfter(installOn, -1);
  const slot = tenantSendHour ?? rules.messaging.scheduledSendHour.value;
  const window = windowInForce(rules.messaging.statutoryWindow.value, tenantWindow);
  const lawful = lawfulSendTime(window, slot);
  const day = lawful.day === 'same' ? eveningBefore : calendarDayAfter(eveningBefore, -1);
  return localInstant(day, lawful.at, timeZone);
}

/**
 * Whether the composed crew message is offered now (`T-F5-002`): from its moment until the
 * installation day ends on the tenant's clock. Read at open time, so nothing fires on a timer.
 */
export function isCrewMessageDue(
  now: number,
  installOn: CalendarDate,
  timeZone: string,
  rules: CrewMessageRules,
): boolean {
  return (
    now >= crewMessageMoment(installOn, timeZone, rules) && localDate(now, timeZone) <= installOn
  );
}
