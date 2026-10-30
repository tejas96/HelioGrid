import type { AbsorbedCost, ProxiedUpstream } from './costs';
import { ABSORBED_COSTS, PROXIED_UPSTREAMS } from './costs';
import type { Meter, STANDING_METER } from './meters';
import type { TierLimit } from './tiers';

/**
 * What the usage ledger meters (`M12-32`, `M12-33`, `M12-37`): every billed meter but the storage
 * gauge, then the cost lines the platform pays for and never bills. Storage is left out because a
 * gauge is a nightly READING, never a sum of events (`BM-20`); it has its own snapshot table.
 *
 * The cost lines are spread from their tuples; the billed list is spelled out because the ledger's
 * enum needs a literal tuple, and `EveryBilledMeterListed` makes a meter added to `METERS` and left
 * out here a compile error. The database enum `usage_meter` is held equal to `LEDGER_METERS` by
 * invariant `enum-parity`.
 */
export const BILLED_LEDGER_METERS = [
  'voice_minutes',
  'ai_roof_detections',
  'marketing_sends',
  'tracked_field_seats',
] as const satisfies readonly Exclude<Meter, typeof STANDING_METER>[];
export type BilledLedgerMeter = (typeof BILLED_LEDGER_METERS)[number];

type EveryBilledMeterListed =
  Exclude<Meter, typeof STANDING_METER> extends BilledLedgerMeter ? true : never;
const everyBilledMeterListed: EveryBilledMeterListed = true;
void everyBilledMeterListed;

export const COST_LINES = [...ABSORBED_COSTS, ...PROXIED_UPSTREAMS] as const;
export type CostLine = AbsorbedCost | ProxiedUpstream;

export const LEDGER_METERS = [...BILLED_LEDGER_METERS, ...COST_LINES] as const;
export type LedgerMeter = BilledLedgerMeter | CostLine;

/**
 * The unit one ledger row's `quantity` counts, per meter — always a whole number, so no rounding
 * ever sits in the ledger. Voice is kept in seconds and tracked seats in seat-seconds: turning a
 * total into billed minutes or seat-months happens once, on the rolled-up total, by its reader.
 */
export const METER_UNITS = {
  voice_minutes: 'second',
  ai_roof_detections: 'detection',
  marketing_sends: 'send',
  tracked_field_seats: 'seat_second',
  otp_delivery: 'message',
  field_location_ingestion: 'event',
  solar_imagery: 'call',
  ai_extraction: 'call',
  speech: 'second',
} as const satisfies Record<LedgerMeter, string>;

/** Whether a meter can ever bill: only `METERS` do. A cost line is never on a bill (`M12-37`). */
export function isBilledMeter(meter: LedgerMeter): meter is BilledLedgerMeter {
  return (BILLED_LEDGER_METERS as readonly LedgerMeter[]).includes(meter);
}

/**
 * The month a ledger row is deduplicated within: `YYYY-MM` of the UTC instant it happened. Only
 * the ledger's writer calls it, from the row's own `occurredAt`, so a retried event always lands on
 * the same key and stays a no-op (`M12-32`). The instant is an ISO string in UTC (`Z`), as the
 * contracts carry every instant.
 */
export function usagePeriodKey(occurredAtUtc: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T.*Z$/.test(occurredAtUtc)) {
    throw new RangeError(`usagePeriodKey takes a UTC ISO instant, got ${occurredAtUtc}`);
  }
  return occurredAtUtc.slice(0, 7);
}

/** One GB, as the book sells storage: 10⁹ bytes. */
const BYTES_PER_GB = 1_000_000_000;

/**
 * The storage gate (`M12-23`, `BM-20`): a new upload is refused only when the latest nightly gauge
 * is MORE than a tenth above the ceiling. The tenth is the room for a day's uploads between two
 * snapshots, so the declared file's own size is never added. A limit with no number — `unlimited`,
 * or a negotiated `custom` one — refuses nothing. Integer arithmetic: gauge × 10 > limit × 11 GB.
 */
export function storageRefuses(gaugeBytes: number, limitGb: TierLimit): boolean {
  if (typeof limitGb !== 'number') return false;
  return gaugeBytes * 10 > limitGb * 11 * BYTES_PER_GB;
}
