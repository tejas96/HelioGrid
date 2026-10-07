import { randomUUID } from 'node:crypto';
import type { JoinRequest, RequestedCompany, SessionClaims } from '@heliogrid/contracts';
import { notification, tenant, tenantMembership, userAccount } from '@heliogrid/db';
import { FOUNDER_ROLE, ROLE_PRESETS } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TokenService } from '../../src/modules/auth/internal/token.service';
import {
  aCompany,
  aDevice,
  aMembership,
  aPerson,
  type Fixture,
  openPools,
  type Person,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { bootHttp, type Http } from '../support/http';

/**
 * The join request on the WIRE (`M01-09`): someone signing up asks a company that already exists
 * to add them. The request is a notice to each of that company's active EPC Owners and nothing
 * else, so the proofs read the notification rows. Each caller carries a bearer minted for a seeded
 * session with no company — never the shared development number, whose sign-in binds to whichever
 * company another suite left it holding.
 */

const PATH = '/tenants/join-requests';
const A_DAY_MS = 86_400_000;
const [WORKING_PRESET] = ROLE_PRESETS.filter((preset) => preset !== FOUNDER_ROLE);
if (WORKING_PRESET === undefined) throw new Error('the matrix holds no preset but the owner');
const run = randomUUID();
const name = `Join Request Solar ${run}`;

const oldest = aCompany(name);
/** The same name and city, made a day later: the steer and the request both name the OLDEST. */
const twin = aCompany(name);
const neighbour = aCompany(`Neighbour Solar ${run}`);

const owner = aPerson('Rajesh Kulkarni');
const hindiOwner = aPerson('Sunita Patil');
const leftOwner = aPerson('Anil Deshmukh');
const worker = aPerson('Priya Joshi');
const twinOwner = aPerson('Kavita Nair');
const neighbourOwner = aPerson('Suresh Iyer');
const asker = aPerson('Meera Joshi');
const repeater = aPerson('Asha Rao');

const ownerHere = aMembership(oldest, owner, [FOUNDER_ROLE]);
const hindiOwnerHere = aMembership(oldest, hindiOwner, [FOUNDER_ROLE]);
const leftOwnerHere = aMembership(oldest, leftOwner, [FOUNDER_ROLE]);
const workerHere = aMembership(oldest, worker, [WORKING_PRESET]);
const twinOwnerThere = aMembership(twin, twinOwner, [FOUNDER_ROLE]);
const neighbourOwnerThere = aMembership(neighbour, neighbourOwner, [FOUNDER_ROLE]);

/** A seeded session row needs a company to sit under; the bearer it carries names none. */
const askerDevice = aDevice(asker, neighbour);
const repeaterDevice = aDevice(repeater, neighbour);
const memberDevice = aDevice(neighbourOwner, neighbour);

const fixture: Fixture = {
  /** The twin is written FIRST, so a read that keeps table order names it and fails. */
  companies: [twin, oldest, neighbour],
  people: [owner, hindiOwner, leftOwner, worker, twinOwner, neighbourOwner, asker, repeater],
  memberships: [
    ownerHere,
    hindiOwnerHere,
    leftOwnerHere,
    workerHere,
    twinOwnerThere,
    neighbourOwnerThere,
  ],
  devices: [askerDevice, repeaterDevice, memberDevice],
};

const skip = skipWithoutDatabase(
  'JOIN REQUEST WIRE PROOF',
  'The join request is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('the join request, over HTTP against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;

  const bearer = async (claims: SessionClaims) => {
    const { token } = await http.app.get(TokenService).mint(claims, Date.now());
    return { authorization: `Bearer ${token}` };
  };
  const companyless = (person: Person, device: { sessionId: string }) =>
    bearer({ sub: person.userId, sid: device.sessionId, membership: null });

  const ask = async (as: Record<string, string>, body: JoinRequest) =>
    http.call<RequestedCompany>('POST', PATH, body, as);

  const noticesFrom = async (from: Person) =>
    pools.admin.db
      .select({
        tenantId: notification.tenantId,
        recipient: notification.recipientUserRef,
        type: notification.type,
        subjectKind: notification.subjectKind,
        title: notification.title,
        body: notification.body,
        language: notification.language,
      })
      .from(notification)
      .where(
        and(
          eq(notification.subjectRef, from.userId),
          inArray(notification.tenantId, [oldest.tenantId, twin.tenantId, neighbour.tenantId]),
        ),
      );

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    const dayLater = new Date(Date.now() + A_DAY_MS);
    await pools.admin.db
      .update(tenant)
      .set({ createdAt: dayLater })
      .where(eq(tenant.id, twin.tenantId));
    await pools.admin.db
      .update(userAccount)
      .set({ interfaceLanguage: 'hi' })
      .where(eq(userAccount.id, hindiOwner.userId));
    await pools.admin.db
      .update(tenantMembership)
      .set({ status: 'deactivated' })
      .where(eq(tenantMembership.id, leftOwnerHere.membershipId));
    http = await bootHttp();
  });

  afterAll(async () => {
    await http.close();
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('sends each active EPC Owner of the oldest match one join request in their own language, naming the asker', async () => {
    const reply = await ask(await companyless(asker, askerDevice), {
      companyName: name,
      city: 'Pune',
      name: asker.name,
    });

    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body).toEqual({ companyName: name, city: 'Pune' });
    const notices = await noticesFrom(asker);
    expect(notices.map((n) => n.recipient).sort()).toEqual(
      [owner.userId, hindiOwner.userId].sort(),
    );
    for (const notice of notices) {
      expect(notice).toMatchObject({
        tenantId: oldest.tenantId,
        type: 'join_requested',
        subjectKind: 'user_account',
      });
      expect(`${notice.title} ${notice.body}`).toContain(asker.name);
    }
    const byRecipient = new Map(notices.map((n) => [n.recipient, n]));
    expect(byRecipient.get(owner.userId)?.language).toBe('en');
    expect(byRecipient.get(hindiOwner.userId)?.language).toBe('hi');
    expect(byRecipient.get(hindiOwner.userId)?.body).not.toBe(byRecipient.get(owner.userId)?.body);
  });

  it('writes nothing new when the same person asks again', async () => {
    const as = await companyless(repeater, repeaterDevice);
    const body = { companyName: name, city: 'Pune', name: repeater.name };
    expect((await ask(as, body)).status).toBe(HttpStatus.OK);
    expect((await ask(as, body)).status).toBe(HttpStatus.OK);
    expect(await noticesFrom(repeater)).toHaveLength(2);
  });

  it('matches the name and city as typed, ignoring case', async () => {
    const reply = await ask(await companyless(repeater, repeaterDevice), {
      companyName: name.toLowerCase(),
      city: 'PUNE',
      name: repeater.name,
    });
    expect(reply).toMatchObject({
      status: HttpStatus.OK,
      body: { companyName: name, city: 'Pune' },
    });
  });

  it('answers 404 when no company has that name and city, and writes nothing', async () => {
    const before = (await noticesFrom(asker)).length;
    const reply = await ask(await companyless(asker, askerDevice), {
      companyName: name,
      city: 'Nashik',
      name: asker.name,
    });
    expect(reply.status).toBe(HttpStatus.NOT_FOUND);
    expect(await noticesFrom(asker)).toHaveLength(before);
  });

  it('refuses a person who already belongs to a company with 409', async () => {
    const reply = await ask(
      await bearer({
        sub: neighbourOwner.userId,
        sid: memberDevice.sessionId,
        membership: {
          tenantId: neighbour.tenantId,
          roles: [FOUNDER_ROLE],
          authorizationVersion: 0,
        },
      }),
      { companyName: name, city: 'Pune', name: neighbourOwner.name },
    );
    expect(reply.status).toBe(HttpStatus.CONFLICT);
    expect(await noticesFrom(neighbourOwner)).toHaveLength(0);
  });

  it('refuses a caller with no session with 401', async () => {
    const reply = await http.callAnonymously('POST', PATH, {
      companyName: name,
      city: 'Pune',
      name: 'Nobody',
    });
    expect(reply.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('lists the oldest match first on the steer read', async () => {
    const reply = await http.call<{ items: { tenantId: string }[] }>(
      'GET',
      `/tenants/similar?companyName=${encodeURIComponent(name)}&city=Pune`,
      undefined,
      await companyless(asker, askerDevice),
    );
    expect(reply.body.items.map((item) => item.tenantId)).toEqual([oldest.tenantId, twin.tenantId]);
  });
});
