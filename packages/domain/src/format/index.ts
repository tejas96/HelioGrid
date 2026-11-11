/**
 * The format layer — `pack.formats` values (`F1-21`) and the four single rendering
 * implementations that consume them (`F3-19`): money, non-money numbers, dates and times,
 * measurements, plus phone display from the same pack key.
 *
 * There is exactly one of each, product-wide. A surface that needs a formatted value imports
 * from here; it never composes its own, and `packages/ui` consumes these rather than restating
 * them (`docs/engineering/architecture.md` §2 — `ui` may import `domain`).
 */

export { APPEARANCES, type Appearance, appearanceOf } from './appearance';
export {
  CHECKLIST_ROW_MAKERS,
  type ChecklistRow,
  type ChecklistRowMaker,
  checklistForDeal,
  IN_DOCUMENT_CHECKLIST,
} from './checklist';
export {
  formatClockAt,
  formatDate,
  formatDayMonth,
  formatMonthYear,
  formatTime,
  formatWeekday,
  isTenantToday,
  monthNames,
  weekdayNames,
} from './datetime';
export {
  BASIS_LINES,
  type BasisLine,
  basisLineOf,
  type DocumentBasis,
  RULED_DISCLOSURES,
  type RuledDisclosure,
  tierFitsBasis,
} from './disclosure';
export {
  ENERGY_DATABASES,
  type EnergyDatabase,
  type EnergySource,
  ESTIMATE_TOLERANCE_PERCENT,
  energySourceOf,
  inLadderOrder,
} from './energy-source';
export { FIGURE_SLOT } from './figure-slot';
export {
  type CurrentInputs,
  type Freshness,
  type FreshnessWarning,
  freshnessOf,
  type InputPins,
  issueBlockedBy,
  PINNED_INPUTS,
  type PinnedInput,
  UNCHECKED,
} from './freshness';
export { type CalendarDate, holidaysInForce, isHoliday } from './holidays';
export { IN_INSTALL_STEPS, type InstallStepRow, installStepLabel } from './install-steps';
export {
  inLanguage,
  LANGUAGES,
  type LanguageFacts,
  type PackLabel,
  type PerLanguage,
  packLabel,
  UI_LANGUAGES,
  UI_SOURCE_LOCALE,
  type UiLanguage,
  uiLanguageOfTag,
  uiLanguageOrSource,
} from './languages';
export {
  formatLength,
  PROCUREMENT_SYSTEM,
  resolveMeasurementSystem,
} from './measurement';
export {
  formatCompactMoney,
  formatMinorUnits,
  formatMoney,
  type MoneyOptions,
  moneySymbol,
} from './money';
export {
  formatCompact,
  formatNumber,
  isRenderableNumber,
  type Numberish,
  type NumberOptions,
  parseNumber,
} from './number';
export { AGENT_CALL_WINDOW, type ObservationWindow } from './observation-window';
export type {
  CompactStep,
  FormatPack,
  MeasurementSystem,
  PhoneFormats,
} from './pack';
export { IN_FORMATS, MEASUREMENT_SYSTEMS, withLatinDigits } from './pack';
export { PACK_WORD_KINDS, type PackWordKind, packWordOf } from './pack-words';
export {
  formatPhone,
  nationalNumber,
  type PhoneDigitsMismatch,
  type PhoneOptions,
  phoneDigitsMismatch,
  phoneE164Of,
} from './phone';
export { type PowerUnit, type ScaledPower, scaledPower } from './power';
export {
  PROJECTION_ASSUMPTIONS,
  type ProjectionAssumption,
  type ProjectionAssumptions,
  type StatedAssumption,
  statedAssumptions,
} from './projection';
export {
  compactQualified,
  PROVENANCE_STANDINGS,
  PROVENANCE_TIERS,
  type ProvenanceStanding,
  type ProvenanceTier,
  type QualifiedAmount,
  type Qualifier,
  qualifiers,
  qualifyMinorUnits,
  qualifyMoney,
  weakestTier,
} from './qualified';
export {
  type FamilyCoverage,
  type ScriptRun,
  type ScriptStack,
  splitScriptRuns,
} from './scripts';
export {
  mayReachCustomer,
  SIGN_OFF_DECISIONS,
  type SignOff,
  type SignOffDecision,
  type SignOffRecord,
  signOffOf,
} from './sign-off';
export { packOnTenantTime } from './tenant-pack';
export { TRANSPORT_FAILURES, type TransportFailure } from './transport-failure';
export {
  IN_UTILITIES,
  operatorsForRegion,
  typicalWait,
  type UtilityDirectory,
  type UtilityRegion,
  type UtilityWait,
} from './utility';
export {
  type BlockerPartyLabel,
  type BlockerReasonLabel,
  blockerPartyLabel,
  blockerReasonLabel,
  type DisplayVocabulary,
  IN_VOCABULARY,
  isSkippableStage,
  type PaymentModeLabel,
  paymentModeLabel,
  type StageLabel,
  stageLabel,
} from './vocabulary';
export { localDate, localInstant, localMinutes, MS_PER_DAY, nextLocalTime } from './zone';
