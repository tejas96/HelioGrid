import { describe, expect, it } from 'vitest';
import type { RolePreset } from '../../src/authz/roles';
import {
  type AssignRolesOutcome,
  type AssignRolesRefusal,
  assignRolesOutcome,
  lockedPresets,
  opensAssignRoles,
  refusalAfterReread,
  roleChange,
  savedAsPicked,
  saveRolesOff,
} from '../../src/tenancy/assign-roles';
import type { TeamActAnswer } from '../../src/tenancy/team-acts';
import type { TeamRow, TeamRowStatus } from '../../src/tenancy/team-roster';

function row(id: string, roles: readonly RolePreset[], over: Partial<TeamRow> = {}): TeamRow {
  return {
    id,
    name: id,
    phoneE164: '+919800000000',
    roles,
    status: 'active',
    isViewer: false,
    lastActiveAt: null,
    expiresAt: null,
    inviteDay: null,
    ...over,
  };
}

describe('SCR-M01-13 — only an active member opens Assign Roles', () => {
  it.each<[TeamRowStatus, boolean]>([
    ['active', true],
    ['invited', false],
    ['expired', false],
    ['deactivated', false],
  ])('%s opens: %s', (status, opens) => {
    expect(opensAssignRoles(row('vikram', ['survey_engineer'], { status }))).toBe(opens);
  });
});

describe('F2-19 — the presets a sheet cannot clear', () => {
  const rajesh = row('rajesh', ['epc_owner'], { isViewer: true });
  const vikram = row('vikram', ['survey_engineer', 'design_engineer']);
  const anjali = row('anjali', ['epc_owner', 'finance']);

  it('the sole EPC Owner keeps EPC Owner, and the sole-owner reason wins on their own sheet', () => {
    expect(lockedPresets(rajesh, [rajesh, vikram])).toEqual({ epc_owner: 'sole-owner' });
  });

  it('your own EPC Owner stays while another owner holds one', () => {
    expect(lockedPresets(rajesh, [rajesh, vikram, anjali])).toEqual({ epc_owner: 'own-admin' });
  });

  it("another owner's EPC Owner may go while you hold one", () => {
    expect(lockedPresets(anjali, [rajesh, vikram, anjali])).toEqual({});
  });

  it('a deactivated owner does not keep the company in control', () => {
    const gone = row('gone', ['epc_owner'], { status: 'deactivated' });
    expect(lockedPresets(anjali, [rajesh, anjali, gone])).toEqual({});
    expect(lockedPresets(anjali, [anjali, gone])).toEqual({ epc_owner: 'sole-owner' });
  });

  it('a preset that gives no control is never locked', () => {
    expect(lockedPresets(vikram, [rajesh, vikram])).toEqual({});
  });
});

describe('the change a save makes, and what it takes away', () => {
  it('adds only', () => {
    expect(roleChange(['survey_engineer'], ['survey_engineer', 'finance'])).toEqual({
      added: ['finance'],
      removed: [],
      lost: [],
    });
  });

  it('removes one, and that preset is lost', () => {
    expect(
      roleChange(
        ['survey_engineer', 'design_engineer', 'installation_team_member'],
        ['survey_engineer', 'installation_team_member'],
      ),
    ).toEqual({ added: [], removed: ['design_engineer'], lost: ['design_engineer'] });
  });

  it('a removed preset a kept one covers is not lost', () => {
    expect(roleChange(['epc_owner', 'design_engineer'], ['epc_owner'])).toEqual({
      added: [],
      removed: ['design_engineer'],
      lost: [],
    });
  });

  it('adds and removes at once, in F2 order whatever order was typed', () => {
    expect(roleChange(['finance', 'survey_engineer'], ['operations', 'design_engineer'])).toEqual({
      added: ['design_engineer', 'operations'],
      removed: ['survey_engineer', 'finance'],
      lost: ['survey_engineer', 'finance'],
    });
  });

  it('nothing changed', () => {
    expect(roleChange(['finance'], ['finance'])).toEqual({ added: [], removed: [], lost: [] });
  });
});

describe('why Save roles is off', () => {
  it.each<[string, readonly RolePreset[], readonly RolePreset[], string | null]>([
    ['nothing changed', ['finance'], ['finance'], 'unchanged'],
    [
      'the same set typed in another order',
      ['finance', 'survey_engineer'],
      ['survey_engineer', 'finance'],
      'unchanged',
    ],
    ['every tick cleared', ['finance'], [], 'empty'],
    ['one added', ['finance'], ['finance', 'operations'], null],
    ['one removed, one left', ['finance', 'operations'], ['operations'], null],
  ])('%s', (_, before, after, off) => {
    expect(saveRolesOff(row('vikram', before), after)).toBe(off);
  });

  it.each<TeamRowStatus>(['deactivated', 'invited', 'expired'])(
    'a person no longer active is gone, whatever is ticked (%s)',
    (status) => {
      expect(saveRolesOff(row('vikram', ['finance'], { status }), ['operations'])).toBe('gone');
      expect(saveRolesOff(row('vikram', ['finance'], { status }), [])).toBe('gone');
    },
  );
});

describe('a gone refusal keeps Save off even while the list still reads them active', () => {
  it.each<[string, AssignRolesRefusal | null, string | null]>([
    ['gone', { kind: 'gone' }, 'gone'],
    ['failed', { kind: 'failed' }, null],
    ['none', null, null],
  ])('%s', (_, refusal, off) => {
    expect(saveRolesOff(row('vikram', ['finance']), ['operations'], refusal)).toBe(off);
  });
});

describe('F8-36 — a save with no answer is read back before it is called failed', () => {
  it('the fresh roles equal the ticks, in any order: it landed', () => {
    expect(
      savedAsPicked(row('vikram', ['finance', 'survey_engineer']), ['survey_engineer', 'finance']),
    ).toBe(true);
  });

  it('the fresh roles differ: it did not', () => {
    expect(savedAsPicked(row('vikram', ['finance']), ['finance', 'operations'])).toBe(false);
  });

  it('a person no longer active never reads as saved', () => {
    expect(savedAsPicked(row('vikram', ['finance'], { status: 'deactivated' }), ['finance'])).toBe(
      false,
    );
  });
});

describe('every answer to a save has one outcome', () => {
  it.each<[string, TeamActAnswer, AssignRolesOutcome]>([
    ['200', { status: 200, code: '' }, 'done'],
    ['204', { status: 204, code: '' }, 'done'],
    ['401 after a refused refresh', { status: 401, code: 'UNAUTHENTICATED' }, 'failed'],
    ['403', { status: 403, code: 'FORBIDDEN' }, 'forbidden'],
    ['404', { status: 404, code: 'NOT_FOUND' }, 'gone'],
    ['409', { status: 409, code: 'CONFLICT' }, 'gone'],
    ['422 LAST_OWNER', { status: 422, code: 'LAST_OWNER' }, 'last-owner'],
    ['422 OWN_ADMIN', { status: 422, code: 'OWN_ADMIN' }, 'own-admin'],
    ['422 any other code', { status: 422, code: 'VALIDATION_FAILED' }, 'failed'],
    ['500', { status: 500, code: 'INTERNAL' }, 'failed'],
    ['no answer', null, 'unknown'],
  ])('%s', (_, answer, outcome) => {
    expect(assignRolesOutcome(answer)).toBe(outcome);
  });
});

describe('what the sheet says once a save that did not land is read back', () => {
  const ticks: readonly RolePreset[] = ['finance', 'operations'];
  const sent = { id: 'vikram', ticks };
  const landed = [row('vikram', ticks)];
  const notLanded = [row('vikram', ['finance'])];
  const deactivated = [row('vikram', ['finance'], { status: 'deactivated' })];
  const elsewhere = [row('anjali', ['epc_owner'])];

  it.each<[string, Parameters<typeof refusalAfterReread>, ReturnType<typeof refusalAfterReread>]>([
    ['no answer, and it landed: close as on a 200', ['unknown', landed, sent, null], null],
    [
      'no answer, and it did not land: nothing changed',
      ['unknown', notLanded, sent, null],
      { kind: 'failed' },
    ],
    [
      'no answer, and the list did not answer either: ask to check, by the first failure',
      ['unknown', null, sent, 'no_connection'],
      { kind: 'unconfirmed', failure: 'no_connection' },
    ],
    [
      'no answer of a kind the client did not name: no answer',
      ['unknown', null, sent, null],
      { kind: 'unconfirmed', failure: 'no_answer' },
    ],
    [
      'no answer, and the person was deactivated meanwhile: gone',
      ['unknown', deactivated, sent, null],
      { kind: 'gone' },
    ],
    [
      'no answer, and the person is off the list: gone',
      ['unknown', elsewhere, sent, null],
      { kind: 'gone' },
    ],
    ['409, read back or not', ['gone', null, sent, null], { kind: 'gone' }],
    ['LAST_OWNER', ['last-owner', notLanded, sent, null], { kind: 'last-owner' }],
    ['OWN_ADMIN', ['own-admin', notLanded, sent, null], { kind: 'own-admin' }],
  ])('%s', (_, args, refusal) => {
    expect(refusalAfterReread(...args)).toEqual(refusal);
  });
});
