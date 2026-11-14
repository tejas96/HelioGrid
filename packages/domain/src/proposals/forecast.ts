import { forecastLikelihoodOf, type ProposalMarketFacts } from '../format/proposal-facts';
import { applyRate, type BasisPoints } from '../money/basis-points';
import { type MinorUnits, sumMinorUnits, wholeMajorUnits } from '../money/minor-units';
import { FORECAST_STAGES, type ForecastStage } from './forecast-stage';

/**
 * The forecast (`M13-03`, `T-M13-007`): what the open proposals are worth, weighted by how likely
 * each is to close. A projection — expected, not promised — and NEVER in a total with Won: a won
 * deal is not an input here, so the two cannot be summed by this function at all.
 */

/**
 * Open proposals as the forecast reads them: where they stand, how many, and their latest shared
 * payables summed — the database groups them, so a company's whole pipeline is never read row by row.
 */
export interface OpenProposalValue {
  readonly stage: ForecastStage;
  readonly count: number;
  readonly value: MinorUnits;
}

export interface ForecastStageRow {
  readonly stage: ForecastStage;
  readonly count: number;
  /** The payables of the proposals at this stage, unweighted. */
  readonly total: MinorUnits;
  readonly likelihood: BasisPoints;
  /** `total × likelihood` to the whole major unit — this stage's part of the forecast, an estimate. */
  readonly expected: MinorUnits;
}

export interface PipelineForecast {
  /** A row per stage the market gives a likelihood, in `FORECAST_STAGES` order — an empty stage too. */
  readonly stages: readonly ForecastStageRow[];
  /** The weighted figure: the sum of each stage's `expected`. */
  readonly expected: MinorUnits;
  /** How many open proposals stand behind it. */
  readonly count: number;
}

/**
 * The weighted pipeline over the open proposals; a stage the market gives no likelihood forecasts
 * nothing. Each expectation is an estimate, so it is whole major units of the currency
 * (`minorUnitDigits`); the payables it weighs stay exact.
 */
export function pipelineForecast(
  market: ProposalMarketFacts,
  minorUnitDigits: number,
  open: readonly OpenProposalValue[],
): PipelineForecast {
  const stages = FORECAST_STAGES.flatMap((stage): ForecastStageRow[] => {
    const likelihood = forecastLikelihoodOf(market, stage);
    if (likelihood === null) return [];
    const here = open.filter((proposal) => proposal.stage === stage);
    const total = sumMinorUnits(here.map((proposal) => proposal.value));
    return [
      {
        stage,
        count: here.reduce((count, group) => count + group.count, 0),
        total,
        likelihood,
        expected: wholeMajorUnits(applyRate(total, likelihood), minorUnitDigits),
      },
    ];
  });
  return {
    stages,
    expected: sumMinorUnits(stages.map((row) => row.expected)),
    count: stages.reduce((count, row) => count + row.count, 0),
  };
}
