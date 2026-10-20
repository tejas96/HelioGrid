import { describe, expect, it } from 'vitest';
import type { RolePreset } from '../../src/authz/roles';
import { type TeamRow, teamRoster, teamRosterView } from '../../src/tenancy/team-roster';

import { invite, member, NOW, VIEWER } from './team-fixtures';

const names = (rows: readonly TeamRow[]) => rows.map((row) => row.name);

describe('teamRoster — the order the list renders in (AC-10)', () => {
  const owner = member('Rajesh Kulkarni', { userId: VIEWER, roles: ['epc_owner'] });
  const amit = member('Amit Rane');
  const anjali = member('Anjali Kulkarni');
  const deepak = member('Deepak Jadhav', { status: 'deactivated' });
  const priya = invite('Priya Deshmukh', 1);
  const rohan = invite('Rohan Gaikwad', 9, { status: 'expired' });
  const kavita = invite('Kavita Shirke', 2);

  it.each([
    ['as read', [owner, amit, anjali, deepak], [priya, rohan, kavita]],
    ['reversed', [deepak, anjali, amit, owner], [kavita, rohan, priya]],
    ['shuffled', [anjali, deepak, owner, amit], [rohan, priya, kavita]],
  ])(
    'invites pending then expired, members active then deactivated, each by name — %s',
    (_, members, invites) => {
      expect(names(teamRoster(members, invites, VIEWER, NOW, 'en'))).toEqual([
        'Kavita Shirke',
        'Priya Deshmukh',
        'Rohan Gaikwad',
        'Amit Rane',
        'Anjali Kulkarni',
        'Rajesh Kulkarni',
        'Deepak Jadhav',
      ]);
    },
  );

  it('compares Devanagari names in the reader’s language', () => {
    const rows = teamRoster([member('सुनील भोसले'), member('अमित राणे')], [], VIEWER, NOW, 'mr');
    expect(names(rows)).toEqual(['अमित राणे', 'सुनील भोसले']);
  });

  it('keeps one invite per phone, the newest', () => {
    const phone = '+919700000099';
    const older = invite('Priya D', 12, { phoneE164: phone, status: 'expired' });
    const newer = invite('Priya Deshmukh', 2, { phoneE164: phone });
    const rows = teamRoster([], [older, newer], VIEWER, NOW, 'en');
    expect(rows.map((row) => row.id)).toEqual([newer.id]);
  });

  it.each(['active', 'deactivated'] as const)(
    'drops an invite for a phone on the team (%s)',
    (status) => {
      const onTeam = member('Meera Iyer', { status });
      const stale = invite('Meera Iyer', 10, { phoneE164: onTeam.phoneE164, status: 'expired' });
      expect(teamRoster([onTeam], [stale], VIEWER, NOW, 'en').map((row) => row.id)).toEqual([
        onTeam.membershipId,
      ]);
    },
  );

  it.each(['accepted', 'declined', 'revoked'] as const)('lists no %s invite', (status) => {
    expect(teamRoster([], [invite('Nitin Pawar', 1, { status })], VIEWER, NOW, 'en')).toEqual([]);
  });

  it('lists no invited membership: an invite is an invitation, never a membership', () => {
    expect(
      teamRoster([member('Sunil Bhosale', { status: 'invited' })], [], VIEWER, NOW, 'en'),
    ).toEqual([]);
  });

  it('marks the reader’s own row, and only it', () => {
    const rows = teamRoster([owner, amit], [], VIEWER, NOW, 'en');
    expect(rows.map((row) => row.isViewer)).toEqual([false, true]);
  });

  it('holds the presets in F2’s order, whatever order they arrived in', () => {
    const roles: RolePreset[] = ['installation_team_member', 'survey_engineer', 'design_engineer'];
    const [row] = teamRoster([member('Vikram Deshpande', { roles })], [], VIEWER, NOW, 'en');
    expect(row?.roles).toEqual(['survey_engineer', 'design_engineer', 'installation_team_member']);
  });
});

describe('teamRoster — a pending invite’s seven days (AC-11)', () => {
  it.each([
    [0, 'invited', 1],
    [0.5, 'invited', 1],
    [1, 'invited', 2],
    [6, 'invited', 7],
    [6.99, 'invited', 7],
    [7, 'expired', null],
    [9, 'expired', null],
  ])('sent %s days ago → %s, day %s', (daysAgo, status, day) => {
    const [row] = teamRoster([], [invite('Priya Deshmukh', daysAgo)], VIEWER, NOW, 'en');
    expect(row?.status).toBe(status);
    expect(row?.inviteDay).toBe(day);
  });

  it('reads an invite the server already calls expired as expired', () => {
    const [row] = teamRoster(
      [],
      [invite('Rohan Gaikwad', 3, { status: 'expired' })],
      VIEWER,
      NOW,
      'en',
    );
    expect(row?.status).toBe('expired');
    expect(row?.inviteDay).toBeNull();
  });

  it('carries the expiry on an invite and the last-active on a member, never both', () => {
    const rows = teamRoster(
      [member('Amit Rane')],
      [invite('Priya Deshmukh', 1)],
      VIEWER,
      NOW,
      'en',
    );
    expect(rows.map((row) => [row.expiresAt !== null, row.lastActiveAt !== null])).toEqual([
      [true, false],
      [false, true],
    ]);
  });
});

describe('teamRosterView — search, the Status chips and the head count (AC-7, AC-15)', () => {
  const rows = teamRoster(
    [
      member('Rajesh Kulkarni', { userId: VIEWER }),
      member('Anjali Kulkarni'),
      member('Amit Rane'),
      member('Deepak Jadhav', { status: 'deactivated' }),
    ],
    [invite('Priya Deshmukh', 1), invite('Rohan Gaikwad', 9, { status: 'expired' })],
    VIEWER,
    NOW,
    'en',
  );

  it('shows every row, and counts each status, with no search and All', () => {
    const view = teamRosterView(rows, '', 'all');
    expect(view.rows).toHaveLength(6);
    expect(view.counts).toEqual({ all: 6, invited: 1, expired: 1, active: 3, deactivated: 1 });
  });

  it.each([
    ['kulkarni', ['Anjali Kulkarni', 'Rajesh Kulkarni']],
    ['  KULKARNI ', ['Anjali Kulkarni', 'Rajesh Kulkarni']],
    ['anj', ['Anjali Kulkarni']],
    ['Joshi', []],
  ])('“%s” narrows the list by name', (query, expected) => {
    expect(names(teamRosterView(rows, query, 'all').rows)).toEqual(expected);
  });

  it('counts each chip over the rows the search matches', () => {
    expect(teamRosterView(rows, 'Kulkarni', 'all').counts).toEqual({
      all: 2,
      invited: 0,
      expired: 0,
      active: 2,
      deactivated: 0,
    });
  });

  it.each([
    ['expired', ['Rohan Gaikwad']],
    ['deactivated', ['Deepak Jadhav']],
    ['invited', ['Priya Deshmukh']],
  ] as const)('the %s chip shows only its rows', (status, expected) => {
    expect(names(teamRosterView(rows, '', status).rows)).toEqual(expected);
  });

  it('applies the search and the chip together', () => {
    expect(names(teamRosterView(rows, 'Rajesh', 'deactivated').rows)).toEqual([]);
    expect(names(teamRosterView(rows, 'Rajesh', 'active').rows)).toEqual(['Rajesh Kulkarni']);
  });

  it.each([
    [0, 0, [], []],
    [1, 1, [member('Amit Rane')], [invite('Priya Deshmukh', 1)]],
    [
      2,
      2,
      [member('Amit Rane'), member('Deepak Jadhav', { status: 'deactivated' })],
      [invite('Priya Deshmukh', 1), invite('Rohan Gaikwad', 9)],
    ],
  ])(
    'heads %s people and %s invites — active plus deactivated, pending plus expired',
    (people, invites, m, i) => {
      const view = teamRosterView(teamRoster(m, i, VIEWER, NOW, 'en'), 'Nobody', 'active');
      expect([view.people, view.invites]).toEqual([people, invites]);
    },
  );

  it('is the teaching state when the reader is the only one on the list', () => {
    const alone = teamRoster(
      [member('Rajesh Kulkarni', { userId: VIEWER })],
      [],
      VIEWER,
      NOW,
      'en',
    );
    expect(teamRosterView(alone, '', 'all').onlyViewer).toBe(true);
    expect(teamRosterView(rows, '', 'all').onlyViewer).toBe(false);
    const withInvite = teamRoster(
      [member('Rajesh Kulkarni', { userId: VIEWER })],
      [invite('Priya Deshmukh', 1)],
      VIEWER,
      NOW,
      'en',
    );
    expect(teamRosterView(withInvite, '', 'all').onlyViewer).toBe(false);
  });
});
