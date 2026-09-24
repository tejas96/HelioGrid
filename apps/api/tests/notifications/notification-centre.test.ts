import type { Notification, Paginated, SessionProjection, UnreadCount } from '@heliogrid/contracts';
import { httpStatusFor } from '@heliogrid/contracts';
import { notification } from '@heliogrid/db';
import {
  centreGroupKey,
  clockTime,
  NOTIFICATION_CENTRE_HORIZON_DAYS,
  type NotificationType,
} from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  type NotificationToWrite,
  recordNotification,
} from '../../src/modules/notification/notification.repository';
import { openPools, unseed } from '../support/fixture';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';

/**
 * The notification CENTRE on the wire (`F6-07`, `F6-12`, `F6-17`, `F6-19`): the horizon every
 * read is bounded by, the two filters, the group key and mark-all-read — the app production
 * boots, on port 0, against a migrated database. Rows are seeded through the one writer, because
 * no module emits a notification yet.
 */

/** A window with no length keeps no quiet hours (`F6-14`), so no seeded push is held. */
const NO_QUIET_HOURS = {
  window: { start: clockTime('00:00'), end: clockTime('00:00') },
  timezone: 'Asia/Kolkata',
};
const MS_PER_MINUTE = 60_000;
const MINUTES_PER_DAY = 24 * 60;
const MS_PER_DAY = MINUTES_PER_DAY * MS_PER_MINUTE;
/** 20:00 UTC is 01:30 the next day in India, so the tenant's day and the server's disagree. */
const UTC_EVENING_HOUR = 20;
const UTC_EVENING_MS = UTC_EVENING_HOUR * 60 * MS_PER_MINUTE;
/** Recent rows half an hour apart, so "newest first" is unambiguous. */
const MINUTES_AGO = { opened: 60, payment: 90, escalation: 120 } as const;
/** Wide enough that every seeded row is on one page. */
const WHOLE_CENTRE = 50;

const skip = skipWithoutHarness(
  'NOTIFICATION CENTRE WIRE PROOF',
  'The centre routes are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('the notification centre, over HTTP against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;
  let here: SessionProjection;
  let tenantId: string;
  let userId: string;
  let now: number;

  const minutesAgo = (minutes: number) => (at: number) => at - minutes * MS_PER_MINUTE;
  /**
   * 20:00 UTC yesterday — 01:30 the NEXT day in the tenant's zone. On it the tenant's day and the
   * server's disagree, so a group key read on the wrong clock cannot pass.
   */
  const lastUtcEvening = (at: number) =>
    Math.floor(at / MS_PER_DAY) * MS_PER_DAY - MS_PER_DAY + UTC_EVENING_MS;

  /** Each seeded row: its type and when, relative to `now`, it was emitted. */
  const seeded = {
    pastHorizon: {
      type: 'proposal_opened',
      emitted: minutesAgo((NOTIFICATION_CENTRE_HORIZON_DAYS + 1) * MINUTES_PER_DAY),
    },
    insideHorizon: {
      type: 'proposal_opened',
      emitted: minutesAgo((NOTIFICATION_CENTRE_HORIZON_DAYS - 1) * MINUTES_PER_DAY),
    },
    opened: { type: 'proposal_opened', emitted: minutesAgo(MINUTES_AGO.opened) },
    payment: { type: 'payment_due', emitted: minutesAgo(MINUTES_AGO.payment) },
    escalation: { type: 'agent_escalation', emitted: minutesAgo(MINUTES_AGO.escalation) },
    alreadyRead: { type: 'survey_submitted', emitted: lastUtcEvening },
  } as const satisfies Record<string, { type: NotificationType; emitted: (at: number) => number }>;
  type Seeded = keyof typeof seeded;
  const ids = {} as Record<Seeded | 'afterSeen', string>;

  const write = (title: string, type: NotificationType, emittedAt: number) =>
    pools.admin.db.transaction((tx) =>
      recordNotification(
        tx,
        {
          tenantId,
          recipientUserRef: userId,
          type,
          subjectKind: 'tenant',
          subjectRef: tenantId,
          title,
          body: `${title} — body`,
          language: 'en',
          emittedAt: new Date(emittedAt),
        } satisfies NotificationToWrite,
        NO_QUIET_HOURS,
      ),
    );

  const idOf = async (title: string) => {
    const [row] = await pools.admin.db
      .select({ id: notification.id })
      .from(notification)
      .where(and(eq(notification.tenantId, tenantId), eq(notification.title, title)));
    return row?.id as string;
  };

  const list = (query = '') =>
    http.call<Paginated<Notification>>('GET', `/notifications?limit=${WHOLE_CENTRE}${query}`);
  const titles = (page: Paginated<Notification>) => page.items.map((item) => item.title).sort();

  beforeAll(async () => {
    pools = openPools();
    http = await bootHttp();
    await http.signIn();
    here = await http.createCompany('Centre EPC');
    tenantId = here.membership?.tenantId as string;
    userId = here.actor.userId;
    now = Date.now();
    for (const [title, row] of Object.entries(seeded)) {
      await write(title, row.type, row.emitted(now));
      ids[title as Seeded] = await idOf(title);
    }
    await http.call('POST', `/notifications/${ids.alreadyRead}/read`, {});
  });

  afterAll(async () => {
    await unseed(pools.admin.db, {
      companies: http.createdTenantIds.map((id) => ({ tenantId: id, companyName: '' })),
      people: [],
      memberships: [],
    });
    await http.close();
    await pools.close();
  });

  it('lists and counts only inside the horizon, and the badge agrees (F6-19, F6-17)', async () => {
    const all = await list();
    expect(all.status).toBe(HttpStatus.OK);
    expect(titles(all.body)).toEqual(
      ['alreadyRead', 'escalation', 'insideHorizon', 'opened', 'payment'].sort(),
    );
    expect(all.body.totalCount).toBe(all.body.items.length);

    const badge = await http.call<UnreadCount>('GET', '/notifications/unread-count');
    expect(badge.body).toEqual({
      unreadCount: all.body.items.filter((item) => item.readAt === null).length,
    });
  });

  it('filters to the unread, counting the same filter (F6-17)', async () => {
    const unread = await list('&readState=unread');
    expect(titles(unread.body)).toEqual(
      ['escalation', 'insideHorizon', 'opened', 'payment'].sort(),
    );
    expect(unread.body.totalCount).toBe(unread.body.items.length);
  });

  it.each([
    ['payments', ['payment']],
    ['payments,delivery', ['alreadyRead', 'payment']],
    ['payments,payments', ['payment']],
    // No source raises a billing type yet, so the group admits nothing — and must match nothing.
    ['billing', []],
  ])(
    'filters to the type groups %s, counting the same filter (F6-17)',
    async (groups, expected) => {
      const filtered = await list(`&typeGroups=${groups}`);
      expect(filtered.status).toBe(HttpStatus.OK);
      expect(titles(filtered.body)).toEqual([...expected].sort());
      expect(filtered.body.totalCount).toBe(expected.length);
    },
  );

  it.each(['sales,nope', '', 'sales,,payments'])(
    'refuses the type-group list %j before any query runs',
    async (groups) => {
      const reply = await http.call<{ error: { code: string; details?: { path: string }[] } }>(
        'GET',
        `/notifications?typeGroups=${groups}`,
      );
      expect(reply.status).toBe(httpStatusFor('VALIDATION_FAILED'));
      expect(reply.body.error.details?.map((d) => d.path)).toContain('typeGroups');
    },
  );

  it("carries the domain's group key, in the tenant's zone, and none for an immediate type (F6-12)", async () => {
    const all = await list();
    for (const item of all.body.items) {
      expect(item.groupKey).toBe(
        centreGroupKey(
          item.type as NotificationType,
          'tenant',
          Date.parse(item.emittedAt),
          'Asia/Kolkata',
        ),
      );
    }
    const escalation = all.body.items.find((item) => item.title === 'escalation');
    expect(escalation?.groupKey).toBeNull();
  });

  it('refuses a mark-all-read with no instant it was seen through', async () => {
    const reply = await http.call<{ error: { code: string; details?: { path: string }[] } }>(
      'POST',
      '/notifications/read-all',
      { seenThrough: 'yesterday' },
    );
    expect(reply.status).toBe(httpStatusFor('VALIDATION_FAILED'));
    expect(reply.body.error.details?.map((d) => d.path)).toContain('seenThrough');
  });

  it('marks read only what the list showed, inside its filter, up only, deleting nothing (F6-07)', async () => {
    const shown = await list('&readState=unread');
    const seenThrough = shown.body.items[0]?.emittedAt as string;
    // A notification that lands after the reader's list rendered, and before the tap.
    await write('afterSeen', 'proposal_opened', Date.parse(seenThrough) + MS_PER_MINUTE);
    ids.afterSeen = await idOf('afterSeen');
    const rowsBefore = await pools.admin.db
      .select({ id: notification.id })
      .from(notification)
      .where(eq(notification.tenantId, tenantId));

    const payments = await http.call<{ marked: number }>('POST', '/notifications/read-all', {
      seenThrough,
      typeGroups: 'payments',
    });
    expect(payments.body).toEqual({ marked: 1 });

    const rest = await http.call<{ marked: number }>('POST', '/notifications/read-all', {
      seenThrough,
    });
    expect(rest.status).toBe(HttpStatus.OK);
    expect(rest.body).toEqual({ marked: 3 });

    const again = await http.call<{ marked: number }>('POST', '/notifications/read-all', {
      seenThrough,
    });
    expect(again.body).toEqual({ marked: 0 });

    const stillUnread = await pools.admin.db
      .select({ title: notification.title })
      .from(notification)
      .where(and(eq(notification.tenantId, tenantId), isNull(notification.readAt)));
    expect(stillUnread.map((row) => row.title).sort()).toEqual(['afterSeen', 'pastHorizon']);

    const rowsAfter = await pools.admin.db
      .select({ id: notification.id })
      .from(notification)
      .where(eq(notification.tenantId, tenantId));
    expect(rowsAfter.length).toBe(rowsBefore.length);
  });

  it('keeps the first read moment when mark-all-read reaches an item already read (F6-07)', async () => {
    const [before] = await pools.admin.db
      .select({ readAt: notification.readAt })
      .from(notification)
      .where(eq(notification.id, ids.alreadyRead));
    await http.call('POST', '/notifications/read-all', {
      seenThrough: new Date(now + MS_PER_DAY).toISOString(),
      typeGroups: 'delivery',
    });
    const [after] = await pools.admin.db
      .select({ readAt: notification.readAt })
      .from(notification)
      .where(eq(notification.id, ids.alreadyRead));
    expect(after?.readAt).toEqual(before?.readAt);
  });
});
