import { describe, expect, it } from 'vitest';
import { IN_UTILITIES } from '../../src/format/utility';
import {
  mayPutVersionInForce,
  typicalWaitDays,
  versionInForceRefusal,
} from '../../src/projects/version-in-force';

describe('mayPutVersionInForce — the lead’s owner or the project’s manager alone (T-M06-025)', () => {
  const parties = { managerId: 'manager', leadOwnerId: 'owner' };
  it.each([
    ['the project’s manager', 'manager', parties, true],
    ['the lead’s owner', 'owner', parties, true],
    ['anyone else', 'colleague', parties, false],
    [
      'an unassigned lead names no owner',
      'colleague',
      { managerId: 'manager', leadOwnerId: null },
      false,
    ],
  ] as const)('%s', (_, actor, who, may) => {
    expect(mayPutVersionInForce(actor, who)).toBe(may);
  });
});

describe('versionInForceRefusal — only a newer version that exists (M08-50)', () => {
  it.each([
    ['the next version over the one in force', 1, 2, 2, null],
    ['a later one, skipping one', 1, 3, 3, null],
    ['any version where none is in force', null, 1, 2, null],
    ['the version already in force', 2, 2, 3, 'version_already_in_force'],
    ['an older one', 2, 1, 3, 'version_already_in_force'],
    ['one past the latest', 1, 4, 3, 'version_unknown'],
    ['a proposal with no version', null, 1, null, 'version_unknown'],
    ['version zero', null, 0, 2, 'version_unknown'],
  ] as const)('%s', (_, inForce, asked, latest, refusal) => {
    expect(versionInForceRefusal(inForce, asked, latest)).toBe(refusal);
  });
});

describe('typicalWaitDays — the pack’s own length, or none (M08-26, F5-66)', () => {
  it('a utility approval takes the longer end of the pack’s range, in days', () => {
    expect(typicalWaitDays(IN_UTILITIES, 'utility_approval')).toBe(42);
  });
  it.each([['utility_inspection'], ['site_access'], ['a_reason_this_build_never_heard_of']])(
    '%s has no declared length, so none is stated',
    (reason) => {
      expect(typicalWaitDays(IN_UTILITIES, reason)).toBeNull();
    },
  );
  it('a market that times nothing states nothing', () => {
    expect(typicalWaitDays({ regions: [], waits: [] }, 'utility_approval')).toBeNull();
  });
});
