import type { SearchResults } from '@heliogrid/contracts';
import { describe, expect, it } from 'vitest';
import { searchHitsOf } from '../../src/search/search-hits';

/**
 * The search answer as the view reads it (`F6-20`, `F6-22`): an api built before proposals reads
 * as one that found none, and a standing this build cannot word is never drawn under a wrong one.
 */
const none = { items: [], total: 0 };
const base = { leads: none, customers: none, people: none, catalog: none };
const proposal = (id: string, standing: string) => ({
  id,
  number: 'PRP-0042',
  customerName: 'Anil Sharma',
  city: 'Pune',
  standing,
});

describe('searchHitsOf — the proposals group, whatever the api sent', () => {
  it.each([
    ['an api built before proposals', base as SearchResults, 0, []],
    [
      'the group as sent',
      {
        ...base,
        proposals: { items: [proposal('a', 'opened'), proposal('b', 'draft')], total: 7 },
      } as SearchResults,
      7,
      ['opened', 'draft'],
    ],
    [
      'a standing a newer server learned is left out of the rows and the count',
      {
        ...base,
        proposals: { items: [proposal('a', 'opened'), proposal('b', 'paused')], total: 2 },
      } as SearchResults,
      1,
      ['opened'],
    ],
  ])('%s', (_, results, total, standings) => {
    const { proposals } = searchHitsOf(results);

    expect(proposals.total).toBe(total);
    expect(proposals.items.map((hit) => hit.standing)).toEqual(standings);
  });
});
