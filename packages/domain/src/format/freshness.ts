import type { PackEnvelope } from '../market/envelope';
import type { PackKey } from '../market/keys';
import { type PackPin, stalePinnedKeys } from '../market/staleness';
import { marketOf, revisionOf } from '../market/version';

/**
 * Whether a computed figure is still current — decided by comparison, never stored as a flag
 * (`F8-13`). An output records what it was computed from (`F8-14`); every display compares that
 * record with what is current now, and only that comparison can say "current".
 */

/**
 * What an output can be computed from. The ORDER is the order `moved` names them in: what the
 * output was built from, then `F8-14`'s four. `tenantPriceBook` is the tenant's price-book version
 * (`M01-48`), named apart from the market pack's own `priceBook` key.
 */
export const PINNED_INPUTS = [
  'design',
  'catalogRelease',
  'tenantPriceBook',
  'marketPack',
  'engines',
] as const;
export type PinnedInput = (typeof PINNED_INPUTS)[number];

/**
 * What an output recorded at computation. It pins what it read, and only what it pinned is
 * compared — so a pin set stored before an input class existed still compares on what it holds.
 * `design` is the design fingerprint, not its save counter: undoing an edit restores freshness.
 *
 * `null` and an empty string pin nothing: a stored pin column with no value reads back as `null`,
 * and counting it as a pin would let an output that pinned nothing compare equal and read current.
 */
export interface InputPins {
  readonly design?: string | null;
  readonly catalogRelease?: string | null;
  readonly tenantPriceBook?: number | null;
  readonly marketPack?: PackPin | null;
  /** Engine name → the version that computed the output. */
  readonly engines?: Readonly<Record<string, string>> | null;
}

/**
 * The same inputs as they are now, and whether a recompute is running over the output. A value
 * that is absent, `null` or an empty string was not handed in, and a pinned input with nothing to compare
 * against is never current.
 */
export interface CurrentInputs {
  readonly design?: string | null;
  readonly catalogRelease?: string | null;
  readonly tenantPriceBook?: number | null;
  /** The envelope the pack pin names, fetched by that version. */
  readonly pinnedPack?: PackEnvelope | null;
  readonly currentPack?: PackEnvelope | null;
  readonly engines?: Readonly<Record<string, string>> | null;
  /** Required: a caller that forgot a running recompute would show its output as current. */
  readonly recomputeInFlight: boolean;
}

type FreshnessState =
  | { readonly kind: 'current' }
  | {
      readonly kind: 'stale';
      /** Never empty, in `PINNED_INPUTS` order. */
      readonly moved: readonly PinnedInput[];
      /** The pack keys that moved, in `PACK_KEYS` order; empty unless `marketPack` moved. */
      readonly movedPackKeys: readonly PackKey[];
    }
  | { readonly kind: 'recomputing' }
  | { readonly kind: 'unchecked' };

declare const FRESHNESS: unique symbol;

/**
 * Branded, so nothing outside this file can write `current` — "nothing can mark a stale output
 * fresh" (`F8-13`). Kept on one line: the brand registry reads this declaration shape.
 */
export type Freshness = FreshnessState & { readonly [FRESHNESS]: 'freshness' };

function minted(state: FreshnessState): Freshness {
  return state as Freshness;
}

/** A figure whose comparison was not made — the server was unreachable, the pins unreadable. */
export const UNCHECKED: Freshness = minted({ kind: 'unchecked' });
const RECOMPUTING: Freshness = minted({ kind: 'recomputing' });

/**
 * Whether the output `pins` describes is current. A recompute in flight outranks the comparison
 * for its whole window (`F8-17`); an output that pinned nothing, or a pinned input with nothing
 * to compare it to, was never established as current (`F8-13`, `F8-14`).
 */
export function freshnessOf(pins: InputPins, now: CurrentInputs): Freshness {
  if (now.recomputeInFlight) return RECOMPUTING;
  const pinned = PINNED_INPUTS.filter((input) => isPinned(pins, input));
  if (pinned.length === 0) return UNCHECKED;
  const packPin = pinned.includes('marketPack') ? pins.marketPack : null;
  const movedPackKeys = isGiven(packPin) ? packKeysMoved(packPin, now) : [];
  if (movedPackKeys === null) return UNCHECKED;
  const moved: PinnedInput[] = [];
  for (const input of pinned) {
    const hasMoved =
      input === 'marketPack' ? movedPackKeys.length > 0 : valueMoved(pins, now, input);
    if (hasMoved === null) return UNCHECKED;
    if (hasMoved) moved.push(input);
  }
  return minted(moved.length === 0 ? { kind: 'current' } : { kind: 'stale', moved, movedPackKeys });
}

/** Why the document may not be sent, shared or issued — `null` only when it is current (`F8-17`). */
export function issueBlockedBy(freshness: Freshness): Exclude<Freshness['kind'], 'current'> | null {
  return freshness.kind === 'current' ? null : freshness.kind;
}

function isPinned(pins: InputPins, input: PinnedInput): boolean {
  if (input === 'engines') return Object.keys(pins.engines ?? {}).length > 0;
  if (input === 'marketPack') return (pins.marketPack?.keysRead.length ?? 0) > 0;
  return isGiven(pins[input]);
}

/** A value that says something: not absent, not a stored `null`, not an empty string. */
function isGiven<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null && value !== '';
}

/** `null` when there is nothing to compare: the wrong pinned envelope, or another market's. */
function packKeysMoved(pin: PackPin, now: CurrentInputs): readonly PackKey[] | null {
  const { pinnedPack, currentPack } = now;
  if (!isGiven(pinnedPack) || !isGiven(currentPack)) return null;
  const pinnedIsNamed =
    pinnedPack.market === marketOf(pin.version) && pinnedPack.revision === revisionOf(pin.version);
  if (!pinnedIsNamed || currentPack.market !== pinnedPack.market) return null;
  return stalePinnedKeys(pin, pinnedPack, currentPack);
}

/** `null` when the current value was not handed in. An engine pinned and now absent has moved. */
function valueMoved(
  pins: InputPins,
  now: CurrentInputs,
  input: Exclude<PinnedInput, 'marketPack'>,
): boolean | null {
  if (input === 'engines') {
    const current = now.engines;
    const pinnedEngines = pins.engines;
    if (!isGiven(current) || !isGiven(pinnedEngines)) return null;
    return Object.entries(pinnedEngines).some(([engine, version]) => current[engine] !== version);
  }
  if (!isGiven(now[input])) return null;
  return now[input] !== pins[input];
}
