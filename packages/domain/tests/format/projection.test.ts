import { describe, expect, it } from 'vitest';
import { UNCHECKED } from '../../src/format/freshness';
import { IN_FORMATS } from '../../src/format/pack';
import { statedAssumptions } from '../../src/format/projection';
import { compactQualified, qualifyMoney } from '../../src/format/qualified';
import { basisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';

/**
 * `F8-23` — a projection travels with the assumptions it rests on and never claims to be money
 * owed. The label that calls it a projection is the surface's; what this layer holds is that the
 * figure cannot be built without saying whether it is one, nor without its horizon.
 */
describe('a projection and its assumptions (F8-23)', () => {
  const LIFETIME = { horizonYears: 25, escalationRate: basisPoints(600) };
  const CLAIMED_OWED = {
    tier: 'derived',
    standing: 'confirmed',
    energySource: null,
    freshness: null,
    projection: LIFETIME,
  } as const;

  it.each([
    { standing: undefined, energySource: null, freshness: null, reads: null },
    { standing: 'provisional', energySource: null, freshness: null, reads: 'provisional' },
    { standing: 'pending', energySource: null, freshness: null, reads: 'pending' },
    { standing: 'reported', energySource: null, freshness: null, reads: 'reported' },
    {
      standing: undefined,
      energySource: { kind: 'estimate' },
      freshness: null,
      reads: 'provisional',
    },
    { standing: undefined, energySource: null, freshness: UNCHECKED, reads: 'provisional' },
    { standing: 'reported', energySource: null, freshness: UNCHECKED, reads: 'reported' },
  ] as const)(
    'a projection keeps the standing it claims, and reads provisional when it cannot be final (F8-23)',
    ({ standing, energySource, freshness, reads }) => {
      const savings = qualifyMoney(IN_FORMATS, 1_250_000, {
        tier: 'derived',
        standing,
        energySource,
        freshness,
        projection: LIFETIME,
      });
      expect(savings.standing).toBe(reads);
      expect(savings.tier).toBe('derived');
      expect(savings.projection).toEqual({ horizonYears: 25, escalationRate: 600 });
    },
  );

  /* Held by the type alone — vitest does not typecheck, so this is red only under `tsc`. */
  it('a projection cannot claim confirmed (F8-23)', () => {
    // @ts-expect-error — a projection is never money owed, so it cannot be `confirmed`.
    const claimed = qualifyMoney(IN_FORMATS, 1_250_000, CLAIMED_OWED);
    expect(claimed.projection).not.toBeNull();
    const owed = qualifyMoney(IN_FORMATS, 1_250_000, { ...CLAIMED_OWED, projection: null });
    expect(owed.standing).toBe('confirmed');
  });

  /* A LITERAL horizon, because `qualifiers()` does not list the projection — comparing two lists
     would stay green with the projection dropped from both. */
  it('keeps the projection and its assumptions however many times it is compacted', () => {
    const savings = qualifyMoney(IN_FORMATS, 9_200_000, {
      tier: 'derived',
      energySource: null,
      freshness: null,
      projection: {
        horizonYears: 1.5,
        interestRate: basisPoints(1050),
        incentive: minorUnits(7_800_000),
      },
    });
    const twice = compactQualified(IN_FORMATS, compactQualified(IN_FORMATS, savings));
    expect(twice.projection).toEqual({
      horizonYears: 1.5,
      interestRate: 1050,
      incentive: 7_800_000,
    });
  });

  it('a money figure must state whether it is a projection', () => {
    // @ts-expect-error — `projection` is required: `null` is said out loud, never left out.
    const unsaid = qualifyMoney(IN_FORMATS, 452471, {
      tier: 'derived',
      energySource: null,
      freshness: null,
    });
    expect(unsaid.projection).toBeNull();
  });

  it('a projection names its horizon, and its rates in basis points', () => {
    const qualify = (projection: Parameters<typeof qualifyMoney>[2]['projection']) =>
      qualifyMoney(IN_FORMATS, 452471, {
        tier: 'derived',
        energySource: null,
        freshness: null,
        projection,
      });
    // @ts-expect-error — a projection resting on nothing stated.
    expect(qualify({}).projection).toEqual({});
    // @ts-expect-error — a margin with no horizon.
    expect(qualify({ margin: basisPoints(2000) }).projection).toEqual({ margin: 2000 });
    // @ts-expect-error — a bare 6 where 600 basis points are due.
    expect(qualify({ horizonYears: 25, escalationRate: 6 }).projection).toMatchObject({
      horizonYears: 25,
    });
  });

  it('lists the assumptions a projection states, in one order however they were written', () => {
    expect(
      statedAssumptions({
        incentive: minorUnits(7_800_000),
        margin: basisPoints(2000),
        interestRate: basisPoints(1050),
        escalationRate: basisPoints(600),
        horizonYears: 25,
      }),
    ).toEqual([
      { kind: 'horizonYears', value: 25 },
      { kind: 'escalationRate', value: 600 },
      { kind: 'interestRate', value: 1050 },
      { kind: 'margin', value: 2000 },
      { kind: 'incentive', value: 7_800_000 },
    ]);
    expect(statedAssumptions({ horizonYears: 1.5 })).toEqual([
      { kind: 'horizonYears', value: 1.5 },
    ]);
    /* A flat tariff and no incentive are stated assumptions too: zero is listed, never dropped. */
    expect(
      statedAssumptions({
        horizonYears: 25,
        escalationRate: basisPoints(0),
        incentive: minorUnits(0),
      }),
    ).toEqual([
      { kind: 'horizonYears', value: 25 },
      { kind: 'escalationRate', value: 0 },
      { kind: 'incentive', value: 0 },
    ]);
  });
});
