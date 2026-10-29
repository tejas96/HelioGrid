import { describe, expect, it } from 'vitest';
import type { Read } from '../../src/shell/read';
import {
  showsListHead,
  type TeamList,
  type TeamSurface,
  teamRoster,
  teamRosterView,
  teamStatusFilterOf,
  teamSurface,
} from '../../src/tenancy/team-roster';
import { member, NOW, VIEWER } from './team-fixtures';

describe('teamSurface — which body the list shows', () => {
  const alone = teamRosterView(
    teamRoster([member('Rajesh Kulkarni', { userId: VIEWER })], [], VIEWER, NOW, 'en'),
    '',
    'all',
  );
  const team = teamRosterView(
    teamRoster(
      [member('Rajesh Kulkarni', { userId: VIEWER }), member('Amit Rane')],
      [],
      VIEWER,
      NOW,
      'en',
    ),
    '',
    'all',
  );
  const none = teamRosterView(team.rows, 'Joshi', 'all');
  it.each([
    ['only the reader', alone, '', 'all', 'teaching'],
    ['only the reader, under a chip', alone, '', 'active', 'rows'],
    ['only the reader, searched', teamRosterView(alone.rows, 'Raj', 'all'), 'Raj', 'all', 'rows'],
    ['a search that finds no one', none, 'Joshi', 'all', 'no-match'],
    ['blank words find everyone', team, '   ', 'all', 'rows'],
    [
      'a chip with nobody under it',
      teamRosterView(team.rows, '', 'expired'),
      '',
      'expired',
      'empty-chip',
    ],
    [
      'words that find someone the chip leaves out',
      teamRosterView(team.rows, 'Amit', 'deactivated'),
      'Amit',
      'deactivated',
      'empty-chip',
    ],
    [
      'words that find no one, under a chip',
      teamRosterView(team.rows, 'Joshi', 'expired'),
      'Joshi',
      'expired',
      'no-match',
    ],
    ['a chip with someone under it', teamRosterView(team.rows, '', 'active'), '', 'active', 'rows'],
    ['a team', team, '', 'all', 'rows'],
  ] as const)('%s → %s', (_, view, query, status, expected) => {
    expect(teamSurface(view, query, status)).toBe(expected);
  });
});

describe('the Status chips and the list head', () => {
  it.each([
    ['all', 'all'],
    ['expired', 'expired'],
    ['deactivated', 'deactivated'],
    ['pending', null],
    ['', null],
  ])('a chip value of %j reads as %j', (value, filter) => {
    expect(teamStatusFilterOf(value)).toBe(filter);
  });

  const listOf = (surface: TeamSurface): Read<TeamList> => ({
    kind: 'ready',
    value: { view: teamRosterView([], '', 'all'), surface },
  });
  it.each([
    ['loading', { kind: 'loading' }, true],
    ['rows', listOf('rows'), true],
    ['no-match', listOf('no-match'), true],
    ['empty-chip', listOf('empty-chip'), true],
    ['failed', { kind: 'failed', failure: 'refused', retry: (): void => undefined }, false],
    ['teaching', listOf('teaching'), false],
  ] as const)('the %s body shows the list head: %s', (_, list: Read<TeamList>, shown) => {
    expect(showsListHead(list)).toBe(shown);
  });
});
