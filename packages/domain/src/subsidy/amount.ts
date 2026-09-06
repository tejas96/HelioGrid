import {
  amountForQuantity,
  type MinorUnits,
  minorUnits,
  sumMinorUnits,
} from '../money/minor-units';
import type { DealSegment } from '../tenancy/segment';
import type { CapacitySlab, SubsidyPack } from './pack';

/** What the pack's eligibility dimensions are read against (`F1-14`, `F1-33`). */
export interface SubsidyDeal {
  readonly segment: DealSegment;
  readonly capacityKwp: number;
  /**
   * The deal's administrative area, matched against the pack's regional top-ups. `null` where
   * the market has no such axis or the area is not yet known — either way it earns the market
   * ladder alone, never a guessed region's.
   */
  readonly region: string | null;
}

/** Capacity earns each rung in turn, and everything past the last rung earns nothing. */
function ladderAmount(slabs: readonly CapacitySlab[], capacityKwp: number): MinorUnits {
  let remaining = capacityKwp;
  const rungs: MinorUnits[] = [];
  for (const slab of slabs) {
    if (remaining <= 0) break;
    rungs.push(amountForQuantity(slab.perKw, Math.min(remaining, slab.kw)));
    remaining -= slab.kw;
  }
  return sumMinorUnits(rungs);
}

/**
 * What a deal earns under the pack's incentive model (`F1-33`: geography × capacity, with the
 * market ladder and the deal region's top-up summed). The answer pins the pack version its
 * caller resolved, so a slab revision self-stales it rather than rewriting it (`F1-11`, `F8`).
 *
 * Component conformity is NOT an input. A non-conforming component on a subsidy-path output
 * FAILS that output at `M06`'s Generate gate (`F1-34`); were it zeroed here instead, a proposal
 * that elected the path and then swapped in a non-DCR panel would quietly read ₹0 and the gate
 * would have nothing left to fail. `requiredSubsidySchemes` is the rule that gate enforces.
 */
export function subsidyAmount(subsidy: SubsidyPack, deal: SubsidyDeal): MinorUnits {
  if (!subsidy.offered) return minorUnits(0);
  if (!subsidy.eligibility.segments.includes(deal.segment)) return minorUnits(0);
  if (!(deal.capacityKwp > 0)) return minorUnits(0);

  const topUp = subsidy.regionalTopUps.find((candidate) => candidate.region === deal.region);
  return sumMinorUnits([
    ladderAmount(subsidy.slabs, deal.capacityKwp),
    ladderAmount(topUp?.slabs ?? [], deal.capacityKwp),
  ]);
}
