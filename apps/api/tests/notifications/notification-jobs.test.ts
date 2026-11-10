import { randomUUID } from 'node:crypto';
import type { PushDelivery, PushMessage, PushOutcome } from '@heliogrid/contracts';
import { createDb, notification, pushDevice } from '@heliogrid/db';
import {
  clockTime,
  FOUNDER_ROLE,
  IN_CALLING_RULES,
  localInstant,
  MS_PER_DAY,
  marketQuietHours,
  NOTIFICATION_CENTRE_HORIZON_DAYS,
} from '@heliogrid/domain';
import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PushDeviceAdminRepository } from '../../src/modules/notification/notification.devices.admin.repository';
import { NotificationHorizonAdminRepository } from '../../src/modules/notification/notification.horizon.admin.repository';
import { NotificationHorizonService } from '../../src/modules/notification/notification.horizon.service';
import { NotificationPreferencesRepository } from '../../src/modules/notification/notification.preferences.repository';
import {
  NotificationPushAdminRepository,
  type NotificationToPush,
  type PushAttempt,
} from '../../src/modules/notification/notification.push.admin.repository';
import { NotificationPushService } from '../../src/modules/notification/notification.push.service';
import {
  type NotificationToWrite,
  recordNotification,
  type TenantQuietHours,
} from '../../src/modules/notification/notification.repository';
import { silentLogger } from '../billing/support';
import {
  aCompany,
  aMembership,
  aPerson,
  type Fixture,
  openPools,
  seed,
  unseed,
} from '../support/fixture';
import { adminUrl, skipWithoutDatabase } from '../support/preconditions';

/**
 * The two notification jobs (`F6-14`, `F6-19`), driven on an injected clock. Both cross
 * companies, so every moment sits in the 1960s — before any row another suite writes — and a drain
 * or a purge here touches this suite's rows alone.
 */

const KOLKATA = 'Asia/Kolkata';
const NIGHT: TenantQuietHours = { window: marketQuietHours(IN_CALLING_RULES), timezone: KOLKATA };
const NEVER: TenantQuietHours = {
  window: { start: clockTime('00:00'), end: clockTime('00:00') },
  timezone: KOLKATA,
};
const MINUTE = 60_000;
/** A drain a few minutes after the window ends: the held push is due and the emit's minute is past. */
const DRAINED_AFTER_MS = 300_000;
/** A day past the centre's horizon, and a day inside it. */
const PAST_HORIZON_MS = (NOTIFICATION_CENTRE_HORIZON_DAYS + 1) * MS_PER_DAY;
const INSIDE_HORIZON_MS = (NOTIFICATION_CENTRE_HORIZON_DAYS - 1) * MS_PER_DAY;

const company = aCompany('Notice Jobs EPC');
const person = aPerson('Asha Deshmukh');
/** A person with no handset — every web-only user: no push is ever owed to them. */
const webOnly = aPerson('Vijay Kale');
const fixture: Fixture = {
  companies: [company],
  people: [person, webOnly],
  memberships: [
    aMembership(company, person, [FOUNDER_ROLE]),
    aMembership(company, webOnly, [FOUNDER_ROLE]),
  ],
};
/** The type every notice here is written as: one whose registry row pushes. */
const PUSHED = 'lead_unassigned_24h';
/** One drain's batch (`DRAIN_BATCH`, `notification.push.service.ts`). */
const DRAIN_BATCH = 200;
/** A batch of notices written one at a time takes seconds, not the default five. */
const HEAVY = 60_000;

const skip = skipWithoutDatabase(
  'NOTIFICATION JOBS PROOF',
  'The push drain and the horizon purge are UNPROVEN in this run.',
);

/**
 * A push provider that records each send, can hold the first one until it is let go, and refuses
 * every push whose title it is told to.
 */
class GatedPushes implements PushDelivery {
  readonly sent: PushMessage[] = [];
  constructor(private readonly refuses: (title: string) => boolean = () => false) {}
  private gate: Promise<void> | null = null;
  private open: () => void = () => undefined;
  private started: () => void = () => undefined;
  readonly firstSendStarted = new Promise<void>((resolve) => {
    this.started = resolve;
  });

  hold(): void {
    this.gate = new Promise((resolve) => {
      this.open = resolve;
    });
  }

  release(): void {
    this.open();
  }

  async send(message: PushMessage): Promise<PushOutcome> {
    this.started();
    if (this.refuses(message.title)) throw new Error('the provider refused the push');
    if (this.gate !== null) await this.gate;
    this.sent.push(message);
    return { deadTokens: [] };
  }
}

describe.skipIf(skip)('the notification jobs, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let admin: ReturnType<typeof createDb>;
  const token = `jobs-${randomUUID()}`;

  const emit = async (
    title: string,
    emittedAt: number,
    clock: TenantQuietHours,
    recipient = person,
  ) => {
    const toWrite: NotificationToWrite = {
      tenantId: company.tenantId,
      recipientUserRef: recipient.userId,
      type: PUSHED,
      subjectKind: 'tenant',
      subjectRef: company.tenantId,
      title,
      body: `${title} — body`,
      language: 'en',
      emittedAt: new Date(emittedAt),
    };
    const id = await pools.admin.db.transaction((tx) => recordNotification(tx, toWrite, clock));
    const [row] = await pools.admin.db.select().from(notification).where(eq(notification.id, id));
    if (row === undefined) throw new Error('the notice was not written');
    return row;
  };

  const drainOver = (pushes: PushDelivery) =>
    new NotificationPushService(
      new NotificationPushAdminRepository(admin.db),
      new PushDeviceAdminRepository(admin.db),
      new NotificationPreferencesRepository(pools.tenants),
      pushes,
      silentLogger(),
    );

  beforeAll(async () => {
    pools = openPools();
    // The drain holds a row while it sends, and the send reads devices: two connections at least.
    admin = createDb(adminUrl, { max: 4 });
    await seed(pools.admin.db, fixture);
    const at = new Date();
    await pools.admin.db.insert(pushDevice).values({
      userRef: person.userId,
      platform: 'android',
      token,
      registeredAt: at,
      lastSeenAt: at,
    });
  });

  afterAll(async () => {
    await pools.admin.db.delete(pushDevice).where(inArray(pushDevice.token, [token]));
    await unseed(pools.admin.db, fixture);
    await admin.client.end();
    await pools.close();
  });

  it('a push held through the night leaves after its window, and two drains send it once', async () => {
    const pushes = new GatedPushes();
    const push = drainOver(pushes);
    const held = await emit(
      'held overnight',
      localInstant('1966-05-09', clockTime('23:30'), KOLKATA),
      NIGHT,
    );
    const due = held.pushDueAt?.getTime() ?? 0;
    expect(due).toBeGreaterThan(held.emittedAt.getTime());

    expect(await push.drainDue(new Date(due - 10 * MINUTE))).toEqual({ pushed: 0 });
    expect(pushes.sent).toHaveLength(0);

    // Two drains at one moment: the second runs while the first holds the row mid-send.
    const after = new Date(due + DRAINED_AFTER_MS);
    pushes.hold();
    const first = push.drainDue(after);
    await pushes.firstSendStarted;
    expect(await push.drainDue(after)).toEqual({ pushed: 0 });
    pushes.release();
    expect(await first).toEqual({ pushed: 1 });
    expect(pushes.sent.map((one) => one.title)).toEqual(['held overnight']);

    // A drain later still leaves a sent push alone.
    expect(await push.drainDue(new Date(due + 10 * MINUTE))).toEqual({ pushed: 0 });
    expect(pushes.sent).toHaveLength(1);
    const [sent] = await pools.admin.db
      .select({ pushSentAt: notification.pushSentAt })
      .from(notification)
      .where(eq(notification.id, held.id));
    expect(sent?.pushSentAt).toEqual(after);
  });

  it(
    'a push owed to no one is settled, so a held push behind a full batch of them still leaves',
    async () => {
      const pushes = new GatedPushes();
      const push = drainOver(pushes);
      const night = localInstant('1967-08-14', clockTime('23:30'), KOLKATA);
      for (let one = 0; one < DRAIN_BATCH; one += 1) {
        await emit(`no handset ${one}`, night, NIGHT, webOnly);
      }
      const held = await emit('held behind them', night + MINUTE, NIGHT);
      const after = new Date((held.pushDueAt?.getTime() ?? 0) + DRAINED_AFTER_MS);
      expect(await push.drainDue(after)).toEqual({ pushed: 0 });
      expect(await push.drainDue(new Date(after.getTime() + MINUTE))).toEqual({ pushed: 1 });
      expect(pushes.sent.map((one) => one.title)).toEqual(['held behind them']);
    },
    HEAVY,
  );

  it(
    'a push the provider keeps refusing never holds a fresh push back behind it',
    async () => {
      const pushes = new GatedPushes((title) => title.startsWith('refused'));
      const push = drainOver(pushes);
      const night = localInstant('1968-02-12', clockTime('23:30'), KOLKATA);
      let due = 0;
      for (let one = 0; one < DRAIN_BATCH; one += 1) {
        due = (await emit(`refused ${one}`, night, NIGHT)).pushDueAt?.getTime() ?? 0;
      }
      const after = due + DRAINED_AFTER_MS;
      expect(await push.drainDue(new Date(after))).toEqual({ pushed: 0 });
      await emit('fresh behind them', night + MINUTE, NIGHT);
      expect(await push.drainDue(new Date(after + MINUTE))).toEqual({ pushed: 1 });
      expect(pushes.sent.map((one) => one.title)).toEqual(['fresh behind them']);
    },
    HEAVY,
  );

  it('a drain that dies after one push leaves it sent, and the next drain sends only the rest', async () => {
    const records = new NotificationPushAdminRepository(admin.db);
    const night = localInstant('1969-11-03', clockTime('23:30'), KOLKATA);
    const first = await emit('sent before the crash', night, NIGHT);
    await emit('cut off by the crash', night + MINUTE, NIGHT);
    const at = (first.pushDueAt?.getTime() ?? 0) + DRAINED_AFTER_MS;
    const due = { from: new Date(at - MS_PER_DAY), to: new Date(at - MINUTE), now: new Date(at) };
    const titles: string[] = [];
    const sendEach = async (one: NotificationToPush): Promise<PushAttempt> => {
      titles.push(one.title);
      return { outcome: 'sent' };
    };
    const sendThenDie = async (one: NotificationToPush) => {
      if (titles.length > 0) throw new Error('the drain died mid-batch');
      return sendEach(one);
    };
    const drain = (send: typeof sendEach) => records.drainDue(due, [PUSHED], DRAIN_BATCH, send);
    await expect(drain(sendThenDie)).rejects.toThrow('the drain died mid-batch');
    expect(await drain(sendEach)).toBe(1);
    expect(titles).toEqual(['sent before the crash', 'cut off by the crash']);
  });

  it('a notice past the horizon is purged while one inside it stays', async () => {
    const now = Date.parse('1965-03-01T06:00:00Z');
    const past = await emit('past the horizon', now - PAST_HORIZON_MS, NEVER);
    const inside = await emit('inside the horizon', now - INSIDE_HORIZON_MS, NEVER);
    const purge = new NotificationHorizonService(new NotificationHorizonAdminRepository(admin.db));
    expect((await purge.purgePastHorizon(now)).purged).toBeGreaterThanOrEqual(1);
    const left = await pools.admin.db
      .select({ id: notification.id })
      .from(notification)
      .where(inArray(notification.id, [past.id, inside.id]));
    expect(left.map((row) => row.id)).toEqual([inside.id]);
  });
});
