import { describe, expect, it } from 'vitest';
import type { Certification } from '../../src/certification/pack';
import { IN_PACK } from '../../src/market/pack';
import { minorUnits } from '../../src/money/minor-units';
import type { SubsidyPack } from '../../src/subsidy/pack';
import {
  isIncentiveStageSkippable,
  isSubsidyAvailable,
  requiredSubsidySchemes,
  unmetSubsidySchemes,
} from '../../src/subsidy/path';

const NO_SUBSIDY: SubsidyPack = { offered: false };
const SOME_INCENTIVE = minorUnits(7_800_000);
const NO_INCENTIVE = minorUnits(0);

describe('isSubsidyAvailable — which segments the incentive reaches (F1-14, F1-52)', () => {
  it('reaches an IN residential deal', () => {
    expect(isSubsidyAvailable(IN_PACK.subsidy, 'residential')).toBe(true);
  });

  it('does not reach an IN commercial deal — its checklist row is omitted', () => {
    expect(isSubsidyAvailable(IN_PACK.subsidy, 'commercial')).toBe(false);
  });

  it('reaches nobody where the pack declares no subsidy', () => {
    expect(isSubsidyAvailable(NO_SUBSIDY, 'residential')).toBe(false);
  });
});

describe('requiredSubsidySchemes — the rule M06’s gate enforces (F1-19, F1-34)', () => {
  it('IN requires DCR on every component of a subsidy-path output', () => {
    expect(requiredSubsidySchemes(IN_PACK.subsidy)).toEqual(['DCR']);
  });

  it('a market declaring no subsidy requires nothing', () => {
    expect(requiredSubsidySchemes(NO_SUBSIDY)).toEqual([]);
  });
});

const DCR_COMPLIANT: Certification = { scheme: 'DCR', reference: null };
const ALMM_ONLY: Certification = { scheme: 'ALMM', reference: 'MNRE/ALMM/I/2026/0412' };

describe('unmetSubsidySchemes — what M06’s gate fails an output for (F1-19, F1-34)', () => {
  it('passes an IN component certified under DCR', () => {
    expect(unmetSubsidySchemes(IN_PACK.subsidy, [ALMM_ONLY, DCR_COMPLIANT])).toEqual([]);
  });

  it('names DCR on an IN component that is listed but not DCR', () => {
    expect(unmetSubsidySchemes(IN_PACK.subsidy, [ALMM_ONLY])).toEqual(['DCR']);
  });

  it('names DCR on a component carrying no certification at all — it fails closed', () => {
    expect(unmetSubsidySchemes(IN_PACK.subsidy, [])).toEqual(['DCR']);
  });

  it('passes every component where the pack declares no subsidy', () => {
    expect(unmetSubsidySchemes(NO_SUBSIDY, [])).toEqual([]);
  });
});

describe('isIncentiveStageSkippable — the claim stage (F1-14, F1-35)', () => {
  it('an IN residential project carrying an incentive must visit the stage', () => {
    expect(
      isIncentiveStageSkippable(IN_PACK.subsidy, {
        segment: 'residential',
        incentive: SOME_INCENTIVE,
      }),
    ).toBe(false);
  });

  it('an IN commercial project skips it', () => {
    expect(
      isIncentiveStageSkippable(IN_PACK.subsidy, {
        segment: 'commercial',
        incentive: SOME_INCENTIVE,
      }),
    ).toBe(true);
  });

  it('a project carrying no incentive skips it whatever its segment', () => {
    expect(
      isIncentiveStageSkippable(IN_PACK.subsidy, {
        segment: 'residential',
        incentive: NO_INCENTIVE,
      }),
    ).toBe(true);
  });

  it('every project skips it where the pack declares no subsidy — market-wide', () => {
    expect(
      isIncentiveStageSkippable(NO_SUBSIDY, { segment: 'residential', incentive: SOME_INCENTIVE }),
    ).toBe(true);
  });
});
