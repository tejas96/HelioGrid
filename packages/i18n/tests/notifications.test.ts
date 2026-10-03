import { NOTIFICATION_CENTRE_HORIZON_DAYS } from '@heliogrid/domain';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  centreDayLabel,
  centreHeadLine,
  centreHorizonLine,
  filtersInForce,
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

describe('filtersInForce — what the list is filtered by', () => {
  it.each([
    [{ unreadOnly: true, groups: ['sales'] as const }, 'Filters in force: Unread · Sales'],
    [
      { unreadOnly: true, groups: ['sales', 'delivery'] as const },
      'Filters in force: Unread · Sales, Delivery',
    ],
    [{ unreadOnly: false, groups: ['payments'] as const }, 'Filters in force: Payments'],
    [{ unreadOnly: true, groups: [] as const }, 'Filters in force: Unread'],
  ])('%j', (filters, line) => {
    expect(filtersInForce(t, filters)).toBe(line);
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
