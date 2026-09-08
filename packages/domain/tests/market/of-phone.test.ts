import { describe, expect, it } from 'vitest';
import { IN_FORMATS } from '../../src/format/pack';
import { marketOfPhone } from '../../src/market/of-phone';
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
