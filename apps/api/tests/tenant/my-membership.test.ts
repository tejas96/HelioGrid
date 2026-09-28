import type { SessionClaims } from '@heliogrid/contracts';
import { tenantMembership } from '@heliogrid/db';
import { FIRST_RUN_COACH_MARKS, FOUNDER_ROLE, ROLE_PRESETS } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TokenService } from '../../src/modules/auth/internal/token.service';
import { TenantService } from '../../src/modules/tenant/tenant.service';
import {
  aCompany,
  aDevice,
  aMembership,
  aPerson,
  type Device,
  type Fixture,
  type Membership,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { holdLock } from '../support/held-lock';
import { bootHttp, type Http } from '../support/http';

/**
 * The caller's own membership on the WIRE (`M01-16`): the first-run coach marks a person has
 * passed, read and raised through `GET`/`PATCH /tenants/me/membership`. The app boots as
 * production boots, so the guard, the body's bound, the tenant transaction and the one
 * conditional write are all in the path.
 *
 * Each caller carries a bearer token minted for a seeded session — never the shared development
 * number, whose sign-in binds to whichever company another suite left it holding.
 */

const PATH = '/tenants/me/membership';
/** A count that is not a whole mark. */
const NOT_WHOLE = 1.5;
const [WORKING_PRESET] = ROLE_PRESETS.filter((preset) => preset !== FOUNDER_ROLE);
if (WORKING_PRESET === undefined) throw new Error('the matrix holds no preset but the owner');

const here = aCompany('Coach Marks EPC');
const elsewhere = aCompany('Neighbour Marks EPC');
const owner = aPerson('Rajesh Sharma');
const counter = aPerson('Priya Kulkarni');
const repeater = aPerson('Kavita Joshi');
const lowerer = aPerson('Suresh Nair');
const racer = aPerson('Anil Deshmukh');
const leaver = aPerson('Sunita Patil');
const stranger = aPerson('Meera Iyer');
const ownerHere = aMembership(here, owner, [FOUNDER_ROLE]);
const counterHere = aMembership(here, counter, [WORKING_PRESET]);
const repeaterHere = aMembership(here, repeater, [WORKING_PRESET]);
const lowererHere = aMembership(here, lowerer, [WORKING_PRESET]);
const racerHere = aMembership(here, racer, [WORKING_PRESET]);
const leaverHere = aMembership(here, leaver, [WORKING_PRESET]);
const strangerElsewhere = aMembership(elsewhere, stranger, [FOUNDER_ROLE]);
const memberships = [
  ownerHere,
  counterHere,
  repeaterHere,
  lowererHere,
  racerHere,
  leaverHere,
  strangerElsewhere,
];
const devices = new Map(memberships.map((m) => [m, aDevice(m.held, m.of)]));

const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [owner, counter, repeater, lowerer, racer, leaver, stranger],
  memberships,
  devices: [...devices.values()],
};

const skip = skipWithoutDatabase(
  'MY-MEMBERSHIP WIRE PROOF',
  'The coach-mark count is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('my own membership, over HTTP against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;

  /** A bearer for the membership's own device; `null` mints the same session with no company. */
  const bearerOf = async (membership: Membership, company: 'held' | 'none' = 'held') => {
    const device = devices.get(membership) as Device;
    const claims: SessionClaims = {
      sub: membership.held.userId,
      sid: device.sessionId,
      membership:
        company === 'none'
          ? null
          : {
              tenantId: membership.of.tenantId,
              roles: [...membership.roles],
              authorizationVersion: 0,
            },
    };
    const { token } = await http.app.get(TokenService).mint(claims, Date.now());
    return { authorization: `Bearer ${token}` };
  };

  const read = async (as: Membership) =>
    http.call<{ coachMarksDismissed: number }>('GET', PATH, undefined, await bearerOf(as));
  const write = async (as: Membership, coachMarksDismissed: unknown) =>
    http.call<{ coachMarksDismissed: number; error?: { code: string } }>(
      'PATCH',
      PATH,
      { coachMarksDismissed },
      await bearerOf(as),
    );
  const stored = async (membership: Membership) => {
    const [row] = await pools.admin.db
      .select({ count: tenantMembership.coachMarksDismissed })
      .from(tenantMembership)
      .where(eq(tenantMembership.id, membership.membershipId));
    return row?.count;
  };

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

  it("reads a fresh member's count as 0, equal to the row", async () => {
    const reply = await read(counterHere);
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body).toEqual({ coachMarksDismissed: 0 });
    expect(await stored(counterHere)).toBe(0);
  });

  it('accepts 0 to 3 and refuses anything else', async () => {
    for (const refused of [FIRST_RUN_COACH_MARKS + 1, -1, NOT_WHOLE, '2', null, undefined]) {
      const reply = await write(counterHere, refused);
      expect(reply.status, `sent ${JSON.stringify(refused)}`).toBe(HttpStatus.BAD_REQUEST);
      expect(await stored(counterHere)).toBe(0);
    }
    for (let count = 0; count <= FIRST_RUN_COACH_MARKS; count += 1) {
      const reply = await write(counterHere, count);
      expect(reply.status, `sent ${count}`).toBe(HttpStatus.OK);
      expect(reply.body).toEqual({ coachMarksDismissed: count });
      expect(await stored(counterHere)).toBe(count);
    }
  });

  it('accepts the stored count again', async () => {
    const first = await write(repeaterHere, 2);
    const again = await write(repeaterHere, 2);
    for (const reply of [first, again]) {
      expect(reply.status).toBe(HttpStatus.OK);
      expect(reply.body).toEqual({ coachMarksDismissed: 2 });
    }
    expect(await stored(repeaterHere)).toBe(2);
  });

  it('refuses a count below the stored one and keeps the stored one', async () => {
    expect((await write(lowererHere, FIRST_RUN_COACH_MARKS)).status).toBe(HttpStatus.OK);
    const reply = await write(lowererHere, FIRST_RUN_COACH_MARKS - 1);
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(reply.body.error?.code).toBe('DOMAIN_RULE_VIOLATION');
    expect(await stored(lowererHere)).toBe(FIRST_RUN_COACH_MARKS);
  });

  it('a lower count racing a higher one is refused and the higher one stays', async () => {
    // The other device's write holds the row; this one must wait on it, then judge what it finds
    // — a handler that read the row before waiting would still write its stale lower count.
    const held = await holdLock(
      sql`update tenant_membership set coach_marks_dismissed = ${FIRST_RUN_COACH_MARKS} where id = ${racerHere.membershipId}`,
    );
    const racing = write(racerHere, 1);
    await held.waitForWaiters(1);
    await held.release();
    const reply = await racing;
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(await stored(racerHere)).toBe(FIRST_RUN_COACH_MARKS);
  });

  it("a member's write never moves another member's count", async () => {
    const counterBefore = await stored(counterHere);
    expect((await write(ownerHere, 1)).status).toBe(HttpStatus.OK);
    expect((await write(strangerElsewhere, FIRST_RUN_COACH_MARKS)).status).toBe(HttpStatus.OK);
    expect((await write(leaverHere, 2)).status).toBe(HttpStatus.OK);

    expect((await read(ownerHere)).body).toEqual({ coachMarksDismissed: 1 });
    expect((await read(strangerElsewhere)).body).toEqual({
      coachMarksDismissed: FIRST_RUN_COACH_MARKS,
    });
    expect((await read(leaverHere)).body).toEqual({ coachMarksDismissed: 2 });
    expect(await stored(ownerHere)).toBe(1);
    expect(await stored(strangerElsewhere)).toBe(FIRST_RUN_COACH_MARKS);
    expect(await stored(leaverHere)).toBe(2);
    expect(await stored(counterHere)).toBe(counterBefore);
  });

  it('refuses a caller with no cookie: 401 NO_CREDENTIAL', async () => {
    for (const method of ['GET', 'PATCH']) {
      const reply = await http.callAnonymously<{ error: { code: string } }>(
        method,
        PATH,
        method === 'PATCH' ? { coachMarksDismissed: 1 } : undefined,
      );
      expect(reply.status, method).toBe(HttpStatus.UNAUTHORIZED);
      expect(reply.body.error.code).toBe('NO_CREDENTIAL');
    }
  });

  it('refuses a session with no company: 403 FORBIDDEN', async () => {
    const headers = await bearerOf(ownerHere, 'none');
    const reading = await http.call<{ error: { code: string } }>('GET', PATH, undefined, headers);
    const writing = await http.call<{ error: { code: string } }>(
      'PATCH',
      PATH,
      { coachMarksDismissed: FIRST_RUN_COACH_MARKS },
      headers,
    );
    for (const reply of [reading, writing]) {
      expect(reply.status).toBe(HttpStatus.FORBIDDEN);
      expect(reply.body.error.code).toBe('FORBIDDEN');
    }
    expect(await stored(ownerHere)).toBe(1);
  });

  it('refuses a deactivated member: 401 UNAUTHENTICATED', async () => {
    const headers = await bearerOf(leaverHere);
    await http.app.get(TenantService).deactivateMember(here.tenantId, leaverHere.membershipId, {
      actorUserId: owner.userId,
      now: Date.now(),
    });
    const reply = await http.call<{ error: { code: string } }>(
      'PATCH',
      PATH,
      { coachMarksDismissed: FIRST_RUN_COACH_MARKS },
      headers,
    );
    expect(reply.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(reply.body.error.code).toBe('UNAUTHENTICATED');
    expect(await stored(leaverHere)).toBe(2);
  });
});
