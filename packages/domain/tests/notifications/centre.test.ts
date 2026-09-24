import { describe, expect, it } from 'vitest';
import {
  centreGroupKey,
  centreHorizonStart,
  NOTIFICATION_CENTRE_HORIZON_DAYS,
  typesInGroups,
} from '../../src/notifications/centre';
import { NOTIFICATION_REGISTRY, typeGroupOf } from '../../src/notifications/registry';
import { NOTIFICATION_TYPES } from '../../src/notifications/types';

/**
 * The notification centre's three decisions (`F6-12`, `F6-17`, `F6-19`): how far back it reads,
 * which types a group filter admits, and which items group together.
 *
 * Every day is the TENANT's calendar day (`F1-10`), never the server's.
 */
const IST = 'Asia/Kolkata';
const MS_PER_DAY = 24 * 60 * 60 * 1_000;
/* Epoch milliseconds both ways: the package constructs no Date, and neither does its test. */
const at = (stamp: string) => Date.parse(stamp);

const standardType = NOTIFICATION_TYPES.find(
  (type) => NOTIFICATION_REGISTRY[type].urgency === 'standard',
);
const immediateType = NOTIFICATION_TYPES.find(
  (type) => NOTIFICATION_REGISTRY[type].urgency === 'immediate',
);
if (standardType === undefined || immediateType === undefined) {
  throw new Error('the registry must carry both urgency classes for these tests to mean anything');
}
const otherStandardType = NOTIFICATION_TYPES.find(
  (type) => type !== standardType && NOTIFICATION_REGISTRY[type].urgency === 'standard',
);
if (otherStandardType === undefined) throw new Error('the registry must carry two standard types');

describe('centreHorizonStart — how far back the centre reads (F6-19)', () => {
  it('starts exactly the horizon before now', () => {
    const now = at('2026-09-24T12:00:00Z');
    expect(now - centreHorizonStart(now)).toBe(NOTIFICATION_CENTRE_HORIZON_DAYS * MS_PER_DAY);
  });
});

describe('typesInGroups — which types a group filter admits (F6-17)', () => {
  it.each([
    ['one group', ['sales'] as const],
    ['two groups', ['sales', 'payments'] as const],
    ['every group', ['sales', 'delivery', 'payments', 'team', 'billing'] as const],
  ])('admits exactly the types whose group is chosen — %s', (_, groups) => {
    const admitted = typesInGroups(groups);
    expect(admitted.length).toBeGreaterThan(0);
    for (const type of NOTIFICATION_TYPES) {
      expect(admitted.includes(type)).toBe(groups.some((group) => group === typeGroupOf(type)));
    }
  });

  it('admits nothing for no group', () => {
    expect(typesInGroups([])).toEqual([]);
  });
});

describe('centreGroupKey — which items group (F6-12)', () => {
  const key = (
    type: (typeof NOTIFICATION_TYPES)[number],
    subjectKind: 'tenant' | 'user_account',
    stamp: string,
  ) => centreGroupKey(type, subjectKind, at(stamp), IST);

  it('never groups an immediate type', () => {
    expect(key(immediateType, 'tenant', '2026-09-24T06:00:00Z')).toBeNull();
  });

  it.each([
    // 23:59 and 00:00 IST are 18:29 and 18:30 UTC: the boundary is the tenant's midnight.
    [
      'the same tenant day, either side of UTC midnight',
      '2026-09-23T18:30:00Z',
      '2026-09-24T18:29:00Z',
      true,
    ],
    [
      'one minute across the tenant midnight',
      '2026-09-24T18:29:00Z',
      '2026-09-24T18:30:00Z',
      false,
    ],
    ['one minute before the tenant midnight', '2026-09-24T18:28:00Z', '2026-09-24T18:29:00Z', true],
  ])('groups a standard type by the tenant day — %s', (_, first, second, grouped) => {
    const a = key(standardType, 'tenant', first);
    const b = key(standardType, 'tenant', second);
    expect(a).not.toBeNull();
    expect(a === b).toBe(grouped);
  });

  it('keeps apart two types on the same day and subject kind', () => {
    const stamp = '2026-09-24T06:00:00Z';
    expect(key(standardType, 'tenant', stamp)).not.toBe(key(otherStandardType, 'tenant', stamp));
  });

  it('keeps apart one type on two subject kinds on the same day', () => {
    const stamp = '2026-09-24T06:00:00Z';
    expect(key(standardType, 'tenant', stamp)).not.toBe(key(standardType, 'user_account', stamp));
  });
});
