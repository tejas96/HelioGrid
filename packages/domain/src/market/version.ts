import type { MarketCode } from './code';

/**
 * The identity a computed output PINS (`F1-11`, `F8-14`): `IN.3` is the third published
 * revision of the India pack. A revision is a data update that takes the next number, never
 * a product release; an output computed under `IN.2` reads as stale beside `IN.3` and is
 * never rewritten (F8's staleness law).
 *
 * A brand rather than a string: a consumer obtains a version FROM A PACK and can neither
 * compose nor guess one. The constructor is kept off the package index on purpose. A version is
 * minted here from a pack literal, or from a stored row's market and revision — nowhere else.
 */
declare const PACK_VERSION: unique symbol;

export type PackVersion = string & { readonly [PACK_VERSION]: 'pack' };

/**
 * `revision` is the pack's ordinal: 1 is the first published revision. Anything else is an
 * authoring error and is thrown rather than smoothed over. A pack literal throws at import time
 * in the first test run; a stored row throws at read time, before anything prices on it.
 */
export function packVersion(market: MarketCode, revision: number): PackVersion {
  if (!Number.isInteger(revision) || revision < 1) {
    throw new RangeError(`a pack revision is a positive integer, not ${String(revision)}`);
  }
  return `${market}.${revision}` as PackVersion;
}

/** The ordinal back out of a version: `IN.3` is revision 3. The inverse of `packVersion`. */
export function revisionOf(version: PackVersion): number {
  return Number(version.slice(version.lastIndexOf('.') + 1));
}
