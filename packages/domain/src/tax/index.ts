/**
 * `pack.tax` (`F1-08`, `F1-13`) and the maths that reads it: the one tax computation and the
 * statutory-extra threshold rule. The India instance is `IN_TAX` (`F1-28`–`F1-31`).
 */
export type {
  MoneyScheme,
  PlaceOfSupply,
  TaxableLine,
  TaxBreakdown,
  TaxComponentAmount,
  TaxedLine,
} from './breakdown';
export { taxBreakdown } from './breakdown';
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
