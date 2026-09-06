/**
 * The market pack framework: the versioned unit (`F1-01`), its eight keys (`F1-02`) and the
 * launch gate (`F1-05`). Each key's content lives in its own slice, as `format/` does; this
 * folder holds what is true of every key and of the pack as a whole.
 *
 * `packVersion` is not exported on purpose. The only packs are authored in this package, so
 * a consumer obtains a version from a pack and never mints one.
 */
export type { MarketCode } from './code';
export { IN_MARKET } from './code';
export type { PackKey } from './keys';
export { PACK_KEYS } from './keys';
export { isLaunchable, unauthoredKeys } from './launch';
export type { MarketPack } from './pack';
export { IN_PACK } from './pack';
export type { PackVersion } from './version';
