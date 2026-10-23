import { describe, expect, it } from 'vitest';
import type { RolePreset } from '../../src/authz/roles';
import {
  lockedPresets,
  opensAssignRoles,
  roleChange,
  saveRolesOff,
} from '../../src/tenancy/assign-roles';
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
    expect(saveRolesOff(before, after)).toBe(off);
  });
});
