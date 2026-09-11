import { describe, expect, it } from 'vitest';
import { IN_FORMATS } from '../../src/format/pack';
import { marketOfPhone, phoneReach } from '../../src/market/of-phone';
import { IN_PACK, type MarketPack } from '../../src/market/pack';

/** A second, imaginary market whose dial code is a prefix of India's — the longest-match case. */
const NINE_PACK: MarketPack = {
  ...IN_PACK,
  formats: { ...IN_FORMATS, phone: { ...IN_FORMATS.phone, dialCode: '+9' } },
};

describe('marketOfPhone — the market a number belongs to, by dial code (F1-49, M01-01)', () => {
  it('resolves an Indian number to the India pack', () => {
    expect(marketOfPhone([IN_PACK], '+919845027746')).toBe(IN_PACK);
  });

  it('claims nothing for a number no authored market covers', () => {
    expect(marketOfPhone([IN_PACK], '+14155550100')).toBeNull();
    expect(marketOfPhone([], '+919845027746')).toBeNull();
  });

  it('lets the longest dial code win, whatever order the packs come in', () => {
    expect(marketOfPhone([NINE_PACK, IN_PACK], '+919845027746')).toBe(IN_PACK);
    expect(marketOfPhone([IN_PACK, NINE_PACK], '+919845027746')).toBe(IN_PACK);
    expect(marketOfPhone([IN_PACK, NINE_PACK], '+96612345678')).toBe(NINE_PACK);
  });
});

describe('phoneReach — whether the platform can send to a number (F1-49): market, allowlist, length', () => {
  it('reaches a well-formed number of an authored market', () => {
    expect(phoneReach([IN_PACK], '+919845027746')).toEqual({ kind: 'reachable', pack: IN_PACK });
  });

  it('names no market for a number no authored market covers', () => {
    expect(phoneReach([IN_PACK], '+14155550100')).toEqual({ kind: 'no-market' });
  });

  it('refuses a number the market’s allowlist does not cover', () => {
    const closed: MarketPack = {
      ...IN_PACK,
      formats: { ...IN_FORMATS, otpDestinationDialCodes: ['+1'] },
    };
    expect(phoneReach([closed], '+919845027746')).toEqual({ kind: 'not-allowed', pack: closed });
  });

  it.each([
    ['+91979072813', 9],
    ['+9198450277461', 11],
    ['+91', 0],
  ])('refuses %s, whose national part has %i digits where the market fixes ten', (phone, typed) => {
    expect(phoneReach([IN_PACK], phone)).toEqual({
      kind: 'wrong-length',
      pack: IN_PACK,
      typed,
      needed: IN_FORMATS.phone.nsnLength,
    });
  });
});
