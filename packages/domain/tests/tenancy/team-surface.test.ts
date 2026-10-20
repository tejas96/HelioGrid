import { describe, expect, it } from 'vitest';
import {
  showsListHead,
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
    ['still reading', 'loading', team, '', 'all', 'loading'],
    ['a read failed', 'failed', team, '', 'all', 'failed'],
    ['only the reader', 'ready', alone, '', 'all', 'teaching'],
    ['only the reader, under a chip', 'ready', alone, '', 'active', 'ready'],
    [
      'only the reader, searched',
      'ready',
      teamRosterView(alone.rows, 'Raj', 'all'),
      'Raj',
      'all',
      'ready',
    ],
    ['a search that finds no one', 'ready', none, 'Joshi', 'all', 'no-match'],
    ['blank words find everyone', 'ready', team, '   ', 'all', 'ready'],
    [
      'a chip with nobody under it',
      'ready',
      teamRosterView(team.rows, '', 'expired'),
      '',
      'expired',
      'empty-chip',
    ],
    [
      'words that find someone the chip leaves out',
      'ready',
      teamRosterView(team.rows, 'Amit', 'deactivated'),
      'Amit',
      'deactivated',
      'empty-chip',
    ],
    [
      'words that find no one, under a chip',
      'ready',
      teamRosterView(team.rows, 'Joshi', 'expired'),
      'Joshi',
      'expired',
      'no-match',
    ],
    [
      'a chip with someone under it',
      'ready',
      teamRosterView(team.rows, '', 'active'),
      '',
      'active',
      'ready',
    ],
    ['a team', 'ready', team, '', 'all', 'ready'],
  ] as const)('%s → %s', (_, load, view, query, status, expected) => {
    expect(teamSurface(load, view, query, status)).toBe(expected);
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

  it.each([
    ['loading', true],
    ['ready', true],
    ['no-match', true],
    ['empty-chip', true],
    ['failed', false],
    ['teaching', false],
  ] as const)('the %s body shows the list head: %s', (surface, shown) => {
    expect(showsListHead(surface)).toBe(shown);
  });
});
