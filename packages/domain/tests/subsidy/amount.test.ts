import { describe, expect, it } from 'vitest';
import { IN_PACK } from '../../src/market/pack';
import { minorUnits } from '../../src/money/minor-units';
import { subsidyAmount } from '../../src/subsidy/amount';
import { IN_SUBSIDY, type SubsidyModel, type SubsidyPack } from '../../src/subsidy/pack';

/** ₹30,000 · ₹18,000 · the ₹78,000 headline, in paise — the IN ladder's own arithmetic (F1-33). */
const THIRTY_THOUSAND = 3_000_000;
const FORTY_EIGHT_THOUSAND = 4_800_000;
const SIXTY_THOUSAND = 6_000_000;
const SEVENTY_EIGHT_THOUSAND = 7_800_000;

const NO_SUBSIDY: SubsidyPack = { offered: false };

function residential(capacityKwp: number, region: string | null = null) {
  return { segment: 'residential', capacityKwp, region } as const;
}

describe('subsidyAmount — PM Surya Ghar over capacity (F1-33)', () => {
  it.each([
    [0.5, THIRTY_THOUSAND / 2],
    [1, THIRTY_THOUSAND],
    [2, SIXTY_THOUSAND],
    [2.5, SIXTY_THOUSAND + 900_000],
    [3, SEVENTY_EIGHT_THOUSAND],
    [4, SEVENTY_EIGHT_THOUSAND],
    [500, SEVENTY_EIGHT_THOUSAND],
  ])('a %d kWp residential system earns %d paise', (capacityKwp, expected) => {
    expect(subsidyAmount(IN_PACK.subsidy, residential(capacityKwp))).toBe(expected);
  });

  it('caps at the ladder’s own sum, never at a second number authored beside it', () => {
    const ladder = IN_SUBSIDY.slabs.reduce((total, slab) => total + slab.perKw * slab.kw, 0);
    expect(subsidyAmount(IN_PACK.subsidy, residential(9))).toBe(ladder);
  });

  it.each([0, -1])('earns nothing at %d kWp — there is no system to subsidise', (capacityKwp) => {
    expect(subsidyAmount(IN_PACK.subsidy, residential(capacityKwp))).toBe(0);
  });

  it('earns nothing for a commercial deal — the scheme is residential rooftop', () => {
    expect(
      subsidyAmount(IN_PACK.subsidy, { segment: 'commercial', capacityKwp: 3, region: null }),
    ).toBe(0);
  });

  it('earns nothing where the pack declares no subsidy (F1-14)', () => {
    expect(subsidyAmount(NO_SUBSIDY, residential(3))).toBe(0);
  });
});

describe('subsidyAmount — the geography axis (F1-14, F1-33)', () => {
  /** IN authors no state top-up, so the axis is exercised on a pack that does (Q84). */
  const WITH_TOP_UP: SubsidyModel = {
    ...IN_SUBSIDY,
    regionalTopUps: [{ region: 'MH', slabs: [{ kw: 2, perKw: minorUnits(1_000_000) }] }],
  };

  it('adds the deal region’s ladder on top of the market’s', () => {
    expect(subsidyAmount(WITH_TOP_UP, residential(3, 'MH'))).toBe(
      SEVENTY_EIGHT_THOUSAND + 2_000_000,
    );
  });

  it('gives another region the market ladder alone', () => {
    expect(subsidyAmount(WITH_TOP_UP, residential(3, 'KA'))).toBe(SEVENTY_EIGHT_THOUSAND);
  });

  it('gives an unknown region the market ladder alone, never a guessed one’s', () => {
    expect(subsidyAmount(WITH_TOP_UP, residential(3))).toBe(SEVENTY_EIGHT_THOUSAND);
  });

  it('IN grants no top-up in any state today', () => {
    expect(subsidyAmount(IN_PACK.subsidy, residential(3, 'MH'))).toBe(SEVENTY_EIGHT_THOUSAND);
  });
});

describe('subsidyAmount — a component that fails the scheme is the gate’s, not the maths’', () => {
  it('still computes the amount, so M06’s Generate gate has an output to fail (F1-34)', () => {
    expect(subsidyAmount(IN_PACK.subsidy, residential(1.6))).toBe(FORTY_EIGHT_THOUSAND);
  });
});
