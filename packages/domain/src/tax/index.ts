/**
 * `pack.tax` (`F1-08`, `F1-13`) and the rules that read it: the statutory-extra threshold rule and
 * the registration check. The one tax computation is the server's (`taxBreakdown`, on
 * `@heliogrid/domain/server` — `F4-04`). The India instance is `IN_TAX` (`F1-28`–`F1-31`).
 */
export type {
  MoneyScheme,
  PlaceOfSupply,
  TaxableLine,
  TaxBreakdown,
  TaxComponentAmount,
  TaxedLine,
} from './breakdown';
export { activeStatutoryExtras } from './extras';
export type {
  PlaceOfSupplyRule,
  PlatformSaleTax,
  RegistrationPlace,
  StatutoryExtra,
  TaxComponentShare,
  TaxPack,
  TaxRegistrationType,
  TaxStrategy,
} from './pack';
export { IN_TAX, TAX_STRATEGIES } from './pack';
export { taxPackOf } from './pack-schema';
export type { PlatformInvoice, PlatformInvoiceLine } from './platform-invoice';
export {
  checkTaxRegistration,
  placeOfRegistration,
  type TaxRegistrationCheck,
} from './registration';
