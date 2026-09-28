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
  StatutoryExtra,
  TaxComponentShare,
  TaxPack,
  TaxRegistrationType,
  TaxStrategy,
} from './pack';
export { IN_TAX, TAX_STRATEGIES } from './pack';
export { checkTaxRegistration, type TaxRegistrationCheck } from './registration';
