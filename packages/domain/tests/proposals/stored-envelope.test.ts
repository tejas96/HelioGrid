import { describe, expect, it } from 'vitest';
import { proposalMoney } from '../../src/proposals/money';
import type { ProposalVersionSnapshot } from '../../src/proposals/snapshot';
import {
  fieldSetEnvelopeOf,
  fieldSetOf,
  versionSnapshotEnvelopeOf,
  versionSnapshotOf,
} from '../../src/proposals/stored-envelope';
import { aFieldSet, moneyInput } from './proposal-fixture';

/** What a jsonb column hands back: the value as JSON stored it, with no type of ours on it. */
const stored = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

const withoutKey = (value: unknown, key: string): unknown => {
  const { [key]: _, ...rest } = stored(value) as Record<string, unknown>;
  return rest;
};

function aSnapshot(): ProposalVersionSnapshot {
  const fields = aFieldSet();
  const money = proposalMoney(moneyInput(fields));
  if (money === null) throw new Error('the fixture is priced');
  return {
    fields,
    deal: moneyInput().deal as ProposalVersionSnapshot['deal'],
    company: {
      name: 'Suryodaya Solar',
      phoneE164: null,
      email: null,
      website: null,
      address: null,
      logoFileId: null,
      taxRegistration: null,
      bankDetails: null,
      brandColour: null,
    },
    money,
    generation: null,
    savings: null,
    emi: null,
    pages: ['cover', 'price', 'terms'],
    basisLine: 'indicative-basis',
    validityDays: 30,
    language: 'en',
    preparedBy: { name: 'Rahul Patil', phoneE164: null },
  };
}

describe('fieldSetOf — a draft’s field set read back from its row (M06-25)', () => {
  it('a row written today reads as it was written', () => {
    expect(fieldSetOf(stored(fieldSetEnvelopeOf(aFieldSet())))).toEqual(aFieldSet());
  });

  it('a row written before a step had its own key reads with that step’s default', () => {
    const older = withoutKey(fieldSetEnvelopeOf(aFieldSet()), 'bank');
    expect(fieldSetOf(older).bank).toEqual({ includeInProposal: true });
  });

  it.each([
    ['a newer version', { ...aFieldSet(), version: 2 }, /version 2/],
    ['no version at all', withoutKey(aFieldSet(), 'version'), /version/],
    ['a step it cannot do without', withoutKey(aFieldSet(), 'system'), /system/],
    ['not an object', 'field set', /object/],
  ])('refuses %s, loudly', (_, row, message) => {
    expect(() => fieldSetOf(stored(row))).toThrow(message);
  });
});

describe('versionSnapshotOf — a version read back from its row, forever (M06-42)', () => {
  it('a row written today reads as it was written', () => {
    expect(versionSnapshotOf(stored(versionSnapshotEnvelopeOf(aSnapshot())))).toEqual(
      stored(aSnapshot()),
    );
  });

  it('a row with no version mark, as the first rows were written, reads as version 1', () => {
    expect(versionSnapshotOf(stored(aSnapshot()))).toEqual(stored(aSnapshot()));
  });

  it('an older row missing a later fact reads with its default', () => {
    const older = withoutKey(withoutKey(aSnapshot(), 'basisLine'), 'emi');
    const read = versionSnapshotOf(older);
    expect(read.basisLine).toBeNull();
    expect(read.emi).toBeNull();
  });

  it('a row written before the validity was a fact reads as stating none', () => {
    expect(versionSnapshotOf(withoutKey(aSnapshot(), 'validityDays')).validityDays).toBeNull();
  });

  it.each([
    ['a newer version', { ...(stored(aSnapshot()) as object), version: 2 }, /version 2/],
    ['no money block', withoutKey(aSnapshot(), 'money'), /money/],
    [
      'a field set from a newer build',
      { ...aSnapshot(), fields: { ...aFieldSet(), version: 3 } },
      /version 3/,
    ],
  ])('refuses %s, loudly', (_, row, message) => {
    expect(() => versionSnapshotOf(stored(row))).toThrow(message);
  });
});
