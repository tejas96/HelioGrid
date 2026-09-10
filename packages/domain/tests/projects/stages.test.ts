import { describe, expect, it } from 'vitest';
import { CANCELLED_STAGE, isTrancheDueStage, PROJECT_STAGE_CHAIN } from '../../src/projects/stages';

describe('isTrancheDueStage — a tranche falls due on a stage a project passes through (M01-54, M08-08)', () => {
  it.each(PROJECT_STAGE_CHAIN.map((stage) => [stage]))('accepts the chain stage %s', (stage) => {
    expect(isTrancheDueStage(stage)).toBe(true);
  });

  it('refuses the terminal a project leaves by, though it is a project stage', () => {
    expect(isTrancheDueStage(CANCELLED_STAGE)).toBe(false);
  });

  it.each([['WON'], ['booking'], [''], ['won ']])(
    'refuses %o — the chain is spelled one way',
    (value) => {
      expect(isTrancheDueStage(value)).toBe(false);
    },
  );
});
