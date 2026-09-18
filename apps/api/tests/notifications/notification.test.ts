import { notification } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  NotificationRepository,
  type NotificationToWrite,
  recordNotification,
} from '../../src/modules/notification/notification.repository';
import {
  aCompany,
  aMembership,
  aPerson,
  type Fixture,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';

/**
 * The record that is the truth (`F6-06`), against REAL state. What only a database can show: that
 * a record stands with no push ever sent, that the words and the language it was written in
 * survive the reader changing language (`F6-08`), that read state moves up only and once
 * (`F6-07`), and that one person's inbox is theirs — not their colleague's and not another
 * company's.
 *
 * That NO role may change any column but `read_at` is NOT proven here: it is a privilege read
 * from the catalog over every RLS-subject role, which `tests/invariants` owns and this file must
 * not restate — and asked here it would lie, because CI connects as a superuser that holds every
 * privilege.
 */

const WHOLE_INBOX = { limit: 50, offset: 0 };

/**
 * The SQLSTATE the database refused with. A driver error echoes the failed QUERY in its message,
 * so matching a column name there passes on the text we sent rather than on the refusal — the
 * code is the verdict itself.
 */
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

/** A column that may not be null, and a value outside an enum's vocabulary. */
const NOT_NULL_VIOLATION = '23502';
const INVALID_ENUM_INPUT = '22P02';

/** Far enough after the first read that a second write landing would show as a new moment. */
const A_LATER_MOMENT_MS = 1_000;

const here = aCompany('Notified EPC');
const elsewhere = aCompany('Neighbour EPC');
const reader = aPerson('Rajesh Sharma');
const colleague = aPerson('Priya Kulkarni');
const stranger = aPerson('Anita Desai');

const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [reader, colleague, stranger],
  memberships: [
    aMembership(here, reader, [FOUNDER_ROLE]),
    aMembership(here, colleague, [FOUNDER_ROLE]),
    aMembership(elsewhere, stranger, [FOUNDER_ROLE]),
  ],
};

const skip = skipWithoutDatabase(
  'NOTIFICATION RECORD PROOF',
  'The record-of-truth model is UNPROVEN in this run.',
);

describe.skipIf(skip)('the notification record, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let records: NotificationRepository;

  const sent = (over: Partial<NotificationToWrite> = {}): NotificationToWrite => ({
    tenantId: here.tenantId,
    recipientUserRef: reader.userId,
    type: 'proposal_opened',
    subjectKind: 'tenant',
    subjectRef: here.tenantId,
    title: 'Your proposal was opened',
    body: 'Sunrise Homes opened the proposal you sent.',
    language: 'en',
    emittedAt: new Date(),
    ...over,
  });

  const write = async (toWrite: NotificationToWrite): Promise<void> => {
    await pools.admin.db.transaction((tx) => recordNotification(tx, toWrite));
  };

  beforeAll(async () => {
    pools = openPools();
    records = new NotificationRepository(pools.tenants);
    await seed(pools.admin.db, fixture);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('stands in the inbox and is counted, with no push ever sent (F6-06)', async () => {
    await write(sent({ title: 'A dropped push still lands' }));

    const inbox = await records.inbox(here.tenantId, reader.userId, WHOLE_INBOX);
    const landed = inbox.items.find((item) => item.title === 'A dropped push still lands');

    // The push marker is null — no push was ever sent — and the record is there regardless.
    expect(landed?.pushSentAt).toBeNull();
    expect(landed?.readAt).toBeNull();
    const badge = await records.unreadCount(here.tenantId, reader.userId);
    expect(badge).toBe(inbox.items.filter((item) => item.readAt === null).length);
    expect(badge).toBeGreaterThan(0);
  });

  it('keeps the words and the language it was written in when the reader switches (F6-08)', async () => {
    await write(
      sent({
        type: 'survey_submitted',
        title: 'Survey ready for design',
        body: 'The Kothrud survey is ready.',
        language: 'en',
      }),
    );

    // The reader moves to Hindi. Nothing re-renders: the record carries what it was given.
    await pools.admin.db.execute(
      sql`update tenant set default_language = 'hi' where id = ${here.tenantId}`,
    );

    const inbox = await records.inbox(here.tenantId, reader.userId, WHOLE_INBOX);
    const older = inbox.items.find((item) => item.type === 'survey_submitted');
    expect(older?.language).toBe('en');
    expect(older?.title).toBe('Survey ready for design');
    expect(older?.body).toBe('The Kothrud survey is ready.');

    await pools.admin.db.execute(
      sql`update tenant set default_language = 'en' where id = ${here.tenantId}`,
    );
  });

  it('is read up only, and set once — reading again changes nothing (F6-07)', async () => {
    await write(sent({ type: 'design_returned', title: 'Design returned' }));
    const inbox = await records.inbox(here.tenantId, reader.userId, WHOLE_INBOX);
    const target = inbox.items.find((item) => item.title === 'Design returned');
    expect(target?.readAt).toBeNull();
    const id = target?.id as string;

    const first = await records.markRead(here.tenantId, reader.userId, id, new Date());
    expect(first?.readAt).not.toBeNull();

    // A later clock, so a second write that DID land would be visible as a new moment.
    const again = await records.markRead(
      here.tenantId,
      reader.userId,
      id,
      new Date(Date.now() + A_LATER_MOMENT_MS),
    );
    // Same moment, not a new one: the second write matched no row, so the first stands.
    expect(again?.readAt).toBe(first?.readAt);
  });

  it("is one person's own — not a colleague's in the same company (F6-06)", async () => {
    await write(sent({ recipientUserRef: colleague.userId, title: "Colleague's own" }));

    const mine = await records.inbox(here.tenantId, reader.userId, WHOLE_INBOX);
    expect(mine.items.some((item) => item.title === "Colleague's own")).toBe(false);

    const theirs = await records.inbox(here.tenantId, colleague.userId, WHOLE_INBOX);
    expect(theirs.items.some((item) => item.title === "Colleague's own")).toBe(true);
  });

  it("is one company's own — another company's record is not reachable", async () => {
    await write(
      sent({
        tenantId: elsewhere.tenantId,
        recipientUserRef: stranger.userId,
        subjectRef: elsewhere.tenantId,
        title: "Another company's",
      }),
    );

    const mine = await records.inbox(here.tenantId, reader.userId, WHOLE_INBOX);
    expect(mine.items.some((item) => item.title === "Another company's")).toBe(false);

    const ids = new Set(mine.items.map((item) => item.id));
    const theirs = await records.inbox(elsewhere.tenantId, stranger.userId, WHOLE_INBOX);
    expect(theirs.items.some((item) => ids.has(item.id))).toBe(false);
  });

  it('marking a record that is not yours answers nothing to mark, never that it exists', async () => {
    await write(sent({ recipientUserRef: colleague.userId, title: 'Not mine to read' }));
    const theirs = await records.inbox(here.tenantId, colleague.userId, WHOLE_INBOX);
    const id = theirs.items.find((item) => item.title === 'Not mine to read')?.id as string;

    expect(await records.markRead(here.tenantId, reader.userId, id, new Date())).toBeNull();
  });

  it('cannot be written without a subject — a notification is never a dead announcement (F6-02)', async () => {
    const refused = await refusalCode(() =>
      pools.admin.db.execute(
        sql`insert into ${notification} (id, tenant_id, recipient_user_ref, type, subject_kind,
            subject_ref, title, body, language, emitted_at)
            values (gen_random_uuid(), ${here.tenantId}, ${reader.userId}, 'system', 'tenant',
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
            values (gen_random_uuid(), ${here.tenantId}, ${reader.userId}, 'invoice_overdue',
            'tenant', ${here.tenantId}, 'Unregistered', 'Nothing registered this', 'en', now())`,
      ),
    );
    expect(refused).toBe(INVALID_ENUM_INPUT);
  });
});
