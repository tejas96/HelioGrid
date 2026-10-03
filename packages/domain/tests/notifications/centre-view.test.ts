import { describe, expect, it } from 'vitest';
import { centreGroupKey } from '../../src/notifications/centre';
import {
  type CentreNotification,
  centreView,
  isAnnouncement,
} from '../../src/notifications/centre-view';
import { NOTIFICATION_TYPES } from '../../src/notifications/types';

/**
 * The centre's list, decided once for both apps (`F6-12`, `F6-17`, `F6-07`, `F4-27`). Items arrive
 * newest first, as the server sends them; every day is the TENANT's (`F1-10`).
 */
const IST = 'Asia/Kolkata';
const NOW = Date.parse('2026-08-19T10:50:00Z'); // 16:20 in Nashik, Wed 19 Aug 2026

let next = 0;
function item(emittedAt: string, groupKey: string | null, read = false): CentreNotification {
  next += 1;
  return {
    id: `n${next}`,
    type: 'proposal_opened',
    emittedAt,
    readAt: read ? emittedAt : null,
    groupKey,
  };
}
const view = (items: readonly CentreNotification[]) =>
  centreView(items, { now: NOW, timeZone: IST, hasMore: false });

describe('centreView — rows (F6-12)', () => {
  it('groups equal keys into one row at the newest member, members newest first', () => {
    const newest = item('2026-08-19T10:18:00Z', 'k');
    const single = item('2026-08-19T09:00:00Z', null);
    const middle = item('2026-08-19T07:00:00Z', 'k');
    const oldest = item('2026-08-19T04:11:00Z', 'k', true);
    const [today] = view([newest, single, middle, oldest]).days;
    expect(today?.rows).toEqual([
      { kind: 'group', key: 'k', members: [newest, middle, oldest], unread: 2 },
      { kind: 'single', item: single },
    ]);
  });

  it('a null key never groups — the escalation stands alone however many arrive', () => {
    const escalation = centreGroupKey('agent_escalation', 'tenant', NOW, IST);
    expect(escalation).toBeNull();
    const first = item('2026-08-19T10:00:00Z', escalation);
    const second = item('2026-08-19T09:00:00Z', escalation);
    expect(view([first, second]).days[0]?.rows).toEqual([
      { kind: 'single', item: first },
      { kind: 'single', item: second },
    ]);
  });

  it('a key with one loaded member is that item on its own', () => {
    const lone = item('2026-08-19T10:00:00Z', 'k');
    expect(view([lone]).days[0]?.rows).toEqual([{ kind: 'single', item: lone }]);
  });
});

describe('centreView — days on the tenant clock (F1-10)', () => {
  it.each([
    ['00:00 IST is today', '2026-08-18T18:30:00Z', 0],
    ['23:59 IST the day before is yesterday', '2026-08-18T18:29:00Z', 1],
    ['00:30 IST sits in today, though UTC still calls it yesterday', '2026-08-18T19:00:00Z', 0],
    ['the horizon end, 29 days back', '2026-07-21T06:00:00Z', 29],
    ['a minute ahead of a device clock that runs behind is still today', '2026-08-19T10:51:00Z', 0],
    ['past midnight ahead of that clock is today, never a past day', '2026-08-19T18:31:00Z', 0],
  ])('%s', (_, emittedAt, daysAgo) => {
    expect(view([item(emittedAt, null)]).days[0]?.daysAgo).toBe(daysAgo);
  });

  it('starts a new day only when the date changes, newest day first', () => {
    const days = view([
      item('2026-08-19T10:00:00Z', null),
      item('2026-08-19T05:00:00Z', null),
      item('2026-08-18T10:00:00Z', null),
    ]).days;
    expect(days.map((day) => [day.date, day.rows.length])).toEqual([
      ['2026-08-19', 2],
      ['2026-08-18', 1],
    ]);
  });
});

describe('centreView — mark all read (F6-07, F4-27)', () => {
  it.each([
    ['nothing listed', [], false],
    // A type-group filter can hide every unread while the bell still counts some elsewhere.
    ['everything listed is read', [item('2026-08-19T10:00:00Z', null, true)], false],
    ['one unread listed', [item('2026-08-19T10:00:00Z', null)], true],
    [
      'the only unread is a group member',
      [item('2026-08-19T10:00:00Z', 'k', true), item('2026-08-19T09:00:00Z', 'k')],
      true,
    ],
  ])('mark all shows only with unread in the list — %s', (_, items, shows) => {
    expect(view(items).markAllShows).toBe(shows);
  });

  it('seenThrough is the newest shown, so a later arrival stays unread', () => {
    const newest = item('2026-08-19T10:18:00Z', null, true);
    expect(view([newest, item('2026-08-19T09:00:00Z', null)]).seenThrough).toBe(newest.emittedAt);
    expect(view([]).seenThrough).toBeNull();
  });
});

describe('isAnnouncement — product news never passes for tenant work (F6.4)', () => {
  it('is the platform type alone', () => {
    expect(NOTIFICATION_TYPES.filter(isAnnouncement)).toEqual(['system']);
  });

  it('a type this build does not know is tenant work', () => {
    expect(isAnnouncement('invoice_raised')).toBe(false);
  });
});
