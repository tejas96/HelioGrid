import type { Notification, Paginated, SessionProjection, UnreadCount } from '@heliogrid/contracts';
import { httpStatusFor } from '@heliogrid/contracts';
import { notification } from '@heliogrid/db';
import { clockTime, FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { inArray, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  type NotificationToWrite,
  recordNotification,
} from '../../src/modules/notification/notification.repository';
import { aMembership, aPerson, openPools, seed } from '../support/fixture';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';

/**
 * The notification routes on the WIRE, against a migrated database (`F6-02`, `F6-06`, `F6-07`,
 * `F6-09`): the app production boots, listening on port 0, driven with real requests — so the
 * guard, the validation, the filter and the tenancy precondition are all in the path, which the
 * repository alone never proves. Rows are seeded through the one writer, because no module
 * emits a notification yet.
 *
 * That NO role may change any column but `read_at` is NOT proven here: it is a privilege read
 * from the catalog over every RLS-subject role, which `tests/invariants` owns.
 */

/**
 * The tenant clock every seeded row is written against. A window with no length keeps no quiet
 * hours (`F6-14`), so seeding here never holds a push and the ordering tests read what they mean.
 */
const NO_QUIET_HOURS = {
  window: { start: clockTime('00:00'), end: clockTime('00:00') },
  timezone: 'Asia/Kolkata',
};

/** Far enough apart that "newest first" is unambiguous, and old enough that seeding is in the past. */
const A_SECOND_MS = 1_000;
/** Three rows for the reader, so a page of two has a boundary inside the set. */
const SEEDED = 3;
const PAGE_OF_TWO = 2;
/** Wide enough that every seeded row is on one page. */
const WHOLE_INBOX = 50;

/** The SQLSTATE the database refused with — the verdict itself, never the echoed query text. */
async function refusalCode(run: () => Promise<unknown>): Promise<string | undefined> {
  try {
    await run();
  } catch (thrown) {
    for (let error: unknown = thrown; error instanceof Error; error = error.cause) {
      const code = (error as { code?: unknown }).code;
      if (typeof code === 'string') return code;
    }
  }
  return undefined;
}
const NOT_NULL_VIOLATION = '23502';
const INVALID_ENUM_INPUT = '22P02';

const skip = skipWithoutHarness(
  'NOTIFICATION WIRE PROOF',
  'The routes are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('the notification routes, over HTTP against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;
  let here: SessionProjection;
  let tenantId: string;
  let userId: string;
  /** Seeded newest-last: `oldest` < `middle` < `newest` by `emitted_at`. */
  const ids = { oldest: '', middle: '', newest: '' };

  /** A second person in the SAME company — the one case only the recipient predicate holds. */
  const colleague = aPerson('Priya Kulkarni');

  const sent = (title: string, emittedAt: Date): NotificationToWrite => ({
    tenantId,
    recipientUserRef: userId,
    type: 'proposal_opened',
    subjectKind: 'tenant',
    subjectRef: tenantId,
    title,
    body: `${title} — body`,
    language: 'en',
    emittedAt,
  });

  beforeAll(async () => {
    pools = openPools();
    http = await bootHttp();
    await http.signIn();
    here = await http.createCompany('Notified EPC');
    tenantId = here.membership?.tenantId as string;
    userId = here.actor.userId;

    await seed(pools.admin.db, {
      companies: [],
      people: [colleague],
      memberships: [
        aMembership({ tenantId, companyName: 'Notified EPC' }, colleague, [FOUNDER_ROLE]),
      ],
    });
    await pools.admin.db.transaction((tx) =>
      recordNotification(
        tx,
        { ...sent("colleague's own", new Date()), recipientUserRef: colleague.userId },
        NO_QUIET_HOURS,
      ),
    );

    const now = Date.now();
    const oldestFirst = ['oldest', 'middle', 'newest'] as const;
    for (const [index, key] of oldestFirst.entries()) {
      const secondsAgo = oldestFirst.length - index;
      await pools.admin.db.transaction((tx) =>
        recordNotification(tx, sent(key, new Date(now - secondsAgo * A_SECOND_MS)), NO_QUIET_HOURS),
      );
    }
    const all = await http.call<Paginated<Notification>>(
      'GET',
      `/notifications?limit=${WHOLE_INBOX}`,
    );
    for (const item of all.body.items) {
      if (item.title in ids) ids[item.title as keyof typeof ids] = item.id;
    }
  });

  /**
   * Clears this suite's own notifications and leaves the COMPANY standing: every HTTP suite signs
   * in with one development number, whose sign-in may bind to a company this suite made and write
   * its entry there, so deleting that company races the other suites
   * (`apps/api/tests/notifications/preferences.test.ts`).
   */
  afterAll(async () => {
    await pools.admin.db
      .delete(notification)
      .where(inArray(notification.tenantId, [...http.createdTenantIds]));
    await http.close();
    await pools.close();
  });

  it("is one person's own — a colleague's record in the same company is neither listed nor markable", async () => {
    const inbox = await http.call<Paginated<Notification>>(
      'GET',
      `/notifications?limit=${WHOLE_INBOX}`,
    );
    expect(inbox.body.items.some((item) => item.title === "colleague's own")).toBe(false);
    expect(inbox.body.totalCount).toBe(SEEDED);

    const [theirs] = await pools.admin.db
      .select({ id: notification.id })
      .from(notification)
      .where(sql`${notification.recipientUserRef} = ${colleague.userId}`);
    const marked = await http.call<{ error: { code: string } }>(
      'POST',
      `/notifications/${theirs?.id}/read`,
      {},
    );
    expect(marked.status).toBe(httpStatusFor('NOT_FOUND'));
    expect(marked.body.error.code).toBe('NOT_FOUND');
  });

  it('reads newest first across a page boundary, with no repeat and no gap (F6-06)', async () => {
    const first = await http.call<Paginated<Notification>>(
      'GET',
      `/notifications?limit=${PAGE_OF_TWO}&page=1`,
    );
    const second = await http.call<Paginated<Notification>>(
      'GET',
      `/notifications?limit=${PAGE_OF_TWO}&page=2`,
    );
    expect(first.status).toBe(HttpStatus.OK);
    expect(second.status).toBe(HttpStatus.OK);
    expect(first.body.items.map((i) => i.title)).toEqual(['newest', 'middle']);
    expect(second.body.items.map((i) => i.title)).toEqual(['oldest']);
    expect(first.body.totalCount).toBe(SEEDED);
    expect(second.body.totalCount).toBe(SEEDED);
  });

  it('counts the unread, and one fewer after a read (F6-06, F6-07)', async () => {
    const before = await http.call<UnreadCount>('GET', '/notifications/unread-count');
    expect(before.body).toEqual({ unreadCount: SEEDED });

    const marked = await http.call<Notification>('POST', `/notifications/${ids.newest}/read`, {});
    expect(marked.status).toBe(HttpStatus.OK);
    expect(marked.body.readAt).not.toBeNull();

    const after = await http.call<UnreadCount>('GET', '/notifications/unread-count');
    expect(after.body).toEqual({ unreadCount: SEEDED - 1 });
  });

  it('is read up only and set once — reading again returns the first moment (F6-07)', async () => {
    const first = await http.call<Notification>('POST', `/notifications/${ids.newest}/read`, {});
    const again = await http.call<Notification>('POST', `/notifications/${ids.newest}/read`, {});
    expect(again.status).toBe(HttpStatus.OK);
    expect(again.body.readAt).toBe(first.body.readAt);
  });

  it('lands ONE moment when two reads race (F6-07)', async () => {
    const [left, right] = await Promise.all([
      http.call<Notification>('POST', `/notifications/${ids.middle}/read`, {}),
      http.call<Notification>('POST', `/notifications/${ids.middle}/read`, {}),
    ]);
    expect(left.status).toBe(HttpStatus.OK);
    expect(right.status).toBe(HttpStatus.OK);
    expect(left.body.readAt).not.toBeNull();
    expect(left.body.readAt).toBe(right.body.readAt);
    const count = await http.call<UnreadCount>('GET', '/notifications/unread-count');
    expect(count.body).toEqual({ unreadCount: SEEDED - PAGE_OF_TWO });
  });

  it('refuses a malformed id before any query runs', async () => {
    const reply = await http.call<{ error: { code: string; details?: { path: string }[] } }>(
      'POST',
      '/notifications/not-a-uuid/read',
      {},
    );
    expect(reply.status).toBe(httpStatusFor('VALIDATION_FAILED'));
    expect(reply.body.error.code).toBe('VALIDATION_FAILED');
    expect(reply.body.error.details?.map((d) => d.path)).toContain('id');
  });

  it('refuses a caller with no credential (F6-09 is about billing, never about the guard)', async () => {
    const reply = await http.callAnonymously<{ error: { code: string } }>('GET', '/notifications');
    expect(reply.status).toBe(httpStatusFor('NO_CREDENTIAL'));
    expect(reply.body.error.code).toBe('NO_CREDENTIAL');
  });

  it("is one company's own — another company's session sees nothing and marks nothing", async () => {
    // The same person founds a second company; the session now acts under it.
    const elsewhere = await http.createCompany('Neighbour EPC');
    expect(elsewhere.membership?.tenantId).not.toBe(tenantId);

    const inbox = await http.call<Paginated<Notification>>('GET', '/notifications');
    expect(inbox.status).toBe(HttpStatus.OK);
    expect(inbox.body).toEqual({ items: [], totalCount: 0 });

    const count = await http.call<UnreadCount>('GET', '/notifications/unread-count');
    expect(count.body).toEqual({ unreadCount: 0 });

    // 404, never 403: the other company's record must not be revealed to exist.
    const marked = await http.call<{ error: { code: string } }>(
      'POST',
      `/notifications/${ids.oldest}/read`,
      {},
    );
    expect(marked.status).toBe(httpStatusFor('NOT_FOUND'));
    expect(marked.body.error.code).toBe('NOT_FOUND');
  });

  it('cannot be written without a subject — never a dead announcement (F6-02)', async () => {
    const refused = await refusalCode(() =>
      pools.admin.db.execute(
        sql`insert into ${notification} (id, tenant_id, recipient_user_ref, type, subject_kind,
            subject_ref, title, body, language, emitted_at)
            values (gen_random_uuid(), ${tenantId}, ${userId}, 'system', 'tenant',
            null, 'No subject', 'Nothing to open', 'en', now())`,
      ),
    );
    expect(refused).toBe(NOT_NULL_VIOLATION);
  });

  it('cannot be written with a type the registry has never heard of (F6-05)', async () => {
    const refused = await refusalCode(() =>
      pools.admin.db.execute(
        sql`insert into ${notification} (id, tenant_id, recipient_user_ref, type, subject_kind,
            subject_ref, title, body, language, emitted_at)
            values (gen_random_uuid(), ${tenantId}, ${userId}, 'invoice_overdue',
            'tenant', ${tenantId}, 'Unregistered', 'Nothing registered this', 'en', now())`,
      ),
    );
    expect(refused).toBe(INVALID_ENUM_INPUT);
  });
});
