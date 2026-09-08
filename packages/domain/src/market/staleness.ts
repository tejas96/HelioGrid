import type { PackEnvelope } from './envelope';
import { PACK_KEYS, type PackKey } from './keys';
import { canonicalJson } from './payload';
import type { PackVersion } from './version';

/**
 * What a money- or engineering-bearing output records about the pack it read (`F8-14`): the
 * version, and WHICH keys. Both, because staleness is per key read (`F8-13`): a design that read
 * `formats` and `tax` is untouched by a revision that repriced `priceBook` (`F1-11`).
 *
 * Authored here before design and proposal consume it (Law 11), so both platforms and both
 * modules pin and compare the same way.
 */
export interface PackPin {
  readonly version: PackVersion;
  readonly keysRead: readonly PackKey[];
}

/**
 * The keys an output read that changed between the revision it pinned and the current one,
 * in PRD order. Empty means the output is fresh. `pinned` is the envelope `pin.version` names;
 * the caller fetched it by that version, and nothing here is written back to either.
 */
export function stalePinnedKeys(
  pin: PackPin,
  pinned: PackEnvelope,
  current: PackEnvelope,
): readonly PackKey[] {
  return PACK_KEYS.filter(
    (key) =>
      pin.keysRead.includes(key) &&
      canonicalJson(pinned.pack[key]) !== canonicalJson(current.pack[key]),
  );
}
