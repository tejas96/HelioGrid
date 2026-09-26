import { describe, expect, it } from 'vitest';
import { IN_MARKET } from '../../src/market/code';
import { marketOf, packVersion, revisionOf } from '../../src/market/version';

describe('packVersion — the identity an output pins (F1-11)', () => {
  it.each([
    [1, 'IN.1'],
    [12, 'IN.12'],
  ])('revision %i of the India pack reads %s', (revision, expected) => {
    expect(packVersion(IN_MARKET, revision)).toBe(expected);
  });

  it.each([[0], [-1], [1.5], [Number.NaN]])('refuses %o as a revision', (revision) => {
    /* A revision numbers a PUBLISHED data update, so the first one is 1. Anything else is an
       authoring error, thrown where the pack is authored rather than pinned into an output. */
    expect(() => packVersion(IN_MARKET, revision)).toThrow(RangeError);
  });
});

describe('marketOf and revisionOf — a version read back into its parts', () => {
  it('reads the market and the revision a version was minted from', () => {
    const version = packVersion(IN_MARKET, 12);
    expect(marketOf(version)).toBe('IN');
    expect(revisionOf(version)).toBe(12);
  });
});
