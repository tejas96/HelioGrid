import { ACCESS_REMOVED } from '@heliogrid/contracts';
import { FOUNDER_ROLE, ROLE_PRESETS } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SESSION_COOKIE, TOKEN_COOKIE } from '../../src/common/auth/cookies';
import { TenantRepository } from '../../src/modules/tenant/tenant.repository';
import { TenantService } from '../../src/modules/tenant/tenant.service';
import {
  aCompany,
  aDevice,
  aMembership,
  aPerson,
  type Device,
  type Fixture,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { bootHttp, type Http } from '../support/http';

/**
 * Why a refresh is refused, on the WIRE (`M01-07`, `S1.wrong.4`): only a session acting for a
 * company whose membership was deactivated answers `ACCESS_REMOVED`; every other session that
 * cannot renew answers `UNAUTHENTICATED`, so a device says "removed" only when it was. Each device
 * is a seeded session whose cookie the test holds, so each life — live, revoked, run out — is
 * exactly the one the case names.
 */

const PATH = '/auth/refresh';
const MS_PER_MINUTE = 60_000;
const [WORKING_PRESET] = ROLE_PRESETS.filter((preset) => preset !== FOUNDER_ROLE);
if (WORKING_PRESET === undefined) throw new Error('the matrix holds no preset but the owner');

const here = aCompany('Suryodaya Solar');
const elsewhere = aCompany('Neighbour Solar EPC');
const owner = aPerson('Rajesh Sharma');
const unswept = aPerson('Priya Kulkarni');
const swept = aPerson('Kavita Joshi');
const signedOut = aPerson('Suresh Nair');
const ownerHere = aMembership(here, owner, [FOUNDER_ROLE]);
const unsweptHere = aMembership(here, unswept, [WORKING_PRESET]);
const sweptHere = aMembership(here, swept, [WORKING_PRESET]);
const sweptElsewhere = aMembership(elsewhere, swept, [FOUNDER_ROLE]);
const signedOutHere = aMembership(here, signedOut, [WORKING_PRESET]);

const now = Date.now();
const unsweptDevice = aDevice(unswept, here);
const sweptDevice = aDevice(swept, here);
const sweptDeviceElsewhere = aDevice(swept, elsewhere);
const revokedDevice = aDevice(signedOut, here, { revokedAt: now - MS_PER_MINUTE });
const expiredDevice = aDevice(signedOut, here, { expiresAt: now - MS_PER_MINUTE });

const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [owner, unswept, swept, signedOut],
  memberships: [ownerHere, unsweptHere, sweptHere, sweptElsewhere, signedOutHere],
  devices: [unsweptDevice, sweptDevice, sweptDeviceElsewhere, revokedDevice, expiredDevice],
};

interface Refusal {
  readonly error?: { readonly code: string; readonly message: string };
  readonly tokenExpiresAt?: string;
}

const skip = skipWithoutDatabase(
  'SESSION-REFRESH WIRE PROOF',
  'Why a refresh is refused is UNPROVEN on the wire in this run — only its pure decision is.',
);

describe.skipIf(skip)('the refresh names why a session ended, over HTTP', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;
  const by = () => ({ actorUserId: owner.userId, now: Date.now() });

  const refreshWith = (secret: string) =>
    http.callAnonymously<Refusal>(
      'POST',
      PATH,
      { foreground: true },
      { cookie: `${SESSION_COOKIE}=${secret}` },
    );
  const refresh = (device: Device) => refreshWith(device.secret);
  const cleared = (headers: Headers) =>
    headers
      .getSetCookie()
      .filter((line) => /^(hg_session|hg_token)=;/.test(line))
      .map((line) => line.slice(0, line.indexOf('=')));

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    http = await bootHttp();
  });

  afterAll(async () => {
    await http.close();
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('refuses a live session whose membership was deactivated, as access removed', async () => {
    // The flip alone — the deactivation's revocation sweep never ran.
    await new TenantRepository(pools.tenants).deactivate(
      here.tenantId,
      unsweptHere.membershipId,
      by(),
    );
    const reply = await refresh(unsweptDevice);
    expect(reply.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(reply.body.error?.code).toBe(ACCESS_REMOVED);
    expect(reply.body.error?.message).not.toContain(here.companyName);
    expect(cleared(reply.headers).sort()).toEqual([SESSION_COOKIE, TOKEN_COOKIE].sort());
  });

  it('refuses a session the deactivation revoked, as access removed', async () => {
    await http.app.get(TenantService).deactivateMember(here.tenantId, sweptHere.membershipId, by());
    const reply = await refresh(sweptDevice);
    expect(reply.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(reply.body.error?.code).toBe(ACCESS_REMOVED);
  });

  it('renews a session acting for another company the person is still active in', async () => {
    const reply = await refresh(sweptDeviceElsewhere);
    expect(reply.status).toBe(HttpStatus.OK);
    const expiresIn = Date.parse(reply.body.tokenExpiresAt ?? '') - Date.now();
    expect(expiresIn).toBeGreaterThan(0);
    expect(expiresIn).toBeLessThanOrEqual(10 * MS_PER_MINUTE);
  });

  it.each([
    { why: 'revoked — their own sign-out, or sign out everywhere', secret: revokedDevice.secret },
    { why: 'run out', secret: expiredDevice.secret },
    { why: 'unknown to the server', secret: 'not-a-session-this-server-issued' },
  ])(
    'answers a revoked, expired or unknown session as signed out, never as access removed',
    async ({ secret }) => {
      const reply = await refreshWith(secret);
      expect(reply.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(reply.body.error?.code).toBe('UNAUTHENTICATED');
    },
  );
});
