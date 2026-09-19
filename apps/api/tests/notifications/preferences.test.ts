import type { NotificationPreference, SessionProjection } from '@heliogrid/contracts';
import { notification, notificationPreference, notificationSettings } from '@heliogrid/db';
import {
  clockTime,
  IN_CALLING_RULES,
  marketQuietHours,
  NOTIFICATION_TYPE_GROUPS,
} from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  type NotificationToWrite,
  recordNotification,
} from '../../src/modules/notification/notification.repository';
import { openPools } from '../support/fixture';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';

/**
 * Quiet hours and per-user mutes on the WIRE, against a migrated database (`F6-11`, `F6-14`,
 * `F6-15`): the app boots as production boots, and the guard, the path validation, the policy
 * and the tenancy precondition are all in the path — which the repository alone never proves.
 *
 * The person driving founded the company, so they hold the EPC Owner preset: every billing
 * assertion here is about the holder the rule names.
 */

/** A night that wraps midnight, on the tenant's own clock. */
const NIGHT = { window: marketQuietHours(IN_CALLING_RULES), timezone: 'Asia/Kolkata' };
/** A window with no length keeps no quiet hours at all. */
const NEVER = {
  window: { start: clockTime('00:00'), end: clockTime('00:00') },
  timezone: 'Asia/Kolkata',
};

/** 02:00 IST — deep inside the night window. */
const AT_NIGHT = new Date('2026-03-14T20:30:00Z');
/** 09:00 IST the same morning, when the window lets go. */
const WINDOW_ENDS = '2026-03-15T03:30:00.000Z';

const skip = skipWithoutHarness(
  'NOTIFICATION DELIVERY WIRE PROOF',
  'Quiet hours and mutes are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('quiet hours and push mutes, over HTTP against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;
  let here: SessionProjection;
  let tenantId: string;
  let userId: string;

  const sent = (title: string, type: NotificationToWrite['type']): NotificationToWrite => ({
    tenantId,
    recipientUserRef: userId,
    type,
    subjectKind: 'tenant',
    subjectRef: tenantId,
    title,
    body: `${title} — body`,
    language: 'en',
    emittedAt: AT_NIGHT,
  });

  const read = async () =>
    (
      await http.call<{ preferences: NotificationPreference[] }>(
        'GET',
        '/notifications/preferences',
      )
    ).body.preferences;

  beforeAll(async () => {
    pools = openPools();
    http = await bootHttp();
    await http.signIn();
    here = await http.createCompany('Quiet Hours EPC');
    tenantId = here.membership?.tenantId as string;
    userId = here.actor.userId;
  });

  /**
   * This suite clears the rows it wrote and leaves the COMPANY standing, deliberately.
   *
   * Every HTTP suite signs in with the one development number, so the server binds a new session
   * to whichever membership that number holds — which may be a company another suite created.
   * A teardown that deletes tenants therefore races every other suite's sign-in, and the session
   * insert loses: `session_active_tenant_id_tenant_id_fk`, on a tenant that existed when the
   * membership was resolved and not when the row was written. Deleting only this suite's own
   * rows removes this file from that race entirely.
   */
  afterAll(async () => {
    const mine = inArray(notificationPreference.tenantId, [...http.createdTenantIds]);
    await pools.admin.db.delete(notificationPreference).where(mine);
    await pools.admin.db
      .delete(notificationSettings)
      .where(inArray(notificationSettings.tenantId, [...http.createdTenantIds]));
    await pools.admin.db
      .delete(notification)
      .where(inArray(notification.tenantId, [...http.createdTenantIds]));
    await http.close();
    await pools.close();
  });

  it('answers every group, whether or not anything is stored (F6-15)', async () => {
    const preferences = await read();
    expect(preferences.map((row) => row.group).sort()).toEqual(
      [...NOTIFICATION_TYPE_GROUPS].sort(),
    );
    expect(preferences.every((row) => row.pushMuted === false)).toBe(true);
  });

  it('marks billing un-mutable for the founder, and every other group mutable (F6-15)', async () => {
    const preferences = await read();
    const byGroup = new Map(preferences.map((row) => [row.group, row.mutable]));
    expect(byGroup.get('billing')).toBe(false);
    expect([...byGroup].filter(([group]) => group !== 'billing').every(([, may]) => may)).toBe(
      true,
    );
  });

  it('switches a group off and reads it back that way (F6-15)', async () => {
    const put = await http.call<NotificationPreference>(
      'PUT',
      '/notifications/preferences/delivery',
      { pushMuted: true },
    );
    expect(put.status).toBe(HttpStatus.OK);
    expect(put.body).toMatchObject({ group: 'delivery', pushMuted: true, mutable: true });
    expect((await read()).find((row) => row.group === 'delivery')?.pushMuted).toBe(true);
  });

  it('switches it back on again — the mute is a setting, not a one-way door', async () => {
    await http.call('PUT', '/notifications/preferences/delivery', { pushMuted: false });
    expect((await read()).find((row) => row.group === 'delivery')?.pushMuted).toBe(false);
  });

  it('REFUSES the billing group to the founder, and stores nothing (F6-15)', async () => {
    const refused = await http.call('PUT', '/notifications/preferences/billing', {
      pushMuted: true,
    });
    expect(refused.status).toBe(HttpStatus.FORBIDDEN);
    const stored = await pools.admin.db
      .select()
      .from(notificationPreference)
      .where(
        and(
          eq(notificationPreference.tenantId, tenantId),
          eq(notificationPreference.typeGroup, 'billing'),
        ),
      );
    expect(stored).toEqual([]);
  });

  it('refuses a group that is not one of the five, before any query runs', async () => {
    const refused = await http.call('PUT', '/notifications/preferences/gossip', {
      pushMuted: true,
    });
    expect(refused.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('answers nothing without a session (F6-09 is about billing, never about auth)', async () => {
    const out = await http.callAnonymously('GET', '/notifications/preferences');
    expect(out.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it("serves the MARKET's window until this company sets one (F6-14)", async () => {
    const inForce = await http.call<{ source: string; value: { start: string; end: string } }>(
      'GET',
      '/settings/quiet-hours',
    );
    expect(inForce.status).toBe(HttpStatus.OK);
    // India's lawful calling window is 09:00-21:00, so the quiet hours are its complement.
    expect(inForce.body).toEqual({ source: 'platform', value: { start: '21:00', end: '09:00' } });
  });

  it('takes this company’s own window, crossing midnight, and reads it back as the tenant’s', async () => {
    const saved = await http.call<{ source: string; value: { start: string; end: string } }>(
      'PUT',
      '/settings/quiet-hours',
      { start: '22:30', end: '07:15' },
    );
    expect(saved.body).toEqual({ source: 'tenant', value: { start: '22:30', end: '07:15' } });
    const again = await http.call<{ source: string; value: { start: string; end: string } }>(
      'GET',
      '/settings/quiet-hours',
    );
    expect(again.body).toEqual({ source: 'tenant', value: { start: '22:30', end: '07:15' } });
  });

  it('refuses a time that is not a time, before any query runs', async () => {
    const refused = await http.call('PUT', '/settings/quiet-hours', {
      start: '25:00',
      end: '07:15',
    });
    expect(refused.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('holds a standard push until the window ends, and the record lands at once (F6-13, F6-14)', async () => {
    await pools.admin.db.transaction((tx) =>
      recordNotification(tx, sent('held', 'proposal_opened'), NIGHT),
    );
    const [row] = await pools.admin.db
      .select({ emittedAt: notification.emittedAt, pushDueAt: notification.pushDueAt })
      .from(notification)
      .where(and(eq(notification.tenantId, tenantId), eq(notification.title, 'held')));
    expect(row?.emittedAt.toISOString()).toBe(AT_NIGHT.toISOString());
    expect(row?.pushDueAt?.toISOString()).toBe(WINDOW_ENDS);
  });

  it('does not hold an immediate push, however deep in the window it fires (F6-13)', async () => {
    await pools.admin.db.transaction((tx) =>
      recordNotification(tx, sent('urgent', 'agent_escalation'), NIGHT),
    );
    const [row] = await pools.admin.db
      .select({ pushDueAt: notification.pushDueAt })
      .from(notification)
      .where(and(eq(notification.tenantId, tenantId), eq(notification.title, 'urgent')));
    expect(row?.pushDueAt?.toISOString()).toBe(AT_NIGHT.toISOString());
  });

  it('holds nothing at all when the tenant keeps no quiet hours', async () => {
    await pools.admin.db.transaction((tx) =>
      recordNotification(tx, sent('open all hours', 'proposal_opened'), NEVER),
    );
    const [row] = await pools.admin.db
      .select({ pushDueAt: notification.pushDueAt })
      .from(notification)
      .where(and(eq(notification.tenantId, tenantId), eq(notification.title, 'open all hours')));
    expect(row?.pushDueAt?.toISOString()).toBe(AT_NIGHT.toISOString());
  });
});
