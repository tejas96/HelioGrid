/**
 * The market pack framework: the versioned unit (`F1-01`), its eight keys (`F1-02`), the
 * launch gate (`F1-05`), the envelope a row holds (`F1-11`) and the pin an output keeps
 * (`F8-14`). Each key's content lives in its own slice, as `format/` does; this folder holds
 * what is true of every key and of the pack as a whole.
 *
 * `packVersion`, `marketCode` and `revisionOf` are not exported on purpose. A consumer obtains
 * a version and a market from a pack, or from `packFromEnvelope`, and never mints one.
 */
export type { MarketCode } from './code';
export { IN_MARKET } from './code';
export type { PackEnvelope } from './envelope';
export { envelopeOf, nextEnvelope, packFromEnvelope } from './envelope';
export type { PackKey, TenantReadableKey } from './keys';
export { PACK_KEYS, TENANT_READABLE_KEYS } from './keys';
export { isLaunchable, unauthoredKeys } from './launch';
export type { PhoneReach } from './of-phone';
export { marketOfPhone, phoneReach } from './of-phone';
export type { MarketPack } from './pack';
export { IN_PACK } from './pack';
export type { PackPayload } from './payload';
export { tenantReadablePayload } from './payload';
export type { PackPin } from './staleness';
export { stalePinnedKeys } from './staleness';
export type { PackVersion } from './version';
