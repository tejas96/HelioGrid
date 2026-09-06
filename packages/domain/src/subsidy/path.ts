import type { Certification } from '../certification/pack';
import { holdsScheme } from '../certification/schemes';
import type { MinorUnits } from '../money/minor-units';
import type { DealSegment } from '../tenancy/segment';
import type { SubsidyPack } from './pack';

/**
 * The subsidy path's two rules that are not money: what it demands of the components on an
 * output, and whether a project must visit the claim stage. Both read the same declaration, so
 * a market that declares no subsidy (`F1-14`) answers "nothing" and "skippable" by construction
 * rather than by a caller remembering to check.
 */

/** A project the canonical incentive-claim stage is being judged for (`F1-35`). */
export interface IncentiveProject {
  readonly segment: DealSegment;
  /** What the project actually carries — `subsidyAmount`'s answer. Zero is "no incentive". */
  readonly incentive: MinorUnits;
}

/**
 * Whether this market's incentive reaches this segment at all (`F1-14`). The checklist's subsidy
 * row is seeded on this answer and omitted on its negation (`F1-52` for commercial; `M08` seeds).
 */
export function isSubsidyAvailable(subsidy: SubsidyPack, segment: DealSegment): boolean {
  return subsidy.offered && subsidy.eligibility.segments.includes(segment);
}

/**
 * The scheme keys every component on a subsidy-path output must carry (`F1-14`, `F1-19`). `M06`
 * fails the output naming the component and the scheme (`F1-34`, `M06-23`); a market declaring
 * no subsidy requires nothing, so the gate is dead there rather than absent.
 */
export function requiredSubsidySchemes(subsidy: SubsidyPack): readonly string[] {
  return subsidy.offered ? subsidy.eligibility.requiredSchemes : [];
}

/**
 * The schemes a component on a subsidy-path output does not hold (`F1-19`, `F1-34`). Empty
 * means it passes. `M06`'s Generate gate fails the output naming the component and these
 * schemes (`M06-23`); the DECISION is here, so no module carries the rule.
 *
 * A market declaring no subsidy demands nothing, so every component passes there by
 * construction rather than by a caller remembering to skip the check.
 */
export function unmetSubsidySchemes(
  subsidy: SubsidyPack,
  held: readonly Certification[],
): readonly string[] {
  return requiredSubsidySchemes(subsidy).filter((scheme) => !holdsScheme(held, scheme));
}

/**
 * Whether the incentive-claim stage may be skipped (`F1-35`). Skippable market-wide where the
 * pack declares no subsidy (`F1-14`), for a project carrying no incentive whatever its segment,
 * and for the segments the pack names. A skipped stage stays in the chain — `M08` owns the
 * machine and never removes it.
 */
export function isIncentiveStageSkippable(
  subsidy: SubsidyPack,
  project: IncentiveProject,
): boolean {
  if (!subsidy.offered) return true;
  if (project.incentive === 0) return true;
  return subsidy.incentiveStage.skippableForSegments.includes(project.segment);
}
