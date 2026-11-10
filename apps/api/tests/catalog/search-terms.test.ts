import { describe, expect, it } from 'vitest';
import { prefixTermsOf } from '../../src/modules/catalog/internal/search-terms';

/**
 * A search text as the list's full-text query (`M01-38`, decision 2): each word a prefix, every
 * word required, punctuation never reaching `to_tsquery` — where it would be syntax, not text. A
 * word of digits also matches the signed number the parser stores after a hyphen.
 */
describe('prefixTermsOf', () => {
  it.each([
    ['waaree', 'waaree:*'],
    ['Waa 55', 'waa:* & (55:* | -55:*)'],
    ['  WS-550 ', 'ws:* & (550:* | -550:*)'],
    ['NP-1', 'np:* & (1:* | -1:*)'],
    ['GW3000-NS', 'gw3000:* & ns:*'],
    ['0', '(0:* | -0:*)'],
    ["a&b|c!(d):*'", 'a:* & b:* & c:* & d:*'],
    ['सौर पैनल', 'सौर:* & पैनल:*'],
  ])('%j reads as %j', (text, terms) => {
    expect(prefixTermsOf(text)).toBe(terms);
  });

  it.each([[''], ['   '], ['&|!:*()'], [undefined]])('%j filters nothing', (text) => {
    expect(prefixTermsOf(text)).toBeNull();
  });
});
