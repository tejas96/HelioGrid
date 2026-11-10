import { describe, expect, it } from 'vitest';
import { IN_FORMATS } from '../../src/format/pack';
import {
  type SearchHits,
  type SearchLeadHit,
  type SearchOpens,
  type SearchReopenAct,
  type SearchViewFacts,
  searchFoundNothing,
  searchViewOf,
} from '../../src/search/search-view';

const PRIYA: SearchLeadHit = {
  id: 'lead-priya',
  name: 'Priya Sharma',
  phoneE164: '+919822014567',
  city: 'Nashik',
  stage: 'contacted',
  state: null,
  source: 'referral',
};
const SURESH: SearchLeadHit = {
  id: 'lead-suresh',
  name: null,
  phoneE164: '+919822036941',
  city: 'Sangli',
  stage: 'new',
  state: 'junk',
  source: 'quick_add',
};

const NONE = { total: 0, items: [] };
const HITS: SearchHits = {
  leads: { total: 214, items: [PRIYA, SURESH] },
  customers: {
    total: 1,
    items: [
      { id: 'cust-1', name: 'Deshmukh Cold Storage', phoneE164: '+919822020519', city: null },
    ],
  },
  people: { total: 0, items: [] },
  catalog: {
    total: 1,
    items: [{ id: 'item-1', kind: 'panel', brand: 'Waaree', model: 'WS-540' }],
  },
};

const OPENS_ALL: SearchOpens = { leadsList: true, team: true, catalog: true };

function facts(
  asked: string,
  more: Partial<SearchViewFacts<string>> = {},
): SearchViewFacts<string> {
  return {
    pack: IN_FORMATS,
    asked,
    readerId: 'me',
    opens: OPENS_ALL,
    canReopen: true,
    reopens: new Map(),
    ...more,
  };
}

const leadRow = (view: ReturnType<typeof searchViewOf<string>>, id: string) => {
  const row = view.groups.flatMap((group) => group.rows).find((one) => one.key === `lead:${id}`);
  if (row?.kind !== 'lead') throw new Error(`no lead row ${id}`);
  return row;
};

describe('searchViewOf — the groups as drawn (F6-20)', () => {
  it('draws only the groups that found something, in the one order, and walks their rows', () => {
    const view = searchViewOf(HITS, facts('98220'));
    expect(view.groups.map((group) => group.group)).toEqual(['leads', 'customers', 'catalog']);
    expect(view.order).toEqual([
      'lead:lead-priya',
      'lead:lead-suresh',
      'customer:cust-1',
      'catalog:item-1',
    ]);
  });

  it.each([
    ['a cut lead group opens the list with the query', OPENS_ALL, 'leads?q=Nashik%20west'],
    [
      'no See all where the Leads door is not the reader’s',
      { ...OPENS_ALL, leadsList: false },
      null,
    ],
  ])('%s', (_case, opens, seeAll) => {
    const view = searchViewOf(HITS, facts(' Nashik west ', { opens }));
    expect(view.groups[0]?.seeAll).toBe(seeAll);
    // A group shown whole, or one no list takes the query for, never offers See all.
    expect(view.groups.slice(1).every((group) => group.seeAll === null)).toBe(true);
  });

  it('a lead opens its detail; a customer opens the leads list on its number', () => {
    const view = searchViewOf(HITS, facts('98220'));
    expect(leadRow(view, 'lead-priya').address).toBe('leads/lead-priya');
    expect(view.groups[1]?.rows[0]?.address).toBe('leads?q=%2B919822020519');
  });

  it.each([
    ['the reader, to their profile', 'me', OPENS_ALL, 'more/profile'],
    ['a teammate, to the team for one who opens it', 'rajesh', OPENS_ALL, 'more/team'],
    ['a teammate, to nowhere for one who does not', 'rajesh', { ...OPENS_ALL, team: false }, null],
  ])('a person opens %s', (_case, userId, opens, address) => {
    const hits = { ...HITS, people: { total: 1, items: [{ userId, name: 'Someone' }] } };
    const person = searchViewOf(hits, facts('some', { opens })).groups.find(
      (group) => group.group === 'people',
    );
    expect(person?.rows[0]?.address).toBe(address);
  });

  it('an item opens the catalog only for one who opens it', () => {
    const closed = searchViewOf(HITS, facts('waaree', { opens: { ...OPENS_ALL, catalog: false } }));
    expect(closed.groups.at(-1)?.rows[0]?.address).toBeNull();
    expect(searchViewOf(HITS, facts('waaree')).groups.at(-1)?.rows[0]?.address).toBe(
      'more/catalog',
    );
  });
});

describe('searchViewOf — the number typed, marked and ranked', () => {
  it.each([
    ['98220', [4, 9]],
    ['9822014', [4, 12]],
    ['+91 98220 1', [4, 11]],
    ['098220', [4, 9]],
    ['priya', null],
    ['98221', null],
  ] as const)('%j marks %j in +91 98220 14567', (asked, typed) => {
    const row = leadRow(searchViewOf(HITS, facts(asked)), 'lead-priya');
    expect(row.number.shown).toBe('+91 98220 14567');
    expect(row.number.typed).toEqual(typed);
  });

  it.each([
    ['98220 14567', true],
    ['+919822014567', true],
    ['98220', false],
  ])('%j is an exact number match: %s', (asked, exact) => {
    expect(leadRow(searchViewOf(HITS, facts(asked)), 'lead-priya').exact).toBe(exact);
  });
});

describe('searchViewOf — a junk lead and its Reopen (F6-23)', () => {
  const reopenOf = (act: SearchReopenAct<string> | undefined, canReopen = true) => {
    const reopens = new Map(act === undefined ? [] : [['lead-suresh', act] as const]);
    return leadRow(searchViewOf(HITS, facts('98220', { reopens, canReopen })), 'lead-suresh');
  };

  it.each([
    ['offered, with nothing out', undefined, { kind: 'offered' }],
    ['waiting while out', { kind: 'waiting' }, { kind: 'waiting' }],
    [
      'back undone with its failure',
      { kind: 'returned', failure: 'offline' },
      { kind: 'returned', failure: 'offline' },
    ],
  ] as const)('Reopen is %s', (_case, act, reopen) => {
    const row = reopenOf(act);
    expect(row.state).toBe('junk');
    expect(row.reopen).toEqual(reopen);
  });

  it('a Reopen that landed draws the lead as it now stands, with no Reopen', () => {
    const row = reopenOf({ kind: 'reopened', stage: 'new', state: null });
    expect(row.state).toBeNull();
    expect(row.reopen).toBeNull();
  });

  it('a reader without the state-change grant sees the junk mark and no Reopen', () => {
    const row = reopenOf(undefined, false);
    expect(row.state).toBe('junk');
    expect(row.reopen).toBeNull();
  });

  it('an open lead offers no Reopen', () => {
    expect(leadRow(searchViewOf(HITS, facts('98220')), 'lead-priya').reopen).toBeNull();
  });
});

describe('searchFoundNothing', () => {
  it.each([
    [{ leads: NONE, customers: NONE, people: NONE, catalog: NONE }, true],
    [HITS, false],
  ])('%#', (hits, nothing) => {
    expect(searchFoundNothing(hits)).toBe(nothing);
  });
});
