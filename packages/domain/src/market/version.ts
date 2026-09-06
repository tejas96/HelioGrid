import type { MarketCode } from './code';

/**
 * The identity a computed output PINS (`F1-11`, `F8-14`): `IN.3` is the third published
 * revision of the India pack. A revision is a data update that takes the next number, never
 * a product release; an output computed under `IN.2` reads as stale beside `IN.3` and is
 * never rewritten (F8's staleness law).
 *
 * A brand rather than a string: a consumer obtains a version FROM A PACK and can neither
 * compose nor guess one. The constructor is kept off the package index on purpose. The only
 * packs are authored in this package, so only this package mints a version.
 */
declare const PACK_VERSION: unique symbol;

export type PackVersion = string & { readonly [PACK_VERSION]: 'pack' };

/**
 * `revision` is the pack's ordinal: 1 is the first published revision. Anything else is an
 * authoring error and is thrown rather than smoothed over. The only caller is a pack literal,
 * so the throw lands at import time in the first test run, never on a customer's screen.
 */
export function packVersion(market: MarketCode, revision: number): PackVersion {
  if (!Number.isInteger(revision) || revision < 1) {
    throw new RangeError(`a pack revision is a positive integer, not ${String(revision)}`);
  }
  return `${market}.${revision}` as PackVersion;
}
