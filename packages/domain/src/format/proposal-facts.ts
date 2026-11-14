import { type BasisPoints, basisPoints } from '../money/basis-points';
import { type MinorUnits, minorUnits } from '../money/minor-units';
import type { ForecastStage } from '../proposals/forecast-stage';

/**
 * The market facts a proposal built without a design reads (`M06-23`, `M06-40`, `M06-11`,
 * `M13-03`): the tolerances its size checks warn at, the example an EMI projection starts from, what
 * exported power earns, how fast the tariff is assumed to rise, and how likely an open proposal is
 * to close. Each is a market fact, never a tenant setting and never a constant in a module.
 */
export interface ProposalMarketFacts {
  /** How far the panels' total may sit from the system size before Generate warns (`M06-23`). */
  readonly panelCapacityTolerance: BasisPoints;
  /**
   * The band the panels' total must sit in, as a percent of the inverter's capacity (`M06-23`):
   * below it the inverter is too big, above it too small. Percent, since the top passes 100.
   */
  readonly inverterBandPercent: { readonly from: number; readonly to: number };
  /** The EMI example a proposal opens with (`M06-40`): a typical tenure and a typical yearly rate. */
  readonly emiExample: { readonly tenureYears: number; readonly rate: BasisPoints };
  /** What one exported unit earns, per kWh; zero where the market pays nothing for export (`M06-11`). */
  readonly exportRatePerKwh: MinorUnits;
  /** The yearly tariff rise a savings projection assumes until the person changes it (`M06-11`). */
  readonly tariffRise: BasisPoints;
  /** The horizon a lifetime projection runs over (`M06-11`). */
  readonly lifetimeYears: number;
  /**
   * The tariff a new proposal starts on, per kWh, until the person types the customer's own
   * (`M06-09`); `null` where the market states none, and the tariff is then asked for.
   */
  readonly typicalTariffPerKwh: MinorUnits | null;
  /** How likely an open proposal is to close, by where it stands (`M13-03`, `T-M13-007`). */
  readonly forecastLikelihood: readonly ForecastLikelihood[];
}

export interface ForecastLikelihood {
  readonly stage: ForecastStage;
  readonly likelihood: BasisPoints;
}

/** The market's likelihood for a stage, or `null` where it declares none: nothing is then forecast. */
export function forecastLikelihoodOf(
  facts: ProposalMarketFacts,
  stage: ForecastStage,
): BasisPoints | null {
  return facts.forecastLikelihood.find((declared) => declared.stage === stage)?.likelihood ?? null;
}

/**
 * India. No PRD row fixes these figures: each is the approved proposal design's own (owner
 * approval 2026-11-13), or the engineering band named beside it, and a change is a pack revision.
 */
export const IN_PROPOSAL_FACTS: ProposalMarketFacts = {
  /** The design's Check warns when the panels sit more than 10 % from the system size. */
  panelCapacityTolerance: basisPoints(1000),
  /** A DC-to-AC ratio of 0.8 to 1.3: `M06-23`'s own example — 3.47 kW of panels on a 5 kW inverter — sits outside it. */
  inverterBandPercent: { from: 80, to: 130 },
  /** The design's EMI example: 9.5 % a year over 60 months. */
  emiExample: { tenureYears: 5, rate: basisPoints(950) },
  /** Net metering sets units off against the bill and pays nothing beyond it, so export earns nothing. */
  exportRatePerKwh: minorUnits(0),
  /** The design's savings projection: the tariff rising 3 % a year. */
  tariffRise: basisPoints(300),
  /** `M06-11` — the 25-year horizon. */
  lifetimeYears: 25,
  /** The design's sample tariff, ₹9.50 a unit — a starting figure the person replaces with the bill's own. */
  typicalTariffPerKwh: minorUnits(950),
  /** The design's forecast card: 30 % shared or opened, 50 % wants changes, 90 % accepted. */
  forecastLikelihood: [
    { stage: 'shared', likelihood: basisPoints(3000) },
    { stage: 'negotiating', likelihood: basisPoints(5000) },
    { stage: 'accepted', likelihood: basisPoints(9000) },
  ],
};
