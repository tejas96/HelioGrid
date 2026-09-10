import { describe, expect, it } from 'vitest';
import { packLabel } from '../../src/format/languages';
import { IN_TAX } from '../../src/tax/pack';
import { checkTaxRegistration } from '../../src/tax/registration';

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
