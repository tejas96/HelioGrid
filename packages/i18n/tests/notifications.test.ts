import {
  type CentreNotification,
  centreView,
  NOTIFICATION_CENTRE_HORIZON_DAYS,
} from '@heliogrid/domain';
import { beforeAll, describe, expect, it } from 'vitest';
import { centreActToast, centreFilterWords, centreHeadWords } from '../src/copy/notification-head';
import { centreListWords } from '../src/copy/notification-list';
import {
  centreDayLabel,
  centreHeadLine,
  centreHorizonLine,
  groupSentence,
  notificationCardName,
} from '../src/copy/notifications';
import { createTranslator } from '../src/runtime';

/** The notification centre's words (`SCR-SHELL-03`), chosen by the facts the screen holds. */
let t: Awaited<ReturnType<typeof createTranslator>>['t'];
beforeAll(async () => {
  t = (await createTranslator('en')).t;
});

describe('centreHeadLine — the head counts from the records (F6-17, F6-19)', () => {
  it.each([
    [
      'unread, no filter',
      { filtered: false, match: 46, unread: 7, total: 46 },
      '7 unread · 46 in the last 30 days',
    ],
    [
      'nothing unread, no filter',
      { filtered: false, match: 46, unread: 0, total: 46 },
      'Nothing unread · 46 in the last 30 days',
    ],
    [
      'under a filter',
      { filtered: true, match: 6, unread: 7, total: 46 },
      '6 match · 7 unread in all',
    ],
    [
      'under a filter that matches nothing',
      { filtered: true, match: 0, unread: 7, total: 46 },
      '0 match · 7 unread in all',
    ],
  ])('%s', (_, facts, line) => {
    expect(centreHeadLine(t, facts)).toBe(line);
  });
});

describe('centreDayLabel — the day over its rows, on the tenant clock', () => {
  it.each([
    [0, 'Today · 19 Aug 2026'],
    [1, 'Yesterday · 19 Aug 2026'],
    [2, 'Monday · 19 Aug 2026'],
  ])('%i days ago', (daysAgo, label) => {
    expect(centreDayLabel(t, { daysAgo, date: '19 Aug 2026', weekday: 'Monday' })).toBe(label);
  });
});

describe('groupSentence — what a group holds (F6-12)', () => {
  it.each([
    ['proposal_opened', 1, '1 proposal opened'],
    ['proposal_opened', 3, '3 proposals opened'],
    ['survey_submitted', 2, '2 surveys submitted'],
    ['a type this build does not know', 4, '4 notifications'],
  ])('%s × %i', (type, count, sentence) => {
    expect(groupSentence(t, type, count)).toBe(sentence);
  });
});

describe('centreHorizonLine — the centre says it is an inbox, not an archive (F6-19)', () => {
  it('the horizon names the days the reads are bounded by', () => {
    expect(centreHorizonLine(t)).toContain(`the last ${NOTIFICATION_CENTRE_HORIZON_DAYS} days`);
    expect(centreHorizonLine(t)).toContain('an inbox, not an archive');
  });
});

describe('notificationCardName — what a screen reader hears for a card', () => {
  const card = { title: 'Design v2 is ready', body: 'Rooftop design', time: '14:02' };
  it.each([
    [true, 'Unread. Design v2 is ready. Rooftop design. 14:02.'],
    [false, 'Design v2 is ready. Rooftop design. 14:02.'],
  ])('unread %s', (unread, name) => {
    expect(notificationCardName(t, { ...card, unread })).toBe(name);
  });

  it.each([
    ['Templates now carry your logo.', 'Title. Templates now carry your logo. 14:02.'],
    ['रिपोर्ट तयार है।', 'Title. रिपोर्ट तयार है. 14:02.'],
    ['No stop', 'Title. No stop. 14:02.'],
  ])('a body with its own stop is not stopped twice: %s', (body, name) => {
    expect(notificationCardName(t, { title: 'Title', body, time: '14:02', unread: false })).toBe(
      name,
    );
  });
});

describe('the centre in Hindi and Marathi', () => {
  it.each(['hi', 'mr'] as const)(
    '%s renders the head and a group without English',
    async (language) => {
      const local = (await createTranslator(language)).t;
      const head = centreHeadLine(local, { filtered: false, match: 46, unread: 7, total: 46 });
      expect(head).not.toContain('unread');
      expect(groupSentence(local, 'proposal_opened', 3)).not.toContain('opened');
    },
  );
});

describe('centreListWords — the words each row of the list shows, for both apps', () => {
  type Item = CentreNotification & { title: string; body: string };
  const item = (id: string, over: Partial<Item>): Item => ({
    id,
    type: 'proposal_opened',
    emittedAt: '2026-08-19T10:00:00.000Z',
    readAt: null,
    groupKey: null,
    title: `Title ${id}`,
    body: `Body ${id}`,
    ...over,
  });
  const clock = {
    clockAt: (value: string) => value.slice(11, 16),
    date: (value: string) => `date of ${value.slice(0, 10)}`,
    weekday: (value: string) => `weekday of ${value.slice(0, 10)}`,
  };
  const facts = { now: Date.parse('2026-08-19T12:00:00.000Z'), timeZone: 'UTC', hasMore: false };
  const wordsOf = (items: readonly Item[]) =>
    centreListWords(t, centreView(items, facts).days, clock);

  it('a single unread card carries its time, the Unread word and its spoken name', () => {
    const [day] = wordsOf([item('a', {})]);
    expect(day?.label).toBe('Today · date of 2026-08-19');
    expect(day?.rows[0]).toMatchObject({
      kind: 'card',
      title: 'Title a',
      time: '10:00',
      unreadLabel: 'Unread',
      name: 'Unread. Title a. Body a. 10:00.',
    });
  });

  it('a read card carries no Unread word', () => {
    const [day] = wordsOf([item('a', { readAt: '2026-08-19T11:00:00.000Z' })]);
    expect(day?.rows[0]).toMatchObject({ kind: 'card', unreadLabel: undefined });
  });

  it('a group says what it holds, when the latest came, and how many are unread', () => {
    const members = ['c', 'b', 'a'].map((id, index) =>
      item(id, {
        groupKey: 'k',
        emittedAt: `2026-08-19T1${2 - index}:00:00.000Z`,
        readAt: id === 'a' ? '2026-08-19T12:00:00.000Z' : null,
      }),
    );
    const [day] = wordsOf(members);
    expect(day?.rows).toHaveLength(1);
    expect(day?.rows[0]).toMatchObject({
      kind: 'group',
      sentence: '3 proposals opened',
      latest: '12:00 latest',
      unreadLabel: '2 unread',
      showLabel: 'Show these 3',
      hideLabel: 'Hide these 3',
    });
    const row = day?.rows[0];
    expect(row?.kind === 'group' ? row.members.map((m) => [m.id, m.line]) : []).toEqual([
      ['c', '12:00 · Body c'],
      ['b', '11:00 · Body b'],
      ['a', '10:00 · Body a'],
    ]);
  });

  it('product news is the announcement form, naming who speaks, with no Unread word', () => {
    const [day] = wordsOf([item('n', { type: 'system' })]);
    expect(day?.rows[0]).toMatchObject({
      kind: 'announcement',
      overline: 'From HelioGrid · product news',
      name: 'Title n. Body n. 10:00.',
    });
  });

  it('an earlier day is named by its weekday', () => {
    const days = wordsOf([item('a', {}), item('b', { emittedAt: '2026-08-16T10:00:00.000Z' })]);
    expect(days.map((day) => day.label)).toEqual([
      'Today · date of 2026-08-19',
      'weekday of 2026-08-16 · date of 2026-08-16',
    ]);
  });
});

describe('centreHeadWords — the head both apps draw', () => {
  const facts = {
    readState: 'all',
    filtered: false,
    match: 46,
    unread: 7,
    unreadListed: 7,
    markAllShows: true,
  } as const;

  it.each([
    [
      'unfiltered: every unread',
      facts,
      '7 unread · 46 in the last 30 days',
      'Mark all 7 unread notifications read',
    ],
    [
      'Unread + Sales: every match is unread',
      { ...facts, readState: 'unread', filtered: true, match: 2, unreadListed: 2 },
      '2 match · 7 unread in all',
      'Mark all 2 unread notifications read',
    ],
    [
      'Sales alone, 6 matched, 2 of them unread: the unread listed, never the matches',
      { ...facts, filtered: true, match: 6, unreadListed: 2 },
      '6 match · 7 unread in all',
      'Mark all 2 unread notifications read',
    ],
    [
      'the unread count not yet known: left out, never 0',
      { ...facts, unread: null, unreadListed: 3 },
      '46 in the last 30 days',
      'Mark all 3 unread notifications read',
    ],
    [
      'filtered and the count not known',
      { ...facts, filtered: true, match: 6, unread: null, unreadListed: 2 },
      '6 match',
      'Mark all 2 unread notifications read',
    ],
  ] as const)('%s', (_, given, count, markAllName) => {
    const head = centreHeadWords(t, given);
    expect(head.count).toBe(count);
    expect(head.markAllName).toBe(markAllName);
  });

  it('nothing unread listed: Mark all read is absent, never greyed (F4-27)', () => {
    expect(centreHeadWords(t, { ...facts, markAllShows: false }).markAllName).toBeUndefined();
  });
});

describe('centreActToast — what an act says when it ends (F4-27)', () => {
  it.each([
    [
      { kind: 'marked', count: 6 },
      'success',
      '6 marked read',
      'Nothing was deleted — every notification is still in the list.',
    ],
    [
      { kind: 'failed' },
      'danger',
      'Couldn’t mark them read',
      'Nothing changed. Try again in a moment.',
    ],
    [
      { kind: 'read-failed' },
      'danger',
      'Couldn’t mark it read',
      'Nothing changed. Try again in a moment.',
    ],
  ] as const)('%j', (outcome, tone, title, description) => {
    expect(centreActToast(t, outcome)).toEqual({ tone, title, description });
  });

  it('a second press that was not sent raises nothing', () => {
    expect(centreActToast(t, { kind: 'busy' })).toBeNull();
  });
});

describe('centreFilterWords — the filter bar', () => {
  it('names the bar, the Unread toggle and the five groups in order', () => {
    const bar = centreFilterWords(t);
    expect(bar.label).toBe('Filter notifications');
    expect(bar.unread).toEqual({ label: 'Unread', name: 'Unread only' });
    expect(bar.groups.map((group) => group.label)).toEqual([
      'Sales',
      'Delivery',
      'Payments',
      'Team',
      'Billing',
    ]);
  });
});
