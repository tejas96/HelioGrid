import { describe, expect, it } from 'vitest';
import { winRateOf } from '../../src/dashboards/win-rate';

describe('winRateOf — closed deals only, too few below five (M13-27, M13-18)', () => {
  it.each([
    [0, 0, { kind: 'too_few', won: 0, lost: 0 }],
    [2, 2, { kind: 'too_few', won: 2, lost: 2 }],
    [1, 4, { kind: 'rate', won: 1, lost: 4, basisPoints: 2000 }],
    [0, 5, { kind: 'rate', won: 0, lost: 5, basisPoints: 0 }],
    [5, 0, { kind: 'rate', won: 5, lost: 0, basisPoints: 10_000 }],
    [13, 29, { kind: 'rate', won: 13, lost: 29, basisPoints: 3095 }],
    [1, 7, { kind: 'rate', won: 1, lost: 7, basisPoints: 1250 }],
  ] as const)('%i won, %i lost → %o', (won, lost, rate) => {
    expect(winRateOf(won, lost)).toEqual(rate);
  });
});
