import { type MinorUnits, minorUnits } from '../money/minor-units';
import type { DealSegment } from '../tenancy/segment';

/**
 * `pack.subsidy` — the market's public-money incentive model, possibly none (`F1-14`). The
 * scheme's own words (`PM Surya Ghar`, `DCR`) appear only as VALUES here, never as a field, a
 * column or a line of copy anywhere else. `subsidy/amount.ts` is the maths that reads this and
 * `subsidy/path.ts` the two rules that are not maths; `M06` consumes the computed amount into
 * the payable and runs the component gate, `M08` the claim stage and the checklist row.
 *
 * The model is INJECTED CONFIGURATION, so a slab revision is a pack-data update that takes the
 * next pack version (`F1-11`) and self-stales the outputs computed under the old one (`F8`).
 * Nothing here is tenant-editable (`F1-12`): no manual slab entry exists anywhere in the
 * product (`M06-38`).
 */

/**
 * One rung of the capacity ladder: `perKw` for the next `kw` of system capacity. Rungs are read
 * in order and capacity past the last rung earns nothing, so the scheme's headline cap is the
 * SUM of the ladder and is never authored beside it — two numbers for one fact drift apart the
 * first time one of them is revised.
 */
export interface CapacitySlab {
  /** Width of the rung in kWp, not the capacity it ends at. */
  readonly kw: number;
  readonly perKw: MinorUnits;
}

/**
 * A geography's own ladder, added on top of the market's (`F1-14`'s geography dimension; the IN
 * state axis of `F1-33`). Same shape as the market ladder because it is computed by the same
 * function — one formula, applied twice.
 */
export interface RegionalTopUp {
  /** The market's own administrative-area code, matched against the deal's. */
  readonly region: string;
  readonly slabs: readonly CapacitySlab[];
}

/** Who and what the incentive reaches (`F1-14`). Geography is the top-up table's own dimension. */
export interface SubsidyEligibility {
  readonly segments: readonly DealSegment[];
  /**
   * Scheme keys from `pack.certification-schemes` (`F1-19`) that every component on a
   * subsidy-path output must carry. The gate that fails a non-conforming one is `M06`'s
   * (`F1-34`); this pack supplies the rule, and an empty list means the path gates on nothing.
   */
  readonly requiredSchemes: readonly string[];
}

/** When the canonical incentive-claim stage may be skipped in this market (`F1-14`, `F1-35`). */
export interface IncentiveStage {
  /** A project with no incentive skips it in every market, so that case is not pack data. */
  readonly skippableForSegments: readonly DealSegment[];
}

/**
 * A market that runs no public-money incentive. The claim stage is skippable market-wide and
 * subsidy rows leave checklists and computations (`F1-14`) — all of it read off this one
 * declaration, so a market declaring none carries no empty ladders to misread.
 */
export interface NoSubsidy {
  readonly offered: false;
}

export interface SubsidyModel {
  readonly offered: true;
  /** The scheme's identifier — `PM Surya Ghar`. A value, never a field name. */
  readonly scheme: string;
  readonly eligibility: SubsidyEligibility;
  readonly slabs: readonly CapacitySlab[];
  readonly regionalTopUps: readonly RegionalTopUp[];
  readonly incentiveStage: IncentiveStage;
}

export type SubsidyPack = NoSubsidy | SubsidyModel;

/**
 * India — PM Surya Ghar (`F1-33`), residential rooftop. The ladder's own sum is the scheme's
 * ₹78,000 headline: ₹30,000 × 2 kW plus ₹18,000 × 1 kW, with the fourth kW and every kW after
 * it earning nothing. Values in paise, the currency's minor unit (`F1-46`).
 *
 * `regionalTopUps` is authored EMPTY. `F1-33` names a state dimension and the suite carries no
 * state's figures, so the axis exists and grants nothing until a state's own ladder is authored
 * as the pack-data update `F1-11` makes it (owner ruling `Q84`).
 */
export const IN_SUBSIDY: SubsidyModel = {
  offered: true,
  scheme: 'PM Surya Ghar',
  eligibility: {
    /** `F1-33` — residential rooftop; a commercial deal is outside the scheme. */
    segments: ['residential'],
    /** `F1-34` — the subsidy path requires DCR-compliant components (`F1-44`'s scheme key). */
    requiredSchemes: ['DCR'],
  },
  slabs: [
    { kw: 2, perKw: minorUnits(3_000_000) },
    { kw: 1, perKw: minorUnits(1_800_000) },
  ],
  regionalTopUps: [],
  /** `F1-35` — the claim stage applies in IN and commercial projects skip it. */
  incentiveStage: { skippableForSegments: ['commercial'] },
};
