import type { BillingUsage, BillingUsageEvent, UsageEventMeter } from '@heliogrid/contracts';
import { mapRead, type Read } from '@heliogrid/domain';
import { rangeOf } from './UsagePage.logic';
import type { UsageEventRow, UsageInput, UsageLedgerView } from './UsagePage.types';

/** Ledger seconds in a minute, for a call's duration. */
const SECONDS = 60;

/** One meter's events panel (`M12-36`), its subtitle the meter's own figure for the cycle. */
export function usageLedgerViewOf(
  meter: UsageEventMeter,
  usage: BillingUsage | null,
  read: Read<readonly BillingUsageEvent[]>,
  more: boolean,
  input: UsageInput,
): UsageLedgerView {
  const { words, format } = input;
  const range = usage === null ? '' : rangeOf(usage, input);
  const voice = meter === 'voice_minutes';
  const subtitle = voice
    ? words.eventsSubtitleMinutes(range, format.number(usage?.voice.usedMinutes ?? 0))
    : words.eventsSubtitleCodes(range, usage?.otpCodes ?? 0);
  const empty = voice ? words.noCalls : words.noCodes;
  const row = (event: BillingUsageEvent): UsageEventRow => ({
    key: event.id,
    title: voice ? words.callTitle : (event.person ?? words.codeTitle),
    subtitle: words.eventAt(format.date(event.occurredAt), format.clockAt(event.occurredAt)),
    figure: voice
      ? words.callDuration(
          format.number(Math.floor(event.quantity / SECONDS)),
          format.number(event.quantity % SECONDS),
        )
      : null,
  });
  return {
    title: voice ? words.view.limits.voiceMinutes : words.otpCodes,
    subtitle,
    // No event this cycle is the panel's empty state, never a blank list.
    read:
      read.kind === 'ready' && read.value.length === 0
        ? { kind: 'empty' }
        : mapRead(read, (events) => events.map(row)),
    emptyTitle: empty.title,
    emptyMessage: empty.body,
    more,
  };
}
