/**
 * The commercial structure vocabularies — how this product is packaged and sold, market-neutral
 * and currency-free (`BM-11`, `BM-12`, `BM-16`, `BM-33`).
 *
 * Some say what a tenant is SOLD; some say what the platform pays for instead (`costs.ts` —
 * `BM-23`, `BM-24`, `BM-25`); two are the axes of the soft-block matrix (`soft-block.ts` —
 * `BM-32`, `BM-35`, `BM-36`), which says what a tenant may still do when they have not paid. The
 * second group exists because an absence reads as an oversight: a cost the product promised to
 * swallow has to be written down to stay swallowed.
 *
 * These are NOT a market-pack key. A pack key is a market FACT that varies per market; these are
 * the structure every market prices against, which is what makes `BM-38` true — launching a
 * market adds price rows and changes no product code. The numbers live in that market's price
 * book (`T-FCORE-010`), and the lifecycle, the ledger and the entitlement gates live in `M12`.
 *
 * The tenant's DOCUMENT DEFAULTS sit here too (`M01-51`–`M01-54`, `M01-28`): what every proposal
 * is made of before a tenant says otherwise — the section set, the terms, the timeline phases, the
 * two standard payment splits, and the one resolver that fills them in. Market-neutral, priced
 * against nothing, and read by both screens and the server.
 *
 * `STANDING_METER` is not exported on purpose. It exists to keep storage out of the per-cycle
 * bundle record (`BM-12`, `BM-20`), and the TYPE already carries that everywhere it matters — a
 * consumer reads the shape, never the exception behind it.
 */

export { CAP_GRACE_DAYS, CAP_WARNING_PERCENT, capWarningReached } from './caps';
export type {
  AbsorbedCost,
  FreeUpstream,
  NeverMeteredCapability,
  ProxiedUpstream,
} from './costs';
export {
  ABSORBED_COSTS,
  FREE_UPSTREAMS,
  NEVER_METERED,
  PROXIED_UPSTREAMS,
} from './costs';
export type {
  BankDetails,
  BrandingInForce,
  BrandingSettings,
  BusinessProfileSettings,
  CompanyIdentity,
  EffectiveSettings,
  EffectiveSettingsInput,
  Letterhead,
  LocaleInForce,
  ProposalTemplateSettings,
  Resolved,
  SettingSource,
  TaxRegistration,
  TenantFacts,
  TenantHoliday,
  TenantSettings,
  TimelineTemplateSettings,
  TrancheLine,
  TrancheTemplate,
  TrancheTemplateContent,
  TrancheTemplateInForce,
} from './effective-settings';
export { absentFacts, resolveEffectiveSettings, SETTING_SOURCES } from './effective-settings';
export { appliesImmediately, forfeitsPriceProtection } from './grandfathering';
export type { Meter } from './meters';
export { METERS } from './meters';
export type { ProposalCover, ProposalSection } from './proposal-template-defaults';
export {
  DEFAULT_SECTIONS_INCLUDED,
  DEFAULT_TERMS,
  isSectionFloor,
  PROPOSAL_SECTIONS,
  SECTION_FLOOR,
  sectionsIncluded,
} from './proposal-template-defaults';
export type { RichTextBlock, RichTextSpan, RichTextValue } from './rich-text';
export { richTextParagraphs } from './rich-text';
export type { BillingCapability, BillingPhase, CapabilityStanding } from './soft-block';
export {
  BILLING_CAPABILITIES,
  BILLING_PHASES,
  capabilityStanding,
  isAlwaysOn,
  STATE_CAPABILITY_MATRIX,
} from './soft-block';
export type { BillingState } from './states';
export { BILLING_STATES } from './states';
export type { CountedCreation, Tier, TierCapacity, TierLimit } from './tiers';
export { COUNTED_CREATIONS, TIERS, tierBand } from './tiers';
export type { TimelinePhase } from './timeline-template-defaults';
export { DEFAULT_TIMELINE_PHASES } from './timeline-template-defaults';
export type { AllocationVerdict } from './tranche-allocation';
export { allocationVerdict, WHOLE_ALLOCATION } from './tranche-allocation';
export type { TrancheLineDefault, TrancheTemplateDefault } from './tranche-template-defaults';
export { STANDARD_TRANCHE_TEMPLATES } from './tranche-template-defaults';
export { isNonPaying, TRIAL_DAYS } from './trial';
