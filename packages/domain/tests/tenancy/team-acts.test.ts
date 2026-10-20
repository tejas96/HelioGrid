import { describe, expect, it } from 'vitest';
import type { RolePreset } from '../../src/authz/roles';
import {
  firstNameOf,
  inviteAgainOf,
  noteLeavesRow,
  ownerLostBetween,
  type TeamAct,
  teamActNote,
  teamActOutcome,
  teamRowAct,
} from '../../src/tenancy/team-acts';
import { type TeamRow, teamRoster, teamRosterView } from '../../src/tenancy/team-roster';
import { invite, member, NOW, VIEWER } from './team-fixtures';

const roster = (...rows: Parameters<typeof teamRoster>[0]) =>
  teamRoster(rows, [], VIEWER, NOW, 'en');
const row = (rows: readonly TeamRow[], name: string): TeamRow => {
  const found = rows.find((each) => each.name === name);
  if (found === undefined) throw new Error(`no row ${name}`);
  return found;
};
const owner = (name: string, over: Parameters<typeof member>[1] = {}) =>
  member(name, { roles: ['epc_owner'], ...over });

describe('teamRowAct — each row’s one act, and whether it is off (AC-1, AC-22)', () => {
  it.each([
    ['invited', 'revoke'],
    ['expired', 'invite-again'],
  ] as const)('a %s invite takes %s, never off', (status, act) => {
    const rows = teamRoster(
      [owner('Rajesh Kulkarni', { userId: VIEWER })],
      [
        invite(
          'Priya Deshmukh',
          status === 'invited' ? 1 : 9,
          status === 'invited' ? {} : { status: 'expired' },
        ),
      ],
      VIEWER,
      NOW,
      'en',
    );
    expect(teamRowAct(row(rows, 'Priya Deshmukh'), rows)).toEqual({ act, off: false });
  });

  it('a deactivated person takes no act', () => {
    const rows = roster(
      owner('Rajesh Kulkarni'),
      member('Deepak Jadhav', { status: 'deactivated' }),
    );
    expect(teamRowAct(row(rows, 'Deepak Jadhav'), rows)).toBeNull();
  });

  it.each([
    ['the only EPC Owner', true, [owner('Rajesh Kulkarni'), member('Amit Rane')]],
    ['one of two EPC Owners', false, [owner('Rajesh Kulkarni'), owner('Meera Iyer')]],
    [
      'the only active EPC Owner beside a deactivated one',
      true,
      [owner('Rajesh Kulkarni'), owner('Meera Iyer', { status: 'deactivated' })],
    ],
    ['a member who is not an Owner', false, [member('Rajesh Kulkarni'), owner('Meera Iyer')]],
  ])('Deactivate on %s is off: %s', (_, off, members) => {
    const rows = roster(...members);
    expect(teamRowAct(row(rows, 'Rajesh Kulkarni'), rows)).toEqual({ act: 'deactivate', off });
  });

  it('reads the whole roster, so a search that hides the other Owner leaves the act on', () => {
    const rows = roster(owner('Rajesh Kulkarni', { userId: VIEWER }), owner('Meera Iyer'));
    const seen = teamRosterView(rows, 'Rajesh', 'all').rows;
    expect(seen.map((each) => each.name)).toEqual(['Rajesh Kulkarni']);
    expect(teamRowAct(row(seen, 'Rajesh Kulkarni'), rows)).toEqual({
      act: 'deactivate',
      off: false,
    });
  });
});

describe('teamActOutcome — what an answer to an act means (AC-16, AC-23, AC-24, AC-25)', () => {
  const acts: readonly TeamAct[] = ['deactivate', 'revoke', 'invite-again'];

  it.each(acts.flatMap((act) => [200, 201].map((status) => [act, status] as const)))(
    '%s answered %i is done',
    (act, status) => {
      expect(teamActOutcome(act, { status, code: '' })).toBe('done');
    },
  );

  it.each(acts.flatMap((act) => [404, 409].map((status) => [act, status] as const)))(
    '%s answered %i refreshes the list',
    (act, status) => {
      expect(teamActOutcome(act, { status, code: 'CONFLICT' })).toBe('refresh');
    },
  );

  it.each(acts)('%s answered 403 is forbidden', (act) => {
    expect(teamActOutcome(act, { status: 403, code: 'FORBIDDEN' })).toBe('forbidden');
  });

  it('a deactivate refused LAST_OWNER is the refused form', () => {
    expect(teamActOutcome('deactivate', { status: 422, code: 'LAST_OWNER' })).toBe('refused');
  });

  it.each([
    [422, 'DOMAIN_RULE_VIOLATION'],
    [422, 'IDEMPOTENCY_KEY_REUSED'],
    [429, 'INVITE_CAP_REACHED'],
  ])('Invite again answered %i %s says why', (status, code) => {
    expect(teamActOutcome('invite-again', { status, code })).toBe('say');
  });

  it.each([
    ['deactivate', { status: 422, code: 'DOMAIN_RULE_VIOLATION' }],
    ['revoke', { status: 422, code: 'DOMAIN_RULE_VIOLATION' }],
    ['deactivate', { status: 500, code: 'INTERNAL' }],
    ['invite-again', { status: 503, code: 'UNKNOWN' }],
    ['revoke', { status: 401, code: 'UNAUTHENTICATED' }],
    ['deactivate', null],
    ['invite-again', null],
  ] as const)('%s answered %o failed', (act, answer) => {
    expect(teamActOutcome(act, answer)).toBe('failed');
  });
});

describe('ownerLostBetween — who stopped being an EPC Owner meanwhile (AC-18)', () => {
  const rajesh = owner('Rajesh Kulkarni', { userId: VIEWER });
  const meera = owner('Meera Iyer', { roles: ['epc_owner', 'design_engineer'] });
  const anil = owner('Anil Patil');
  const asDesigner = { ...meera, roles: ['design_engineer'] as RolePreset[] };

  it.each([
    ['one Owner lost the preset', 'Meera Iyer', [rajesh, meera], [rajesh, asDesigner]],
    [
      'one Owner was deactivated',
      'Meera Iyer',
      [rajesh, meera],
      [rajesh, { ...meera, status: 'deactivated' as const }],
    ],
    ['nobody changed', null, [rajesh, meera], [rajesh, meera]],
    [
      'two Owners were lost',
      null,
      [rajesh, meera, anil],
      [rajesh, asDesigner, { ...anil, roles: ['finance'] as RolePreset[] }],
    ],
    [
      'only the reader was lost',
      null,
      [rajesh, meera],
      [{ ...rajesh, roles: ['finance'] as RolePreset[] }, meera],
    ],
  ])('%s → %s', (_, lost, before, after) => {
    expect(ownerLostBetween(roster(...before), roster(...after))).toBe(lost);
  });
});

describe('inviteAgainOf — the send Invite again makes (AC-13)', () => {
  it('an expired invite gives its name, phone and presets in F2’s order', () => {
    const lapsed = invite('Rohan Gaikwad', 9, {
      status: 'expired',
      roles: ['survey_engineer', 'sales_executive'],
    });
    const rows = teamRoster([], [lapsed], VIEWER, NOW, 'en');
    expect(inviteAgainOf(row(rows, 'Rohan Gaikwad'))).toEqual({
      inviteeName: 'Rohan Gaikwad',
      phoneE164: lapsed.phoneE164,
      roles: ['sales_executive', 'survey_engineer'],
    });
  });

  it.each([
    ['an open invite', teamRoster([], [invite('Priya Deshmukh', 1)], VIEWER, NOW, 'en')],
    ['a member', roster(member('Amit Rane'))],
  ])('%s gives nothing', (_, rows) => {
    expect(inviteAgainOf(rows[0] as TeamRow)).toBeNull();
  });
});

describe('firstNameOf — the name a confirm and a toast call a person by (D6 A)', () => {
  it.each([
    ['Anjali Kulkarni', 'Anjali'],
    ['  Priya   Deshmukh ', 'Priya'],
    ['Sunil', 'Sunil'],
    ['अमित राणे', 'अमित'],
    ['   ', ''],
  ])('%j → %j', (name, first) => {
    expect(firstNameOf(name)).toBe(first);
  });
});

describe('teamActNote — what the person is told once an act settles (AC-16, AC-21, AC-23)', () => {
  it.each([
    ['deactivate', 'done', { kind: 'deactivated', name: 'Anjali Kulkarni' }, true],
    ['revoke', 'done', { kind: 'revoked', name: 'Anjali Kulkarni' }, true],
    ['invite-again', 'done', { kind: 'moved' }, true],
    ['deactivate', 'refresh', { kind: 'moved' }, true],
    ['revoke', 'refresh', { kind: 'moved' }, true],
    ['invite-again', 'say', { kind: 'turned-down', code: 'INVITE_CAP_REACHED' }, false],
    ['deactivate', 'failed', { kind: 'failed' }, false],
  ] as const)('%s %s → %o, leaves the row: %s', (act, outcome, note, leaves) => {
    const said = teamActNote(act, outcome, 'Anjali Kulkarni', 'INVITE_CAP_REACHED');
    expect(said).toEqual(note);
    expect(noteLeavesRow(said)).toBe(leaves);
  });
});
