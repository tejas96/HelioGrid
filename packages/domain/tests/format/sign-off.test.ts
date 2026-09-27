import { describe, expect, it } from 'vitest';
import { mayReachCustomer, type SignOffRecord, signOffOf } from '../../src/format/sign-off';

/**
 * `F8-26` / `F8-27` / `F8-29` — a design is signed off only while a named person's latest decision
 * approved the exact version that exists now, and only then may it reach a customer. Versions are
 * design fingerprints, compared, never a stored flag.
 */
const REVIEWED = 'fp-reviewed';
const EDITED = 'fp-edited';

function decision(overrides: Partial<SignOffRecord> = {}): SignOffRecord {
  return {
    decision: 'approved',
    decidedBy: 'member-engineer',
    decidedAt: 1_000,
    designVersion: REVIEWED,
    ...overrides,
  };
}

describe('signOffOf', () => {
  it('a design with no decision is awaiting and never reaches the customer (F8-26)', () => {
    const signOff = signOffOf([], REVIEWED);
    expect(signOff.kind).toBe('awaiting');
    expect(mayReachCustomer(signOff, REVIEWED)).toBe(false);
  });

  it('an approval of the current version signs the design off, naming who and when (F8-26)', () => {
    const approval = decision();
    const signOff = signOffOf([approval], REVIEWED);
    expect(signOff).toMatchObject({ kind: 'approved', decision: approval });
  });

  it('an edit after approval leaves the design unapproved (F8-27)', () => {
    const approval = decision();
    const signOff = signOffOf([approval], EDITED);
    expect(signOff).toMatchObject({ kind: 'outdated', decision: approval });
  });

  it('restoring the reviewed version restores its approval (F8-27)', () => {
    const log = [decision()];
    expect(signOffOf(log, EDITED).kind).toBe('outdated');
    expect(signOffOf(log, REVIEWED).kind).toBe('approved');
  });

  it('a return after an approval un-approves the same version (F8-27)', () => {
    const giveBack = decision({ decision: 'returned', decidedAt: 2_000 });
    const signOff = signOffOf([decision(), giveBack], REVIEWED);
    expect(signOff).toMatchObject({ kind: 'returned', decision: giveBack });
  });

  it('a fresh approval after a return signs the new version off (F8-27)', () => {
    const log = [
      decision({ decision: 'returned' }),
      decision({ decidedAt: 2_000, designVersion: EDITED }),
    ];
    expect(signOffOf(log, EDITED).kind).toBe('approved');
  });

  it.each([
    {
      name: 'a later return',
      log: [decision(), decision({ decision: 'returned', decidedAt: 2_000 })],
      kind: 'returned',
    },
    {
      name: 'a return at the same instant',
      log: [decision(), decision({ decision: 'returned' })],
      kind: 'returned',
    },
    {
      name: 'an approval of another version at the same instant',
      log: [decision(), decision({ designVersion: EDITED })],
      kind: 'outdated',
    },
  ] as const)(
    'the latest decision decides whatever order the log is read in — $name',
    ({ log, kind }) => {
      expect(signOffOf(log, REVIEWED).kind).toBe(kind);
      expect(signOffOf([...log].reverse(), REVIEWED).kind).toBe(kind);
    },
  );

  it.each([
    { name: 'no approver', record: { decidedBy: '' }, current: REVIEWED },
    { name: 'blank approver', record: { decidedBy: '  ' }, current: REVIEWED },
    { name: 'no reviewed version', record: { designVersion: '' }, current: '' },
    { name: 'blank reviewed version', record: { designVersion: ' ' }, current: ' ' },
    { name: 'no current version', record: {}, current: '' },
  ])(
    'an approval that names no approver or no version never approves (F8-26) — $name',
    ({ record, current }) => {
      const signOff = signOffOf([decision(record)], current);
      expect(signOff.kind).toBe('outdated');
      expect(mayReachCustomer(signOff, current)).toBe(false);
    },
  );

  it.each([
    { name: 'NaN', decidedAt: Number.NaN },
    { name: 'Infinity', decidedAt: Number.POSITIVE_INFINITY },
  ])(
    'a decision with no readable time never approves and never hides a later return (F8-26) — $name',
    ({ decidedAt }) => {
      const unplaced = decision({ decidedAt });
      const giveBack = decision({ decision: 'returned', decidedAt: 2_000 });
      expect(signOffOf([unplaced], REVIEWED).kind).toBe('outdated');
      expect(signOffOf([unplaced, giveBack], REVIEWED).kind).toBe('outdated');
      expect(signOffOf([giveBack, unplaced], REVIEWED).kind).toBe('outdated');
    },
  );
});

describe('mayReachCustomer', () => {
  it('only an approval of the current version may reach the customer (F8-29)', () => {
    const giveBack = decision({ decision: 'returned' });
    expect(mayReachCustomer(signOffOf([decision()], REVIEWED), REVIEWED)).toBe(true);
    expect(mayReachCustomer(signOffOf([decision()], EDITED), EDITED)).toBe(false);
    expect(mayReachCustomer(signOffOf([giveBack], REVIEWED), REVIEWED)).toBe(false);
    expect(mayReachCustomer(signOffOf([], REVIEWED), REVIEWED)).toBe(false);
  });

  it('a sign-off read before an edit does not let the edited design reach the customer (F8-27)', () => {
    const readBeforeEdit = signOffOf([decision()], REVIEWED);
    expect(mayReachCustomer(readBeforeEdit, EDITED)).toBe(false);
  });

  it('a hand-written approval cannot open the gate (F8-26)', () => {
    mayReachCustomer(
      // @ts-expect-error — a literal is not a `SignOff`: nothing but `signOffOf` mints `approved`.
      { kind: 'approved', decision: decision(), readAgainst: REVIEWED },
      REVIEWED,
    );
  });
});
