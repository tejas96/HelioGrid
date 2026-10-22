import type { NotificationPreference, SessionClaims } from '@heliogrid/contracts';
import { notificationPreference } from '@heliogrid/db';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TokenService } from '../../src/modules/auth/internal/token.service';
import { preset } from '../catalog/support';
import {
  aCompany,
  aDevice,
  aMembership,
  aPerson,
  type Fixture,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { bootHttp, type Http } from '../support/http';

/**
 * Which push groups a person is offered, on the WIRE (`F6-15`; `SCR-M01-11` ruling 3): every
 * billing type addresses only the EPC Owner, so a person without the preset is never shown the
 * group and the api refuses their write to it. The Owner's side is `preferences.test.ts`.
 */

const skip = skipWithoutDatabase(
  'PUSH GROUPS SHOWN PROOF',
  'Who is offered the Billing group is UNPROVEN on the wire in this run.',
);

const shown = aCompany('Shown Groups EPC');
const rep = aPerson('Sunita Pawar');
const repHere = aMembership(shown, rep, [preset.sales_executive]);
const repDevice = aDevice(rep, shown);
const repFixture: Fixture = {
  companies: [shown],
  people: [rep],
  memberships: [repHere],
  devices: [repDevice],
};

describe.skipIf(skip)('the groups a person without the Owner preset is offered (F6-15)', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;

  /** A bearer for the Sales Executive's own device, carrying their roles as the session does. */
  const asRep = async () => {
    const claims: SessionClaims = {
      sub: rep.userId,
      sid: repDevice.sessionId,
      membership: {
        tenantId: shown.tenantId,
        roles: [preset.sales_executive],
        authorizationVersion: 0,
      },
    };
    const { token } = await http.app.get(TokenService).mint(claims, Date.now());
    return { authorization: `Bearer ${token}` };
  };

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, repFixture);
    http = await bootHttp();
  });

  afterAll(async () => {
    await pools.admin.db
      .delete(notificationPreference)
      .where(eq(notificationPreference.tenantId, shown.tenantId));
    await http.close();
    await unseed(pools.admin.db, repFixture);
    await pools.close();
  });

  it('a non-Owner is not offered Billing — four groups, every one mutable', async () => {
    const reply = await http.callAnonymously<{ preferences: NotificationPreference[] }>(
      'GET',
      '/notifications/preferences',
      undefined,
      await asRep(),
    );
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.preferences.map((row) => row.group)).toEqual([
      'sales',
      'delivery',
      'payments',
      'team',
    ]);
    expect(reply.body.preferences.every((row) => row.mutable)).toBe(true);
  });

  it.each([true, false])(
    'refuses a non-Owner any Billing write (pushMuted %s), and stores nothing',
    async (pushMuted) => {
      const refused = await http.callAnonymously(
        'PUT',
        '/notifications/preferences/billing',
        { pushMuted },
        await asRep(),
      );
      expect(refused.status).toBe(HttpStatus.FORBIDDEN);
      const stored = await pools.admin.db
        .select()
        .from(notificationPreference)
        .where(eq(notificationPreference.tenantId, shown.tenantId));
      expect(stored).toEqual([]);
    },
  );
});
