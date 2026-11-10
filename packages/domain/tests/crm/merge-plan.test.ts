import { describe, expect, it } from 'vitest';
import {
  MERGE_WRITE_SET,
  type MergeCustomer,
  MONEY_TABLES,
  mergeDifferences,
  planMerge,
} from '../../src/crm/merge-plan';

/** Priya entered twice — once by Rajesh, once by Anita with her husband as the primary contact. */
const SURVIVOR: MergeCustomer = {
  customerId: 'priya-1',
  name: 'Priya Sharma',
  city: 'Nashik',
  phoneE164: '+919845027746',
  primaryContactId: null,
  contacts: [],
  mergedInto: null,
};
const LOSER: MergeCustomer = {
  customerId: 'priya-2',
  name: 'Priya S.',
  city: 'Nasik',
  phoneE164: '+919822012345',
  primaryContactId: 'husband',
  contacts: [{ contactId: 'husband', phoneE164: '+919800000001' }],
  mergedInto: null,
};

/** The loser as a keep-both duplicate: the same number, their own primary. */
const SAME_NUMBER = { phoneE164: SURVIVOR.phoneE164, primaryContactId: null } as const;

describe('mergeDifferences — the rows the compare step asks a pick for (M02-60)', () => {
  it.each<[Partial<MergeCustomer>, string[]]>([
    [{}, ['name', 'city', 'primary_contact']],
    [{ ...SAME_NUMBER, name: ' Priya Sharma ', city: 'Nashik ' }, []],
    [{ ...SAME_NUMBER, name: 'Priya Sharma', city: 'Nashik' }, []],
    [{ ...SAME_NUMBER, name: 'priya sharma', city: 'Nashik' }, ['name']],
    [{ ...SAME_NUMBER, name: 'Priya Sharma', city: null }, ['city']],
    [{ ...SAME_NUMBER, name: 'Priya Sharma', city: '  ' }, ['city']],
    [{ name: 'Priya Sharma', city: 'Nashik', primaryContactId: null }, ['primary_contact']],
  ])('a loser of %j differs in %j', (loser, fields) => {
    expect(mergeDifferences(SURVIVOR, { ...LOSER, ...loser })).toEqual(fields);
  });

  it('a primary contact differs by its number, not by which row holds it', () => {
    const survivor = {
      ...SURVIVOR,
      primaryContactId: 'c1',
      contacts: [{ contactId: 'c1', phoneE164: '+919800000001' }],
    };
    expect(mergeDifferences(survivor, { ...LOSER, name: 'Priya Sharma', city: 'Nashik' })).toEqual(
      [],
    );
  });
});

describe('planMerge — ready only when every differing field is picked, never guessed', () => {
  it.each<[Record<string, 'survivor' | 'loser'>, string[]]>([
    [{}, ['name', 'city', 'primary_contact']],
    [{ name: 'survivor' }, ['city', 'primary_contact']],
    [{ name: 'loser', city: 'survivor' }, ['primary_contact']],
  ])('picks %j leave %j unpicked', (picks, unpicked) => {
    expect(planMerge(SURVIVOR, LOSER, picks)).toEqual({ kind: 'needs_picks', unpicked });
  });

  it('takes each picked side, moves the loser’s number on as a contact and records each choice', () => {
    const result = planMerge(SURVIVOR, LOSER, {
      name: 'survivor',
      city: 'loser',
      primary_contact: 'loser',
    });
    expect(result).toEqual({
      kind: 'ready',
      plan: {
        survivorId: 'priya-1',
        loserId: 'priya-2',
        name: 'Priya Sharma',
        city: 'Nasik',
        primary: { kind: 'contact', contactId: 'husband' },
        loserPhoneContact: { phoneE164: '+919822012345', name: 'Priya S.' },
        choices: [
          { field: 'name', kept: 'survivor' },
          { field: 'city', kept: 'loser' },
          { field: 'primary_contact', kept: 'loser' },
        ],
      },
    });
  });

  it.each<[Partial<MergeCustomer>, Partial<MergeCustomer>, unknown, unknown]>([
    // The loser is their own primary and the survivor holds none of their number: a new contact.
    [{}, { primaryContactId: null, contacts: [] }, { kind: 'loser_phone_contact' }, true],
    // A keep-both pair: one number, so the survivor is already that person.
    [
      {},
      { primaryContactId: null, phoneE164: SURVIVOR.phoneE164 },
      { kind: 'survivor_self' },
      null,
    ],
    // The survivor holds the loser's number as a contact: that contact becomes the primary.
    [
      {
        primaryContactId: 's1',
        contacts: [
          { contactId: 's1', phoneE164: '+919811111111' },
          { contactId: 's2', phoneE164: '+919822012345' },
        ],
      },
      { primaryContactId: null, contacts: [] },
      { kind: 'contact', contactId: 's2' },
      null,
    ],
    // The loser holds their own number as a contact, which moves over: that contact is the primary.
    [
      {},
      { primaryContactId: null, contacts: [{ contactId: 'l1', phoneE164: LOSER.phoneE164 }] },
      { kind: 'contact', contactId: 'l1' },
      null,
    ],
  ])(
    'keeping the loser’s primary — survivor %j, loser %j → %j',
    (survivor, loser, primary, adds) => {
      const result = planMerge(
        { ...SURVIVOR, ...survivor },
        { ...LOSER, ...loser },
        {
          name: 'survivor',
          city: 'survivor',
          primary_contact: 'loser',
        },
      );
      expect(result.kind === 'ready' && result.plan.primary).toEqual(primary);
      expect(result.kind === 'ready' && result.plan.loserPhoneContact !== null).toBe(adds === true);
    },
  );

  it('a pick for a field that agrees is ignored, and the survivor’s primary stays itself', () => {
    const agreeing = { ...LOSER, ...SAME_NUMBER, name: 'Priya Sharma', city: 'Nashik' };
    expect(planMerge(SURVIVOR, agreeing, { name: 'loser' })).toMatchObject({
      kind: 'ready',
      plan: { name: 'Priya Sharma', primary: { kind: 'survivor_self' }, choices: [] },
    });
  });

  it.each([
    [SURVIVOR, SURVIVOR, 'same_customer'],
    [SURVIVOR, { ...LOSER, mergedInto: 'priya-9' }, 'already_merged'],
    [{ ...SURVIVOR, mergedInto: 'priya-9' }, LOSER, 'already_merged'],
  ] as const)('is refused — %#', (survivor, loser, refusal) => {
    expect(planMerge(survivor, loser, {})).toEqual({ kind: 'refused', refusal });
  });
});

describe('the merge’s write set touches no money (M02-62)', () => {
  it('no money table is in the write set, and the timeline is appended, never re-pointed', () => {
    const writes: readonly string[] = MERGE_WRITE_SET;
    expect(MONEY_TABLES.filter((table) => writes.includes(table))).toEqual([]);
    expect(writes).toContain('activity');
    expect(new Set(writes).size).toBe(writes.length);
  });
});
