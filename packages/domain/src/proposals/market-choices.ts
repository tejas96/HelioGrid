import type { FormatPack } from '../format/pack';
import { PROJECT_STAGE_CHAIN, type ProjectChainStage } from '../projects/stages';
import type { SubsidyPack } from '../subsidy/pack';
import { isIncentiveOffered, isSubsidyAvailable } from '../subsidy/path';
import type { DealSegment } from '../tenancy/segment';
import type { SystemType } from './system-type';

/**
 * What the builder may offer, read off the market pack beside the proposal itself — facts the pack
 * holds whether or not a price is typed yet, so a step never waits on the money block to offer a
 * choice.
 */

/**
 * The stages a payment part may fall due on (`M06-13`, `T-M06-009`): only the stages this
 * segment's projects visit. The pack names the stages a market may skip (`F1-51`); a segment the
 * incentive never reaches skips them, so a commercial proposal is never offered the claim stage.
 * With the segment or the pack still unknown the skippable stages are left out — never offered on a
 * guess.
 */
export function trancheDueStages(
  formats: Pick<FormatPack, 'vocabulary'>,
  subsidy: SubsidyPack | null,
  segment: DealSegment | null,
): readonly ProjectChainStage[] {
  const visitsAll =
    subsidy !== null &&
    segment !== null &&
    isSubsidyAvailable(subsidy, segment) &&
    subsidy.offered &&
    !subsidy.incentiveStage.skippableForSegments.includes(segment);
  if (visitsAll) return PROJECT_STAGE_CHAIN;
  const skipped: readonly string[] = formats.vocabulary.skippableStages;
  return PROJECT_STAGE_CHAIN.filter((stage) => !skipped.includes(stage));
}

/**
 * Whether step 3 offers the *incentive claimed* switch (`M06-38`): the pack's own rule for the
 * deal's segment and the system type, so the switch is there before any price is typed. `null`
 * while the pack or the segment is not known — the caller then offers nothing yet.
 */
export function incentiveOfferedTo(
  subsidy: SubsidyPack | null,
  segment: DealSegment | null,
  systemType: SystemType,
): boolean | null {
  if (subsidy === null || segment === null) return null;
  return isIncentiveOffered(subsidy, { segment, systemType });
}
