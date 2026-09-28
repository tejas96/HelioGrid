/**
 * `pack.subsidy` (`F1-14`) and the rules that read it: what the subsidy path demands of
 * components, and when the claim stage is skippable. The incentive computation is the server's
 * (`subsidyAmount`, on `@heliogrid/domain/server` — `F4-04`). The India instance
 * is `IN_SUBSIDY` (`F1-33`–`F1-35`).
 */
export type { SubsidyDeal } from './amount';
export type {
  CapacitySlab,
  IncentiveStage,
  NoSubsidy,
  RegionalTopUp,
  SubsidyEligibility,
  SubsidyModel,
  SubsidyPack,
} from './pack';
export { IN_SUBSIDY } from './pack';
export type { IncentiveProject } from './path';
export {
  isIncentiveStageSkippable,
  isSubsidyAvailable,
  requiredSubsidySchemes,
  unmetSubsidySchemes,
} from './path';
