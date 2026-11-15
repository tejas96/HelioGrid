/**
 * Proposals (`M06`): the one commercial document on a lead — its eleven-step field set, how each
 * step stands, the status machine and what a screen reads of it. The money block, the Generate
 * checklist, the projections, the built-in yield and the number are the server's (`./server`,
 * `F4-04`); their TYPES are here, because a screen renders what the server sent.
 */

export type { BuiltInYield, BuiltInYieldTable } from './built-in-yield';
export type {
  GenerateBlock,
  GenerateVerdict,
  GenerateWarning,
  RequiredField,
  SkippedCheck,
  SkipReason,
} from './checklist-findings';
export { REQUIRED_FIELDS, SKIP_REASONS } from './checklist-findings';
export {
  COMPONENT_CATEGORIES,
  COUNTED_COMPONENT_CATEGORIES,
  type ComponentCategory,
  isCountedCategory,
  isSavedPartKind,
  MANDATORY_COMPONENT_CATEGORIES,
  SAVED_PART_KINDS,
  type SavedPartKind,
} from './component-category';
export { PROPOSAL_BASIS_WITHOUT_DESIGN, PROPOSAL_ENGINES } from './computation';
export {
  type ProposalSheet,
  proposalSheetsOf,
  type SheetFields,
  sheetKey,
  sheetNumber,
} from './document-sheets';
export {
  bestMonth,
  capacityChangedSinceEdit,
  isMonthlyFigures,
  MONTHS_PER_YEAR,
  systemMonthlyKwh,
  yearlyKwh,
} from './energy';
export type {
  BankFields,
  BatteryFields,
  CompanyFields,
  ComponentLine,
  ComponentPrint,
  DiscountFields,
  EmiFields,
  FinancialFields,
  MaintenancePlan,
  MonthlyFigures,
  PaymentFields,
  PerformanceFields,
  ProposalCompanyFacts,
  ProposalDealFacts,
  ProposalFieldSet,
  ProposalPhase,
  SystemFields,
} from './field-set';
export type {
  ForecastStageRow,
  OpenProposalValue,
  PipelineForecast,
} from './forecast';
export { FORECAST_STAGES, type ForecastStage } from './forecast-stage';
export {
  type ListSlice,
  type PriceSheet,
  type PriceSheetFields,
  priceSheetsOf,
  timelineSheetsOf,
} from './list-sheets';
export { incentiveOfferedTo, trancheDueStages } from './market-choices';
export type {
  ProposalIncentive,
  ProposalMargin,
  ProposalMoney,
  ProposalMoneyFigures,
  ProposalMoneyInput,
} from './money';
export { PROPOSAL_MONEY_LINES, type ProposalMoneyLineKey } from './money-lines';
export {
  type CoverLineFacts,
  coverLineFacts,
  type IncludedLine,
  includedInPrice,
  namesAlternatives,
  timelineDays,
} from './narrative';
export type { ProposalEmi, ProposalSavings, SavingsInput } from './projections';
export type {
  FrozenCompanyFacts,
  FrozenGeneration,
  ProposalDraftValueSet,
  ProposalVersionSnapshot,
} from './snapshot';
export {
  type DraftProgress,
  draftProgress,
  emptyCategories,
  requiredCategories,
  type StandingFacts,
  stepStandings,
  type TemplateFilledSteps,
} from './standing';
export {
  answerProposal,
  liveOnItsLead,
  PROPOSAL_ACT_REFUSALS,
  PROPOSAL_STATUSES_ON_A_LINK,
  type ProposalActRefusal,
  type ProposalActResult,
  type ProposalStatusFacts,
  shareProposal,
  statusWhenLeadCloses,
  statusWhenSuperseded,
  type WonBasis,
  withdrawProposal,
  wonBasisOf,
} from './status';
export {
  isPageOptional,
  PAGES_ALWAYS_PRINTED,
  PROPOSAL_PAGES,
  PROPOSAL_STEPS,
  type ProposalPage,
  type ProposalStep,
  pagesPrinted,
  presentedSteps,
  QUICK_STEPS,
  STEP_PAGE,
  STEP_STANDINGS,
  type StepStanding,
  sectionOfPage,
  stepNumberOf,
} from './steps';
export type { FieldSetEnvelope, VersionSnapshotEnvelope } from './stored-envelope';
export { needsBattery, SYSTEM_TYPES, type SystemType } from './system-type';
export type { TemplateFillInput } from './template-fill';
export { termsChars, termsEstimate, termsFitTheirPages, termsPagesOf } from './terms-pages';
export {
  forecastStageOf,
  listFilterOf,
  matchesListFilter,
  PROPOSAL_LIST_FILTERS,
  PROPOSAL_STANDINGS,
  type ProposalListFilter,
  type ProposalStanding,
  proposalStandingOf,
  type StandingEvidence,
} from './tracked-standing';
export { termsValidityDays } from './validity';
export type { VersionChange, VersionDiff, VersionFactValue } from './version-diff';
export { VERSION_FACTS, type VersionFact } from './version-facts';
export {
  type VersionShare,
  type VersionsOnLink,
  versionAwaitingShare,
  versionsOnLink,
} from './version-on-link';
export {
  COMPONENT_LINE_SOURCES,
  COVER_PICTURES,
  type ComponentLineSource,
  type CoverPicture,
  type CoverPictureKey,
  DEFAULT_COVER_PICTURE,
  DISCOUNT_MODES,
  type DiscountMode,
  FILL_ORIGINS,
  type FillOrigin,
  INVERTER_TYPES,
  type InverterType,
  MAINTENANCE_KINDS,
  type MaintenanceKind,
  PHASE_COUNT,
  PROPOSAL_ANSWERS,
  PROPOSAL_LIMITS,
  PROPOSAL_STATUSES,
  PROPOSAL_TYPES,
  PROPOSAL_VALIDITY_DAYS,
  type ProposalAnswer,
  type ProposalStatus,
  type ProposalType,
  SHARE_CHANNELS,
  type ShareChannel,
  SUPPLY_PHASES,
  type SupplyPhase,
  VERSION_TRIGGERS,
  type VersionTrigger,
} from './vocabulary';
