import { auditLogEntry } from '@heliogrid/db';
import { FOUNDER_ROLE, ROLE_PRESETS } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { aDevice, type Device } from '../support/devices';
import {
  aCompany,
  aMembership,
  aPerson,
  type Fixture,
  type Membership,
  openPools,
  rolesHeldBy,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { bearerFor, bootHttp, type Http } from '../support/http';

/**
 * F2-19 on the wire: an owner removing their own admin rights is blocked with an explanation, and
 * the attempt is recorded (`F2-22`); another owner can do it. The sole owner's own removal answers
 * the last-owner guard first, as the sheet's lock says (`SCR-M01-13`, Decision 3A).
 */

const [WORKING_PRESET] = ROLE_PRESETS.filter((preset) => preset !== FOUNDER_ROLE);
if (WORKING_PRESET === undefined) throw new Error('the matrix holds no preset but the owner');

const here = aCompany('Own Admin EPC');
const alone = aCompany('Sole Admin EPC');
const rajesh = aPerson('Rajesh Sharma');
const meera = aPerson('Meera Shah');
const solo = aPerson('Zubin Mehta');
const rajeshHere = aMembership(here, rajesh, [FOUNDER_ROLE]);
const meeraHere = aMembership(here, meera, [FOUNDER_ROLE]);
const soloAlone = aMembership(alone, solo, [FOUNDER_ROLE]);
const memberships = [rajeshHere, meeraHere, soloAlone];
const devices = new Map(memberships.map((m) => [m, aDevice(m.held, m.of)]));

const fixture: Fixture = {
  companies: [here, alone],
  people: [rajesh, meera, solo],
  memberships,
  devices: [...devices.values()],
};

const skip = skipWithoutDatabase(
  'OWN-ADMIN WIRE PROOF',
  'F2-19’s own-admin guard is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('removing your own EPC Owner, over HTTP against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;

  const assign = async (as: Membership, subject: Membership, roles: readonly string[]) =>
    http.call<{ roles?: string[]; error?: { code: string } }>(
      'PUT',
      `/tenants/me/members/${subject.membershipId}/roles`,
      { roles },
      await bearerFor(http, as, devices.get(as) as Device),
    );

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

  it('refuses your own EPC Owner while another owner remains: 422 OWN_ADMIN, nothing changed, one blocked entry', async () => {
    const reply = await assign(rajeshHere, rajeshHere, [WORKING_PRESET]);
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(reply.body.error?.code).toBe('OWN_ADMIN');
    expect(await rolesHeldBy(pools.admin.db, rajeshHere.membershipId)).toEqual([FOUNDER_ROLE]);
    const entries = await rolesChangedOn(rajeshHere);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      blocked: true,
      actorRef: rajesh.userId,
      changePayload: { from: [FOUNDER_ROLE], to: [WORKING_PRESET] },
    });
  });

  it('your own set that keeps EPC Owner is yours to change', async () => {
    const reply = await assign(rajeshHere, rajeshHere, [FOUNDER_ROLE, WORKING_PRESET]);
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.roles).toEqual([FOUNDER_ROLE, WORKING_PRESET]);
  });

  it('the sole owner removing their own preset meets the last-owner guard first', async () => {
    const reply = await assign(soloAlone, soloAlone, [WORKING_PRESET]);
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(reply.body.error?.code).toBe('LAST_OWNER');
  });

  it('another owner can take your EPC Owner away', async () => {
    const reply = await assign(meeraHere, rajeshHere, [WORKING_PRESET]);
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.roles).toEqual([WORKING_PRESET]);
  });

  /** Only this subject's entries: another suite's writes must not move a count this one owns. */
  function rolesChangedOn(subject: Membership) {
    return pools.admin.db
      .select({
        blocked: auditLogEntry.blocked,
        actorRef: auditLogEntry.actorRef,
        changePayload: auditLogEntry.changePayload,
      })
      .from(auditLogEntry)
      .where(
        and(
          eq(auditLogEntry.subjectRef, subject.membershipId),
          eq(auditLogEntry.eventType, 'team.roles_changed'),
        ),
      );
  }
});
