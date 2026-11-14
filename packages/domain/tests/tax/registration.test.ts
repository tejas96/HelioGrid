import { describe, expect, it } from 'vitest';
import { IN_AREAS } from '../../src/format/areas-in';
import { packLabel } from '../../src/format/languages';
import { IN_TAX } from '../../src/tax/pack';
import { checkTaxRegistration, placeOfArea, placeOfRegistration } from '../../src/tax/registration';

describe('checkTaxRegistration — the format, explained, never a wall (M01-25, F1-13)', () => {
  it.each([['27ABCDE1234F1Z5'], ['07AAACI1681G1ZY'], ['29AAAAA0000A1Z0']])(
    'accepts a well-formed value %s',
    (value) => {
      expect(checkTaxRegistration(IN_TAX, 'IN_GST', value)).toEqual({ ok: true });
    },
  );

  it.each([
    ['27ABCDE1234F1Z'],
    ['27ABCDE1234F1Z55'],
    ['27abcde1234f1z5'],
    ['2AABCDE1234F1Z5'],
    ['27ABCDE1234F0Z5'],
    ['27ABCDE1234F1X5'],
    [''],
  ])('explains %o against the market’s format, in the reader’s language', (value) => {
    const check = checkTaxRegistration(IN_TAX, 'IN_GST', value);
    expect(check.ok).toBe(false);
    if (check.ok || check.reason !== 'malformed') throw new Error('expected malformed');
    expect(packLabel(check.format, 'en')).toContain('15 characters');
    expect(packLabel(check.format, 'mr')).toContain('15 अक्षरे');
    expect(packLabel(check.format, 'en')).toContain('27ABCDE1234F1Z5');
  });

  it('refuses a type the market never declared, with no format to explain', () => {
    expect(checkTaxRegistration(IN_TAX, 'IN_PAN', 'ABCDE1234F')).toEqual({
      ok: false,
      reason: 'unknown_type',
    });
  });
});

describe('placeOfArea — a customer’s region as the place rule compares it (M06-34)', () => {
  it.each([
    ['IN-MH', '27'],
    ['IN-GJ', '24'],
    ['IN-DL', '07'],
    ['IN-LA', '38'],
  ])('%s is place %s, the code a GSTIN opens with', (area, place) => {
    expect(placeOfArea(IN_TAX, area)).toBe(place);
  });

  it('an area the scheme names no place for has none, never a guessed one', () => {
    expect(placeOfArea(IN_TAX, 'IN-XX')).toBeNull();
    expect(placeOfArea(IN_TAX, 'Maharashtra')).toBeNull();
  });

  it('every area the pack offers has its place, and each place is one area’s', () => {
    expect(IN_AREAS.filter((area) => placeOfArea(IN_TAX, area.code) === null)).toEqual([]);
    const places = IN_TAX.placeOfSupply.placeByArea.map((declared) => declared.place);
    const areas = IN_TAX.placeOfSupply.placeByArea.map((declared) => declared.area);
    expect(new Set(places).size).toBe(places.length);
    expect(new Set(areas).size).toBe(areas.length);
  });

  it('a registration’s own place is the same vocabulary', () => {
    const maharashtra = { registrationType: 'IN_GST', value: '27ABCDE1234F1Z5' };
    expect(placeOfRegistration(IN_TAX, maharashtra)).toBe(placeOfArea(IN_TAX, 'IN-MH'));
  });
});
