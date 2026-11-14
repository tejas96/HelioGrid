import { describe, expect, it } from 'vitest';
import { IN_PROPOSAL_FACTS } from '../../src/format/proposal-facts';
import { minorUnits } from '../../src/money/minor-units';
import { pipelineForecast } from '../../src/proposals/forecast';
import { proposalNumberOf } from '../../src/proposals/number';

describe('pipelineForecast — value × likelihood, by stage (M13-03)', () => {
  it('the approved design’s card: three shared, one negotiating, one accepted', () => {
    const forecast = pipelineForecast(IN_PROPOSAL_FACTS, 2, [
      { stage: 'shared', count: 1, value: minorUnits(60_952_500) },
      { stage: 'shared', count: 1, value: minorUnits(60_952_500) },
      { stage: 'shared', count: 1, value: minorUnits(60_952_500) },
      { stage: 'negotiating', count: 1, value: minorUnits(30_000_000) },
      { stage: 'accepted', count: 1, value: minorUnits(19_057_500) },
    ]);
    expect(forecast.stages).toEqual([
      { stage: 'shared', count: 3, total: 182_857_500, likelihood: 3000, expected: 54_857_300 },
      { stage: 'negotiating', count: 1, total: 30_000_000, likelihood: 5000, expected: 15_000_000 },
      { stage: 'accepted', count: 1, total: 19_057_500, likelihood: 9000, expected: 17_151_800 },
    ]);
    expect(forecast.expected).toBe(87_009_100);
    expect(forecast.count).toBe(5);
  });

  it('proposals grouped by stage weigh as they do one by one', () => {
    const forecast = pipelineForecast(IN_PROPOSAL_FACTS, 2, [
      { stage: 'shared', count: 3, value: minorUnits(182_857_500) },
      { stage: 'accepted', count: 1, value: minorUnits(19_057_500) },
    ]);
    expect(forecast.stages[0]).toEqual({
      stage: 'shared',
      count: 3,
      total: 182_857_500,
      likelihood: 3000,
      expected: 54_857_300,
    });
    expect(forecast.count).toBe(4);
  });

  it.each([
    ['₹1.50 rounds up to ₹2', 500, 200],
    ['₹1.49 rounds down to ₹1', 497, 100],
    ['₹3 stays ₹3', 1000, 300],
    ['nothing stays nothing', 0, 0],
  ])('an estimate is whole rupees, the payables exact: %s', (_, paise, expected) => {
    const forecast = pipelineForecast(IN_PROPOSAL_FACTS, 2, [
      { stage: 'shared', count: 1, value: minorUnits(paise) },
    ]);
    expect(forecast.stages[0]).toMatchObject({ total: paise, expected });
    expect(forecast.expected).toBe(expected);
  });

  it('no open proposal forecasts nothing, each stage still a row', () => {
    const forecast = pipelineForecast(IN_PROPOSAL_FACTS, 2, []);
    expect(forecast.expected).toBe(0);
    expect(forecast.count).toBe(0);
    expect(forecast.stages.map((row) => [row.stage, row.count])).toEqual([
      ['shared', 0],
      ['negotiating', 0],
      ['accepted', 0],
    ]);
  });

  it('a stage the market gives no likelihood forecasts nothing and counts nothing', () => {
    const market = {
      ...IN_PROPOSAL_FACTS,
      forecastLikelihood: IN_PROPOSAL_FACTS.forecastLikelihood.filter(
        (declared) => declared.stage !== 'shared',
      ),
    };
    const forecast = pipelineForecast(market, 2, [
      { stage: 'shared', count: 1, value: minorUnits(1_000_000) },
      { stage: 'accepted', count: 1, value: minorUnits(1_000_000) },
    ]);
    expect(forecast.stages.map((row) => row.stage)).toEqual(['negotiating', 'accepted']);
    expect(forecast.expected).toBe(900_000);
    expect(forecast.count).toBe(1);
  });
});

describe('proposalNumberOf — PRP-0001, beside PRJ- and RCPT- (M06-44)', () => {
  it.each([
    [1, 'PRP-0001'],
    [42, 'PRP-0042'],
    [9999, 'PRP-9999'],
    [10_000, 'PRP-10000'],
  ])('%i reads %s', (sequence, number) => {
    expect(proposalNumberOf(sequence)).toBe(number);
  });
});
