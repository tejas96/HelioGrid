import { describe, expect, it } from 'vitest';
import { type FormatPack, IN_FORMATS } from '../../src/format/pack';
import { formatPhone } from '../../src/format/phone';

/** A market that declares no grouping — the digits stay one run. */
const UNGROUPED: FormatPack = {
  ...IN_FORMATS,
  phone: { ...IN_FORMATS.phone, nsnGroups: [] },
};
/** A market with no calling code, so the dial-code branch cannot fire. */
const NO_DIAL_CODE: FormatPack = {
  ...IN_FORMATS,
  phone: { ...IN_FORMATS.phone, dialCode: '' },
};

describe('formatPhone — display only; storage stays E.164 (F1-49)', () => {
  it('groups a national number the way the market reads it', () => {
    expect(formatPhone(IN_FORMATS, '+919845027746')).toBe('+91 98450 27746');
  });

  it('renders the national number alone for a field that owns its dial code', () => {
    expect(formatPhone(IN_FORMATS, '9845027746', { nationalOnly: true })).toBe('98450 27746');
    /* The stored value is E.164; the field shows `+91` beside it. Grouping the country code
       INTO the national number renders `91984 5027746` — a different number entirely. */
    expect(formatPhone(IN_FORMATS, '+919845027746', { nationalOnly: true })).toBe('98450 27746');
  });

  it('groups bare digits that carry no country code', () => {
    expect(formatPhone(IN_FORMATS, '9845027746')).toBe('98450 27746');
  });

  it('leaves a number from another market exactly as it arrived', () => {
    /* India's 5+5 applied to a US number renders `14155 551234` — unreadable, and it looks
       like an Indian number that lost a digit. Relabelling it `+91` would be worse. */
    expect(formatPhone(IN_FORMATS, '+14155551234')).toBe('+14155551234');
  });

  it('keeps surplus digits in the last group rather than dropping them', () => {
    /* A number longer than the market expects renders WHOLE and visibly wrong, never short
       and plausible — a truncated phone number is a call that never happens. */
    expect(formatPhone(IN_FORMATS, '98450277461234', { nationalOnly: true })).toBe(
      '98450 277461234',
    );
  });

  it('returns one run of digits where a market declares no grouping', () => {
    expect(formatPhone(UNGROUPED, '+919845027746')).toBe('+91 9845027746');
  });

  it('groups from the start when the market has no calling code', () => {
    expect(formatPhone(NO_DIAL_CODE, '9845027746')).toBe('98450 27746');
  });

  it.each([[''], ['   ']])('renders %o as nothing to group', (value) => {
    expect(formatPhone(IN_FORMATS, value)).toBe('');
  });
});
