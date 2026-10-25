import { describe, expect, it } from 'vitest';
import { sameContent, standingOf } from '../../src/tenancy/settings-page';

describe('sameContent — a draft against what is saved', () => {
  it.each([
    ['keys in another order', { a: 1, b: { c: 2, d: 3 } }, { b: { d: 3, c: 2 }, a: 1 }, true],
    ['an undefined key', { a: 1, b: undefined }, { a: 1 }, true],
    ['a list in another order', [1, 2], [2, 1], false],
    ['null and an empty object', null, {}, false],
  ])('%s', (_case, a, b, same) => {
    expect(sameContent(a, b)).toBe(same);
  });
});

describe('standingOf — a save the read names', () => {
  it.each([
    ['absent', undefined, null],
    ['never saved', null, null],
    [
      'a save',
      { at: '2026-08-28T10:00:00Z', by: { name: 'Rajesh' } },
      { kind: 'saved', at: Date.parse('2026-08-28T10:00:00Z'), name: 'Rajesh' },
    ],
    [
      'a save by nobody known',
      { at: '2026-08-28T10:00:00Z', by: null },
      { kind: 'saved', at: Date.parse('2026-08-28T10:00:00Z'), name: null },
    ],
  ] as const)('%s', (_case, changed, standing) => {
    expect(standingOf(changed)).toEqual(standing);
  });
});
