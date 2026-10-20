import { IN_FORMATS, INVITATION_EXPIRY_DAYS, type TeamRow } from '@heliogrid/domain';
import { beforeAll, describe, expect, it } from 'vitest';
import { TEAM, type TeamClock, teamRowWords } from '../src/copy/team';
import { teamListWords } from '../src/copy/team-list';
import { createTranslator } from '../src/runtime';

/** The Team screen's words (`SCR-M01-12`), chosen by the facts a row holds. */
let t: Awaited<ReturnType<typeof createTranslator>>['t'];
beforeAll(async () => {
  t = (await createTranslator('en')).t;
});

const TODAY = '2026-08-31T03:00:00Z';
const clock: TeamClock = {
  dayMonth: (value) =>
    ({
      '2026-08-30T10:00:00Z': '30 Aug',
      '2026-09-05T03:00:00Z': '5 Sept',
      '2026-08-27T03:00:00Z': '27 Aug',
    })[value] ?? value,
  clockAt: (value) => (value === TODAY ? '08:47' : '19:12'),
  isToday: (value) => value === TODAY,
};

function row(over: Partial<TeamRow>): TeamRow {
  return {
    id: 'r',
    name: 'Amit Rane',
    phoneE164: '+919800000001',
    roles: [],
    status: 'active',
    isViewer: false,
    lastActiveAt: null,
    expiresAt: null,
    inviteDay: null,
    ...over,
  };
}

describe('teamRowWords — each row’s line, invite bar and last cell', () => {
  it.each([
    [
      'active, seen today',
      row({ lastActiveAt: TODAY }),
      'Active · last seen today',
      'Today, 08:47',
    ],
    [
      'active, seen before',
      row({ lastActiveAt: '2026-08-30T10:00:00Z' }),
      'Active · last seen 30 Aug',
      '30 Aug, 19:12',
    ],
    ['active, never seen', row({}), 'Active', ''],
    [
      'deactivated, seen before',
      row({ status: 'deactivated', lastActiveAt: '2026-08-30T10:00:00Z' }),
      'Deactivated · last seen 30 Aug',
      '30 Aug, 19:12',
    ],
    ['deactivated, never seen', row({ status: 'deactivated' }), 'Deactivated', ''],
    [
      'expired invite',
      row({ status: 'expired', expiresAt: '2026-08-27T03:00:00Z' }),
      'Expired 27 Aug',
      'Expired 27 Aug',
    ],
  ])('%s', (_, facts, line, lastActive) => {
    const words = teamRowWords(t, facts, clock, INVITATION_EXPIRY_DAYS);
    expect([words.line, words.lastActive, words.day, words.expires]).toEqual([
      line,
      lastActive,
      null,
      null,
    ]);
  });

  it('an open invite reads Invited, its day of seven and its expiry; the table shows the expiry alone', () => {
    const words = teamRowWords(
      t,
      row({ status: 'invited', expiresAt: '2026-09-05T03:00:00Z', inviteDay: 2 }),
      clock,
      INVITATION_EXPIRY_DAYS,
    );
    expect(words).toEqual({
      status: 'Invited',
      line: 'Invited',
      day: 'Day 2 of 7',
      expires: 'Expires 5 Sept',
      lastActive: 'Expires 5 Sept',
    });
  });
});

describe('the head count — singular at one, plural otherwise (AC-15)', () => {
  it.each([
    [0, 0, '0 people · 0 invites'],
    [1, 1, '1 person · 1 invite'],
    [2, 2, '2 people · 2 invites'],
    [9, 1, '9 people · 1 invite'],
  ])('%s people and %s invites → %s', (people, invites, line) => {
    expect(t(TEAM.headCount, { people, invites })).toBe(line);
  });

  it('says it in Hindi and Marathi too', async () => {
    const hi = (await createTranslator('hi')).t;
    const mr = (await createTranslator('mr')).t;
    expect(hi(TEAM.headCount, { people: 1, invites: 2 })).not.toBe('1 person · 2 invites');
    expect(mr(TEAM.headCount, { people: 1, invites: 2 })).not.toBe('1 person · 2 invites');
  });
});

describe('a Status chip with nobody under it — the line under that chip, none under All', () => {
  it.each([
    ['all', null],
    ['invited', 'No open invites'],
    ['expired', 'No expired invites'],
    ['active', 'No one active'],
    ['deactivated', 'No one deactivated'],
  ] as const)('under %s → %s', (status, line) => {
    const words = teamListWords(t, {
      pack: IN_FORMATS,
      language: 'en',
      now: Date.parse(TODAY),
      company: 'Suryodaya Solar',
      query: '',
      status,
    });
    expect(words.emptyChip).toBe(line);
  });
});
