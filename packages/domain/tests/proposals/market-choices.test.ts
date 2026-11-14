import { describe, expect, it } from 'vitest';
import { IN_PACK } from '../../src/market/pack';
import { PROJECT_STAGE_CHAIN } from '../../src/projects/stages';
import { incentiveOfferedTo, trancheDueStages } from '../../src/proposals/market-choices';

const { formats, subsidy } = IN_PACK;
const WITHOUT_CLAIM = PROJECT_STAGE_CHAIN.filter((stage) => stage !== 'incentive_claimed');

describe('trancheDueStages — only the stages this segment’s projects visit (M06-13, T-M06-009)', () => {
  it.each([
    [
      'a home, which claims the incentive: the whole chain',
      subsidy,
      'residential',
      PROJECT_STAGE_CHAIN,
    ],
    ['a business, which skips the claim stage', subsidy, 'commercial', WITHOUT_CLAIM],
    [
      'a segment not known yet: the claim stage is not offered on a guess',
      subsidy,
      null,
      WITHOUT_CLAIM,
    ],
    ['a pack not read yet: likewise', null, 'residential', WITHOUT_CLAIM],
  ] as const)('%s', (_, pack, segment, stages) => {
    expect(trancheDueStages(formats, pack, segment)).toEqual(stages);
  });

  it('a segment the incentive reaches but the pack lets skip the stage is not offered it', () => {
    if (!subsidy.offered) throw new Error('the India pack offers an incentive');
    const skipping = {
      ...subsidy,
      incentiveStage: { skippableForSegments: ['residential' as const] },
    };
    expect(trancheDueStages(formats, skipping, 'residential')).toEqual(WITHOUT_CLAIM);
  });

  it('a market that offers no incentive skips the claim stage for everyone', () => {
    expect(trancheDueStages(formats, { offered: false }, 'residential')).toEqual(WITHOUT_CLAIM);
  });
});

describe('incentiveOfferedTo — the pack’s rule, there before any price (M06-38)', () => {
  it.each([
    ['a home on-grid system', 'residential', 'on_grid', true],
    ['a home hybrid system', 'residential', 'hybrid', true],
    ['an off-grid system is not offered it', 'residential', 'off_grid', false],
    ['a business is not offered it', 'commercial', 'on_grid', false],
  ] as const)('%s', (_, segment, systemType, offered) => {
    expect(incentiveOfferedTo(subsidy, segment, systemType)).toBe(offered);
  });

  it.each([
    ['the pack is not read yet', null, 'residential'],
    ['the lead’s segment is not known yet', subsidy, null],
  ] as const)('answers nothing while %s', (_, pack, segment) => {
    expect(incentiveOfferedTo(pack, segment, 'on_grid')).toBeNull();
  });
});
