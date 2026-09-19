import { PUSH_DELIVERY, type SessionProjection } from '@heliogrid/contracts';
import { notification, pushDevice } from '@heliogrid/db';
import { clockTime, IN_CALLING_RULES, marketQuietHours } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DevelopmentPushDelivery } from '../../src/modules/notification/internal/push-delivery.development';
import { NotificationPushService } from '../../src/modules/notification/notification.push.service';
import {
  type NotificationToWrite,
  recordNotification,
} from '../../src/modules/notification/notification.repository';
import { openPools } from '../support/fixture';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';

/**
 * Devices and the send, on the WIRE against a migrated database (`F6-06`, `F6-13`).
 *
 * `push_device` is a GLOBAL table with no grant to `app_user`, so every assertion about a row
 * reads it on the admin pool — there is no tenant-scoped way to see one, which is the point.
 */

/** No quiet hours, so a seeded record's push falls due the instant it is emitted. */
const NEVER = {
  window: { start: clockTime('00:00'), end: clockTime('00:00') },
  timezone: 'Asia/Kolkata',
};
/** A night that holds a standard push, so "not due yet" can be told from "not owed". */
const NIGHT = { window: marketQuietHours(IN_CALLING_RULES), timezone: 'Asia/Kolkata' };
/** 02:00 IST — deep inside that night. */
const AT_NIGHT = new Date('2026-03-14T20:30:00Z');

/** Wide enough that two tokens minted in the same millisecond do not collide. */
const TOKEN_ENTROPY = 1_000_000_000;
/** A minute later, so "already sent" is told apart from "sent again at the same instant". */
const A_MINUTE_MS = 60_000;

/** The development adapter reports a token dead when it starts this way; FCM mints no colons. */
const DEAD = 'dead:retired-handset';

const skip = skipWithoutHarness(
  'PUSH WIRE PROOF',
  'Device registration and the send are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('push devices and the send, over HTTP against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;
  let here: SessionProjection;
  let tenantId: string;
  let userId: string;
  let push: NotificationPushService;
  const tokens: string[] = [];

  const aToken = (name: string) => {
    const token = `${name}-${Date.now()}-${Math.round(Math.random() * TOKEN_ENTROPY)}`;
    tokens.push(token);
    return token;
  };

  const emit = async (
    title: string,
    type: NotificationToWrite['type'],
    at: Date,
    clock = NEVER,
  ) => {
    const toWrite: NotificationToWrite = {
      tenantId,
      recipientUserRef: userId,
      type,
      subjectKind: 'tenant',
      subjectRef: tenantId,
      title,
      body: `${title} — body`,
      language: 'en',
      emittedAt: at,
    };
    await pools.admin.db.transaction((tx) => recordNotification(tx, toWrite, clock));
    const [row] = await pools.admin.db
      .select({ id: notification.id })
      .from(notification)
      .where(and(eq(notification.tenantId, tenantId), eq(notification.title, title)));
    return row?.id as string;
  };

  const sentAtOf = async (id: string) => {
    const [row] = await pools.admin.db
      .select({ pushSentAt: notification.pushSentAt })
      .from(notification)
      .where(eq(notification.id, id));
    return row?.pushSentAt ?? null;
  };

  const rowsFor = async (token: string) =>
    pools.admin.db.select().from(pushDevice).where(eq(pushDevice.token, token));

  beforeAll(async () => {
    pools = openPools();
    http = await bootHttp();
    await http.signIn();
    here = await http.createCompany('Push EPC');
    tenantId = here.membership?.tenantId as string;
    userId = here.actor.userId;
    push = http.app.get(NotificationPushService);
  });

  /** Devices are this suite's own rows; the company is left standing (the sign-in race). */
  afterAll(async () => {
    if (tokens.length > 0) {
      await pools.admin.db.delete(pushDevice).where(inArray(pushDevice.token, tokens));
    }
    await pools.admin.db
      .delete(notification)
      .where(inArray(notification.tenantId, [...http.createdTenantIds]));
    await http.close();
    await pools.close();
  });

  it('binds the DEVELOPMENT transport under test, so no suite ever calls a third party', () => {
    // Load-bearing: a developer's .env.local carries a real service account, and a suite that
    // picked it up would push invented tokens at Google and wake a real handset.
    expect(http.app.get(PUSH_DELIVERY)).toBeInstanceOf(DevelopmentPushDelivery);
  });

  it('registers this handset against the person the session names (F6-13)', async () => {
    const token = aToken('android');
    const reply = await http.call('POST', '/notifications/devices', { platform: 'android', token });
    expect(reply.status).toBe(HttpStatus.OK);
    const rows = await rowsFor(token);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ userRef: userId, platform: 'android' });
  });

  it('replaces rather than duplicates when the same handset signs in again', async () => {
    const token = aToken('returning');
    await http.call('POST', '/notifications/devices', { platform: 'android', token });
    await http.call('POST', '/notifications/devices', { platform: 'android', token });
    expect(await rowsFor(token)).toHaveLength(1);
  });

  it('forgets a handset, and forgetting one twice is success rather than a 404', async () => {
    const token = aToken('leaving');
    await http.call('POST', '/notifications/devices', { platform: 'ios', token });
    expect((await http.call('POST', '/notifications/devices/forget', { token })).status).toBe(
      HttpStatus.OK,
    );
    expect(await rowsFor(token)).toEqual([]);
    expect((await http.call('POST', '/notifications/devices/forget', { token })).status).toBe(
      HttpStatus.OK,
    );
  });

  it('refuses a platform that is not one of the two, before any query runs', async () => {
    const reply = await http.call('POST', '/notifications/devices', {
      platform: 'blackberry',
      token: aToken('wrong'),
    });
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('registers nothing without a session', async () => {
    const reply = await http.callAnonymously('POST', '/notifications/devices', {
      platform: 'android',
      token: aToken('anonymous'),
    });
    expect(reply.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('sends an immediate push at once and marks the record (F6-13)', async () => {
    await http.call('POST', '/notifications/devices', {
      platform: 'android',
      token: aToken('live'),
    });
    const id = await emit('escalation', 'agent_escalation', new Date());
    expect(await sentAtOf(id)).toBeNull();
    await push.deliver(tenantId, id, new Date());
    expect(await sentAtOf(id)).not.toBeNull();
  });

  it('sends nothing for a record the quiet window still holds, and marks nothing (F6-14)', async () => {
    const id = await emit('held', 'proposal_opened', AT_NIGHT, NIGHT);
    await push.deliver(tenantId, id, AT_NIGHT);
    expect(await sentAtOf(id)).toBeNull();
  });

  it('DELETES a token the provider calls dead, and the record still stands (F6 §F6.2)', async () => {
    await http.call('POST', '/notifications/devices', { platform: 'android', token: DEAD });
    tokens.push(DEAD);
    expect(await rowsFor(DEAD)).toHaveLength(1);
    const id = await emit('to a dead handset', 'agent_escalation', new Date());
    await push.deliver(tenantId, id, new Date());
    expect(await rowsFor(DEAD)).toEqual([]);
    // The inbox loses nothing when a push does: the record is there and was marked sent.
    expect(await sentAtOf(id)).not.toBeNull();
  });

  it('never sends twice: a record already marked is left alone (F6-06)', async () => {
    await http.call('POST', '/notifications/devices', {
      platform: 'android',
      token: aToken('once'),
    });
    const id = await emit('only once', 'agent_escalation', new Date());
    await push.deliver(tenantId, id, new Date());
    const first = await sentAtOf(id);
    await push.deliver(tenantId, id, new Date(Date.now() + A_MINUTE_MS));
    expect(await sentAtOf(id)).toEqual(first);
  });

  it('sends nothing when the person has muted the group (F6-15)', async () => {
    await http.call('POST', '/notifications/devices', {
      platform: 'android',
      token: aToken('muted'),
    });
    await http.call('PUT', '/notifications/preferences/sales', { pushMuted: true });
    const id = await emit('muted away', 'proposal_opened', new Date());
    await push.deliver(tenantId, id, new Date());
    expect(await sentAtOf(id)).toBeNull();
    await http.call('PUT', '/notifications/preferences/sales', { pushMuted: false });
  });
});
