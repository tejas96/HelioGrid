import { describe, expect, it } from 'vitest';
import { IN_FORMATS } from '../../src/format/pack';
import { searchQueryOf } from '../../src/search/query';
import { rankSearchHits, type SearchCandidate, searchMatchOf } from '../../src/search/ranking';

const query = (typed: string) => searchQueryOf(IN_FORMATS, typed);

const PRIYA: SearchCandidate = {
  phonesE164: ['+919845027746', '+919800000001'],
  name: 'Priya Sharma',
  city: 'Nashik',
};

describe('searchMatchOf — plain ranking (F6-25)', () => {
  it.each([
    ['98450 27746', 'exact_phone'],
    ['+91 98000 00001', 'exact_phone'],
    ['98450', 'phone_prefix'],
    ['098000', 'phone_prefix'],
    ['priya', 'name_or_city'],
    ['sharma pri', 'name_or_city'],
    ['nash', 'name_or_city'],
    ['priya nashik', 'name_or_city'],
    ['priya pune', null],
    ['arma', null],
    ['77746', null],
    ['', null],
  ])('%j matches as %s', (typed, match) => {
    expect(searchMatchOf(query(typed), PRIYA)).toBe(match);
  });

  it('a record with no city still matches by name', () => {
    expect(searchMatchOf(query('NP-1'), { phonesE164: [], name: 'NP-1', city: null })).toBe(
      'name_or_city',
    );
  });
});

describe('rankSearchHits — exact phone, then phone prefix, then name or city', () => {
  it('ranks by match and keeps the server’s order within one rank', () => {
    const hits: readonly (SearchCandidate & { readonly id: string })[] = [
      { id: 'city-match', phonesE164: ['+919111111111'], name: 'Anil', city: 'Pune 98450' },
      { id: 'other-way', phonesE164: [], name: 'Unrelated', city: null },
      { id: 'prefix-1', phonesE164: ['+919845011111'], name: 'Meera', city: null },
      { id: 'exact', phonesE164: ['+919845027746'], name: 'Priya', city: null },
      { id: 'prefix-2', phonesE164: ['+919845099999'], name: 'Ravi', city: null },
    ];
    expect(rankSearchHits(hits, query('98450'), (hit) => hit).map((hit) => hit.id)).toEqual([
      'prefix-1',
      'exact',
      'prefix-2',
      'city-match',
      'other-way',
    ]);
    expect(rankSearchHits(hits, query('98450 27746'), (hit) => hit).map((hit) => hit.id)).toEqual([
      'exact',
      'city-match',
      'other-way',
      'prefix-1',
      'prefix-2',
    ]);
  });
});
