import { describe, expect, it } from 'vitest';
import {
  type MergeChoices,
  type MergePreviewRead,
  mergeCandidatesOf,
  mergePicksOf,
  mergeUnavailableOf,
  mergeViewOf,
} from '../../src/crm/merge-view';

/** Sunita and Vinayak enquired separately: one family, two records. */
const SUNITA = {
  customerId: 'sunita',
  name: 'Sunita Kulkarni',
  phoneE164: '+919823066710',
  city: 'Satara',
};
const VINAYAK = {
  customerId: 'vinayak',
  name: 'Vinayak Kulkarni',
  phoneE164: '+919823041952',
  city: 'Godoli, Satara',
};
const MOVES = { contacts: 1, leads: 1, activities: 6, referrals: 0, visits: 1, tasks: 2, files: 0 };

/** Sunita stays: the name, the city and the primary contact all differ. */
const PREVIEW: MergePreviewRead = {
  blocked: null,
  heldBy: null,
  survivor: SUNITA,
  loser: VINAYAK,
  differences: [
    { field: 'name', survivor: SUNITA.name, loser: VINAYAK.name },
    { field: 'city', survivor: SUNITA.city, loser: VINAYAK.city },
    { field: 'primary_contact', survivor: null, loser: 'Vinayak (husband)' },
  ],
  moves: MOVES,
};
/** The same pair read the other way round, once Vinayak is made the one that stays. */
const TURNED: MergePreviewRead = {
  ...PREVIEW,
  survivor: VINAYAK,
  loser: SUNITA,
  differences: PREVIEW.differences.map(({ field, survivor, loser }) => ({
    field,
    survivor: loser,
    loser: survivor,
  })),
};

function viewOf(preview: MergePreviewRead, choices: MergeChoices) {
  const view = mergeViewOf(preview, SUNITA.customerId, choices);
  if (view === null) throw new Error('the preview is blocked');
  return view;
}

describe('which customer merge is unavailable, and why (M02-63)', () => {
  it.each([
    [
      { blocked: 'out_of_scope', heldBy: 'Rajesh' },
      { kind: 'out_of_scope', heldBy: 'Rajesh' },
    ],
    [
      { blocked: 'out_of_scope', heldBy: null },
      { kind: 'out_of_scope', heldBy: null },
    ],
    [{ blocked: 'already_merged', heldBy: null }, { kind: 'already_merged' }],
    [{ blocked: null, heldBy: null }, null],
  ] as const)('a preview blocked %j answers %j', (blocked, unavailable) => {
    const preview = { ...PREVIEW, ...blocked };
    expect(mergeUnavailableOf(preview)).toEqual(unavailable);
  });

  it('a blocked preview draws no compare at all', () => {
    const blocked: MergePreviewRead = {
      blocked: 'out_of_scope',
      heldBy: 'Rajesh',
      survivor: null,
      loser: null,
      differences: [],
      moves: null,
    };
    expect(mergeViewOf(blocked, SUNITA.customerId, {})).toBeNull();
  });
});

describe('the merge waits for a pick on every differing field (M02-60)', () => {
  it.each([
    [{}, ['name', 'city', 'primary_contact'], false],
    [{ name: 'sunita' }, ['city', 'primary_contact'], false],
    [{ name: 'sunita', city: 'vinayak' }, ['primary_contact'], false],
    [{ name: 'sunita', city: 'vinayak', primary_contact: 'vinayak' }, [], true],
    [{ name: 'someone-else', city: 'vinayak', primary_contact: 'vinayak' }, ['name'], false],
  ] as const)('picks %j leave %j unpicked, ready %s', (choices, unpicked, ready) => {
    const view = viewOf(PREVIEW, choices);
    expect([view.unpicked, view.ready]).toEqual([unpicked, ready]);
  });

  it('a field the two agree on shows no choice', () => {
    const agreed = { ...PREVIEW, differences: PREVIEW.differences.slice(0, 1) };
    const view = viewOf(agreed, { name: 'vinayak' });
    expect([view.fields.map((pick) => pick.field), view.same, view.ready]).toEqual([
      ['name'],
      ['city', 'primary_contact'],
      true,
    ]);
  });

  it('a differing field this build cannot show holds the merge for a newer app', () => {
    const newer = {
      ...PREVIEW,
      differences: [...PREVIEW.differences, { field: 'language', survivor: 'mr', loser: 'hi' }],
    };
    const view = viewOf(newer, { name: 'sunita', city: 'sunita', primary_contact: 'sunita' });
    expect([view.fields.length, view.needsUpdate, view.ready]).toEqual([3, true, false]);
  });
});

describe('a pick follows its record when the other one is made to stay', () => {
  const choices = { name: 'sunita', city: 'vinayak', primary_contact: 'vinayak' } as const;

  it.each([
    ['Sunita stays', PREVIEW, { name: 'survivor', city: 'loser', primary_contact: 'loser' }],
    ['Vinayak stays', TURNED, { name: 'loser', city: 'survivor', primary_contact: 'survivor' }],
  ] as const)('%s: the wire picks are %j', (_who, preview, picks) => {
    expect(mergePicksOf(viewOf(preview, choices))).toEqual(picks);
  });

  it.each([
    ['Sunita stays', PREVIEW, [true, false]],
    ['Vinayak stays', TURNED, [false, true]],
  ] as const)(
    '%s: the records keep their order, the one that stays marked %j',
    (_who, preview, stays) => {
      const view = viewOf(preview, choices);
      expect(view.records.map((record) => [record.customerId, record.stays])).toEqual([
        ['sunita', stays[0]],
        ['vinayak', stays[1]],
      ]);
      expect(view.fields[0]?.options.map((option) => option.value)).toEqual([
        SUNITA.name,
        VINAYAK.name,
      ]);
    },
  );

  it('what the survivor keeps names each picked value, the own number standing for no contact', () => {
    const view = viewOf(TURNED, { name: 'sunita', city: 'vinayak', primary_contact: 'sunita' });
    expect(view.kept).toEqual([
      { field: 'name', value: SUNITA.name, phoneE164: SUNITA.phoneE164 },
      { field: 'city', value: VINAYAK.city, phoneE164: VINAYAK.phoneE164 },
      { field: 'primary_contact', value: null, phoneE164: SUNITA.phoneE164 },
    ]);
  });
});

describe('the other number is never lost (M02-60)', () => {
  it.each([
    ['two numbers', VINAYAK.phoneE164, VINAYAK.phoneE164],
    ['one number kept twice', SUNITA.phoneE164, null],
  ])('%s: the number kept as a contact is %s → %s', (_case, loserPhone, kept) => {
    const preview = { ...PREVIEW, loser: { ...VINAYAK, phoneE164: loserPhone } };
    expect(viewOf(preview, {}).keptNumber).toBe(kept);
  });
});

describe('the find step never offers the record that stays', () => {
  it.each([
    [[], []],
    [[{ id: 'sunita' }], []],
    [[{ id: 'sunita' }, { id: 'vinayak' }], [{ id: 'vinayak' }]],
  ])('%j offers %j', (found, offered) => {
    expect(mergeCandidatesOf(found, 'sunita')).toEqual(offered);
  });
});
