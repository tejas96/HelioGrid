import { PACK_KEYS, type PackKey } from './keys';
import type { MarketPack } from './pack';

/**
 * The new-market gate (`F1-05`). A pack launches only when all eight keys are authored
 * (`F1-02`), which is also how the gate's two determinations are carried: the privacy and
 * residency determination IS `dataRights` (`F1-23`), and the supplier-of-record decision
 * sits inside `tax` (`F1-13`). A key whose content is permitted to be empty, subsidy "none",
 * no voice ruleset, an empty scheme set (`F1-14`, `F1-16`, `F1-19`), is authored, not
 * missing.
 *
 * Presence is read off the OBJECT rather than the type on purpose. Today the type carries
 * only the keys that have landed and this reports the ones that have not; once a pack can
 * arrive as stored data, the same read reports a stored pack that lost a key.
 */

/** The keys this pack has not authored, in PRD order. Empty means every key is present. */
export function unauthoredKeys(pack: MarketPack): readonly PackKey[] {
  return PACK_KEYS.filter((key) => !Object.hasOwn(pack, key));
}

/** `F1-05`: a pack missing any key is not launchable. */
export function isLaunchable(pack: MarketPack): boolean {
  return unauthoredKeys(pack).length === 0;
}
