import type { BillingState } from './states';
import type { TierCapacity, TierLimit } from './tiers';

/**
 * Grandfathering (`BM-42`) — the two decisions behind a price-protection horizon.
 *
 * Repricing is a trust event: in a WhatsApp-connected market a badly handled price change travels
 * faster than any marketing, so an existing tenant is protected by LAW and not by goodwill. The
 * horizon's length is book data (`priceProtectionMonths`); its existence, and everything below,
 * is market-neutral.
 *
 * Two of the law's clauses have no code here and are constraints on what may be added: repricing
 * never applies MID-CYCLE and never applies RETROACTIVELY. Both are about WHEN a change lands,
 * which needs the tenant's own clock and cycle anchor (`F1-10`) — `M12`'s, never this package's.
 * The honest-copy discipline every repricing communication carries is `F8-34`'s and `i18n`'s.
 */

/**
 * `BM-42`, owner ruling `Q43` — whether reaching this state ends the tenant's launch-price
 * guarantee. A lapse forfeits: reactivation prices at the CURRENT list book, whether it happens
 * inside the original horizon or after it.
 *
 * `past_due` does NOT forfeit. It is the grace window, and grace that quietly cost you your
 * pricing would be the surprise `F8-34` forbids; `halted` is where the grace ran out, and that is
 * the lapse. `expired` reads `true` and this is not the rule reaching further than `BM-42` names
 * it: a trial that never converted holds no launch price, so nothing survives either way and the
 * answer is the same under both readings.
 *
 * An exhaustive `Record`, so a seventh billing state must be given an answer before this compiles
 * rather than defaulting to a protection nobody granted.
 *
 * The owner ruled this AGAINST the standing recommendation, deliberately (`Q43`). Cancellation,
 * dunning and win-back copy must say so plainly BEFORE the lapse — that copy is `M12-57`'s.
 */
const LAPSES: Record<BillingState, boolean> = {
  trialing: false,
  active: false,
  past_due: false,
  halted: true,
  expired: true,
  cancelled: true,
};

/** `BM-42` — a tenant reaching this state loses their protection horizon and cannot regain it. */
export function forfeitsPriceProtection(state: BillingState): boolean {
  return LAPSES[state];
}

/**
 * `BM-42` — whether a capacity change may reach a PROTECTED tenant at once. Growth may: giving a
 * tenant more is never a trust event. Taking anything away rides the horizon.
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
 * change touching one cannot be PROVEN generous, and an unproven change waits for the horizon. An
 * Enterprise revision that really is growth reaches its tenant through the conversation that set
 * the rung, not through a comparison this package cannot make.
 */
function isAtLeast(candidate: TierLimit, floor: TierLimit): boolean {
  if (candidate === 'custom' || floor === 'custom') return false;
  if (candidate === 'unlimited') return true;
  if (floor === 'unlimited') return false;
  return candidate >= floor;
}
