import {
  IN_FORMATS,
  INVITATION_EXPIRY_DAYS,
  type TeamAct,
  type TeamRow,
  type UiLanguage,
} from '@heliogrid/domain';
import { beforeAll, describe, expect, it } from 'vitest';
import { TEAM, type TeamClock, teamRowWords } from '../src/copy/team';
import { teamActWords } from '../src/copy/team-acts';
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

describe('teamActWords — the row acts’ confirms, refusal and toasts', () => {
  const words = () => teamActWords(t, 'Suryodaya Solar');

  it('a deactivate confirm names the person, then calls them by their first name', () => {
    expect(words().deactivate('Anjali Kulkarni')).toEqual({
      title: 'Deactivate Anjali Kulkarni?',
      go: 'Deactivate Anjali',
      body: 'Anjali loses access to Suryodaya Solar. Everything Anjali did stays in Anjali’s name.',
    });
  });

  it('a one-word name is used whole', () => {
    expect(words().deactivate('Sunil').go).toBe('Deactivate Sunil');
  });

  it('a revoke confirm and its toast', () => {
    expect(words().revoke('Priya Deshmukh')).toEqual({
      title: 'Revoke Priya Deshmukh’s invite?',
      go: 'Revoke invite',
      body: 'The invite link stops working now. You can invite Priya again any time.',
    });
    expect(words().toast({ kind: 'revoked', name: 'Priya Deshmukh' })).toEqual({
      tone: 'neutral',
      title: 'Invite to Priya Deshmukh revoked',
      description: 'Inviting Priya again sends a new link.',
    });
  });

  const rajesh = {
    id: 'm-1',
    name: 'Rajesh Kulkarni',
    phoneE164: '+919800000001',
    roles: [],
    status: 'active',
    isViewer: true,
    lastActiveAt: null,
    expiresAt: null,
    inviteDay: null,
  } as const satisfies TeamRow;

  it('an open deactivate confirm reads its question, act and Cancel', () => {
    expect(
      words().confirm({ kind: 'asking', act: 'deactivate', row: rajesh, busy: false }),
    ).toEqual({
      title: 'Deactivate Rajesh Kulkarni?',
      go: 'Deactivate Rajesh',
      body: 'Rajesh loses access to Suryodaya Solar. Everything Rajesh did stays in Rajesh’s name.',
      leave: 'Cancel',
    });
  });

  it.each([
    ['Meera Iyer', 'Meera Iyer stopped being an EPC Owner on another device.'],
    [null, null],
  ])('the refused form with %s lost', (lostOwner, body) => {
    expect(words().confirm({ kind: 'refused', row: rajesh, lostOwner })).toEqual({
      title: 'Deactivate Rajesh Kulkarni?',
      go: 'Deactivate Rajesh',
      leave: 'Close',
      refusal: { title: 'Not done — Suryodaya Solar must keep one EPC Owner', body },
      goOffReason: 'Make someone else an EPC Owner first',
    });
  });

  it('a shut confirm has no words', () => {
    expect(words().confirm({ kind: 'shut' })).toBeNull();
  });

  it.each([
    ['INVITE_CAP_REACHED', 'Your company has reached its invite limit for the last 24 hours.'],
    ['DOMAIN_RULE_VIOLATION', "That change isn't allowed here."],
    ['NO_SUCH_CODE', 'Something went wrong on our side. Try again.'],
  ])('a turned-down act says %s in its shipped words', (code, said) => {
    expect(words().toast({ kind: 'turned-down', code })).toEqual({ tone: 'danger', title: said });
  });

  it.each([
    [
      { kind: 'deactivated', name: 'Anjali Kulkarni' } as const,
      { tone: 'neutral', title: 'Anjali Kulkarni deactivated' },
    ],
    [
      { kind: 'failed' } as const,
      { tone: 'danger', title: 'Something went wrong on our side. Try again.' },
    ],
    [{ kind: 'moved' } as const, null],
  ])('a settled act %o raises %o', (note, toast) => {
    expect(words().toast(note)).toEqual(toast);
  });
});

describe('teamActWords.spoken — a row act heard with its person (D291)', () => {
  it.each([
    ['deactivate', 'Deactivate Anjali Kulkarni'],
    ['revoke', 'Revoke invite for Anjali Kulkarni'],
    ['invite-again', 'Invite again: Anjali Kulkarni'],
  ] as const)('%s → %s', (act, said) => {
    expect(teamActWords(t, 'Suryodaya Solar').spoken(act, 'Anjali Kulkarni')).toBe(said);
  });

  it.each<UiLanguage>(['en', 'hi', 'mr'])(
    '%s opens with the act’s own visible words, so speech control finds it',
    async (reader) => {
      const words = teamActWords((await createTranslator(reader)).t, 'Suryodaya Solar');
      for (const act of ['deactivate', 'revoke', 'invite-again'] satisfies TeamAct[]) {
        const said = words.spoken(act, 'Anjali Kulkarni');
        expect(said.startsWith(words.act(act))).toBe(true);
        expect(said).toContain('Anjali Kulkarni');
      }
    },
  );
});
