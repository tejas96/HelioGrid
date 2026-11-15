import { describe, expect, it } from 'vitest';
import { forecastLikelihoodOf, IN_PROPOSAL_FACTS } from '../../src/format/proposal-facts';
import { FORECAST_STAGES } from '../../src/proposals/forecast-stage';

describe('forecastLikelihoodOf — how likely an open proposal is to close, by stage (M13-03)', () => {
  it.each([
    ['shared', 3000],
    ['negotiating', 5000],
    ['accepted', 9000],
  ] as const)('India gives %s %i basis points', (stage, likelihood) => {
    expect(forecastLikelihoodOf(IN_PROPOSAL_FACTS, stage)).toBe(likelihood);
  });

  it('India gives every stage one', () => {
    expect(IN_PROPOSAL_FACTS.forecastLikelihood.map((declared) => declared.stage)).toEqual(
      FORECAST_STAGES,
    );
  });

  it('a stage a market gives none forecasts nothing', () => {
    expect(
      forecastLikelihoodOf({ ...IN_PROPOSAL_FACTS, forecastLikelihood: [] }, 'shared'),
    ).toBeNull();
  });
});
