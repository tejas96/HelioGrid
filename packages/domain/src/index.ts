/**
 * @heliogrid/domain — pure isomorphic domain logic. Zero workspace imports; never reads the environment.
 *
 * Imports allowed: the TypeScript stdlib. Nothing else in the workspace — this is the BOTTOM
 * layer, so packages/contracts imports IT, never the reverse (owner ruling).
 * A business enum both layers need is defined here as a pure union and contracts builds its
 * `z.enum` from it; importing contracts from here would be a package cycle.
 * Never: NestJS · React · React Native · storage · fetch · env reads · packages/db ·
 * packages/ui · any app. Rules, catalogs and market config are INJECTED parameters,
 * never module-level globals.
 *
 * dependency-cruiser enforces this (domain-purity-no-layers, domain-purity-no-frameworks) —
 * rules that were inert until this package existed, because they targeted a path that
 * matched nothing.
 *
 * Seeded with the login flow's shared TYPES only — the two platforms had each
 * authored their own copy and had already drifted. The login state MACHINE (reducer,
 * transitions) still arrives with the auth rebuild (auth-tenancy ruling 6); formatters and the
 * invite and role invariants land with the first slice that needs them (Law 9). The package
 * existed before any of it so the purity rules were live BEFORE the code they must police.
 */

export {
  AUTO_VERIFY_DELAY_MS,
  CALL_OFFER_AFTER_RESENDS,
  DONE_DWELL_MS,
  RESEND_SECONDS,
} from './auth/login-policy';
export type { LoginStep, OtpFailure } from './auth/login-state';
export { OTP_EXPIRY_SECONDS, OTP_LENGTH } from './auth/otp';
export type {
  Capability,
  CapabilityGrant,
  CapabilityRow,
  CapabilityRowKey,
  LadderScope,
  ResolvedVisibility,
  RolePreset,
  VisibilityDomain,
  VisibilityScope,
} from './authz';
export {
  CAPABILITY_MATRIX,
  can,
  capabilityLimit,
  grantedCapabilities,
  M01_CAPABILITIES,
  ROLE_PRESETS,
  resolveVisibility,
  VISIBILITY_DOMAINS,
  VISIBILITY_LADDER,
  visibilityIn,
} from './authz';
export type {
  CompactStep,
  FormatPack,
  MeasurementSystem,
  MoneyOptions,
  Numberish,
  NumberOptions,
  PhoneFormats,
  PhoneOptions,
} from './format';
export {
  formatCompact,
  formatCompactMoney,
  formatDate,
  formatLength,
  formatMoney,
  formatMonthYear,
  formatNumber,
  formatPhone,
  formatTime,
  IN_FORMATS,
  isRenderableNumber,
  moneySymbol,
  monthNames,
  PROCUREMENT_SYSTEM,
  parseNumber,
  resolveMeasurementSystem,
  weekdayNames,
} from './format';
export type { MarketCode, MarketPack, PackKey, PackVersion } from './market';
export { IN_MARKET, IN_PACK, isLaunchable, PACK_KEYS, unauthoredKeys } from './market';
export type { BasisPoints, MinorUnits, Share } from './money';
export { amountForQuantity, applyRate, basisPoints, minorUnits, sumMinorUnits } from './money';
export type {
  CapacitySlab,
  IncentiveProject,
  IncentiveStage,
  NoSubsidy,
  RegionalTopUp,
  SubsidyDeal,
  SubsidyEligibility,
  SubsidyModel,
  SubsidyPack,
} from './subsidy';
export {
  IN_SUBSIDY,
  isIncentiveStageSkippable,
  isSubsidyAvailable,
  requiredSubsidySchemes,
  subsidyAmount,
} from './subsidy';
export type {
  MoneyScheme,
  PlaceOfSupply,
  PlaceOfSupplyRule,
  PlatformSaleTax,
  StatutoryExtra,
  TaxableLine,
  TaxBreakdown,
  TaxComponentAmount,
  TaxComponentShare,
  TaxedLine,
  TaxPack,
  TaxRegistrationType,
  TaxStrategy,
} from './tax';
export { activeStatutoryExtras, IN_TAX, TAX_STRATEGIES, taxBreakdown } from './tax';
export type { DealSegment, TenantSegment } from './tenancy/segment';
export { DEAL_SEGMENTS, TENANT_SEGMENTS } from './tenancy/segment';
