import type { TierCapacity, TierLimit } from './tiers';

/**
 * Repricing (`BM-42`) — a new book reaches every company at its next paid period, never inside
 * one, and no company keeps a signed-up price. WHEN a period starts is the tenant's clock and
 * cycle anchor (`F1-10`) — `M12`'s, never this package's. Here is the one decision that is not
 * about time: which capacity changes may reach a company before then.
 */

/**
 * `BM-42` — whether a capacity change may reach a company at once, before its next paid period.
 * Growth may: giving a company more is never a trust event. Taking anything away waits for the
 * company's next paid period.
 *
 * CAPACITY only. `BM-42` grants the immediate path to caps and bundle growth and says nothing
 * about a price cut, so nothing here reads a price — inventing that rule would be this package
 * writing law the document does not carry.
 *
 * A change is generous only when EVERY limit grew or held. One rung taken away makes the whole
 * change wait, because a tenant does not experience a book revision one field at a time.
 */
export function appliesImmediately(before: TierCapacity, after: TierCapacity): boolean {
  return (
    isAtLeast(after.designCeilingKw, before.designCeilingKw) &&
    isAtLeast(after.storageGb, before.storageGb) &&
    everyLimitHeld(before.creationsPerCycle, after.creationsPerCycle) &&
    everyLimitHeld(before.meterBundles, after.meterBundles)
  );
}

/** Every key of a limit record grew or held. The records share a key set by their own types. */
function everyLimitHeld<K extends string>(
  before: Record<K, TierLimit>,
  after: Record<K, TierLimit>,
): boolean {
  return Object.keys(before).every((key) => isAtLeast(after[key as K], before[key as K]));
}

/**
 * Whether one limit is at least another.
 *
 * `unlimited` is above every number and equal to itself — removing a ceiling is the most generous
 * change there is, and imposing one is the least.
 *
 * `custom` is never at least anything, INCLUDING an identical `custom`. That is deliberate and it
 * is the trust posture rather than a gap: a negotiated rung's number is not in this package, so a
 * change touching one cannot be PROVEN generous, and an unproven change waits for the next paid period. An
 * Enterprise revision that really is growth reaches its tenant through the conversation that set
 * the rung, not through a comparison this package cannot make.
 */
function isAtLeast(candidate: TierLimit, floor: TierLimit): boolean {
  if (candidate === 'custom' || floor === 'custom') return false;
  if (candidate === 'unlimited') return true;
  if (floor === 'unlimited') return false;
  return candidate >= floor;
}
