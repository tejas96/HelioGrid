import { describe, expect, it } from 'vitest';
import { IN_FORMATS } from '../../src/format/pack';
import {
  compactQualified,
  qualifiers,
  qualifyMinorUnits,
  qualifyMoney,
  weakestTier,
} from '../../src/format/qualified';
import { minorUnits } from '../../src/money/minor-units';

/**
 * `F3-24` — the format layer carries every honesty obligation WITH the value and never drops one
 * to fit. The three laws it joins: exactly one tier on every figure (`F8-01`), a figure that is
 * not reconciled reads provisional (`F8-12`), and one figure renders one way everywhere with the
 * same tier and the same disclosure (`F8-24`).
 *
 * The defect these cases exist to catch is a narrow one and a real one: the amount renders, the
 * label does not, and the screen looks finished.
 */

const MEASURED = { tier: 'measured' } as const;

describe('a figure cannot be rendered without its tier (F8-01)', () => {
  it('carries the tier it was built with', () => {
    const qualified = qualifyMoney(IN_FORMATS, 452471, MEASURED);
    expect(qualified.text).toBe('₹4,52,471');
    expect(qualified.tier).toBe('measured');
  });
});

describe('compacting keeps every qualifier the full rendering carried (F3-24)', () => {
  const qualified = qualifyMoney(IN_FORMATS, 9_200_000, {
    tier: 'estimated',
    standing: 'provisional',
    disclosure: 'Excludes subsidy',
  });

  it('compacts the figure and nothing else', () => {
    const compact = compactQualified(IN_FORMATS, qualified);
    expect(compact.text).toBe('₹92L');
    expect(compact.tier).toBe(qualified.tier);
    expect(compact.standing).toBe(qualified.standing);
    expect(compact.disclosure).toBe(qualified.disclosure);
  });

  it('drops no qualifier however many times it is compacted', () => {
    const twice = compactQualified(IN_FORMATS, compactQualified(IN_FORMATS, qualified));
    expect(qualifiers(twice)).toEqual(qualifiers(qualified));
  });
});

describe('one figure renders one way for every reader (F8-24)', () => {
  it('is the same object, so two surfaces cannot disagree', () => {
    const once = qualifyMoney(IN_FORMATS, 452471.5, { tier: 'derived' });
    const again = qualifyMoney(IN_FORMATS, 452471.5, { tier: 'derived' });
    expect(again).toEqual(once);
  });

  it('prints an amount that must reconcile to the minor unit, never the screen default', () => {
    const qualified = qualifyMinorUnits(IN_FORMATS, minorUnits(4_527_101), { tier: 'measured' });
    expect(qualified.text).toBe('₹45,271.01');
  });
});

describe('a figure that is not reconciled reads provisional (F8-12)', () => {
  it('keeps the standing beside the amount rather than beside the screen', () => {
    const qualified = qualifyMoney(IN_FORMATS, 452471, {
      tier: 'derived',
      standing: 'provisional',
    });
    expect(qualified.standing).toBe('provisional');
    expect(qualifiers(qualified)).toContain('provisional');
  });

  it('omits what was never claimed rather than inventing a standing', () => {
    const qualified = qualifyMoney(IN_FORMATS, 452471, MEASURED);
    expect(qualified.standing).toBeNull();
    expect(qualified.disclosure).toBeNull();
    expect(qualifiers(qualified)).toEqual(['measured']);
  });
});

describe('an unrenderable amount carries no figure and still carries its tier', () => {
  it('renders nothing rather than NaN, and does not lose the label with it', () => {
    const qualified = qualifyMoney(IN_FORMATS, null, MEASURED);
    expect(qualified.text).toBe('');
    expect(qualified.tier).toBe('measured');
  });
});

/**
 * `F8-04` — an aggregate is only as strong as its weakest member. The neighbouring pairs carry
 * LITERAL answers, so a reorder of the tier tuple turns this table red rather than moving with it.
 */
describe('weakestTier', () => {
  it.each([
    { members: ['measured', 'derived'], weakest: 'derived' },
    { members: ['derived', 'estimated'], weakest: 'estimated' },
    { members: ['estimated', 'assumed'], weakest: 'assumed' },
    { members: ['assumed', 'measured'], weakest: 'assumed' },
    { members: ['derived', 'derived'], weakest: 'derived' },
    { members: ['measured'], weakest: 'measured' },
  ] as const)("an aggregate carries its weakest member's tier (F8-04)", ({ members, weakest }) => {
    expect(weakestTier(members)).toBe(weakest);
  });

  it.each([
    { members: [] },
    { members: ['measured', null] },
    { members: [null, 'assumed'] },
  ] as const)(
    'an aggregate with no members, or an unknown one, has no tier (F8-01)',
    ({ members }) => {
      expect(weakestTier(members)).toBeNull();
    },
  );
});
