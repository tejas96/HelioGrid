import { tenantMembership } from '@heliogrid/db';
import { FOUNDER_ROLE, ROLE_PRESETS } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { aDevice, type Device } from '../support/devices';
import {
  aCompany,
  aMembership,
  aPerson,
  type Fixture,
  type Membership,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { bearerFor, bootHttp, type Http } from '../support/http';

/**
 * The company's EPC Owners by name, for the role card's owner note (`SCR-M01-10` ruling 15), on
 * the WIRE: any member reads them, the first two by name and a count of the rest; an owner who
 * was deactivated is no owner; another company's owners never appear.
 */

const PATH = '/tenants/me/owners';
const [WORKING_PRESET] = ROLE_PRESETS.filter((preset) => preset !== FOUNDER_ROLE);
if (WORKING_PRESET === undefined) throw new Error('the matrix holds no preset but the owner');

const here = aCompany('Owner Names EPC');
const alone = aCompany('One Owner EPC');
const meera = aPerson('Meera Shah');
const rajesh = aPerson('Rajesh Sharma');
const anil = aPerson('Anil Deshmukh');
const gone = aPerson('Aarti Bhosale');
const rep = aPerson('Priya Kulkarni');
const solo = aPerson('Zubin Mehta');
const meeraHere = aMembership(here, meera, [FOUNDER_ROLE]);
const rajeshHere = aMembership(here, rajesh, [FOUNDER_ROLE, WORKING_PRESET]);
const anilHere = aMembership(here, anil, [FOUNDER_ROLE]);
const goneHere = aMembership(here, gone, [FOUNDER_ROLE]);
const repHere = aMembership(here, rep, [WORKING_PRESET]);
const soloAlone = aMembership(alone, solo, [FOUNDER_ROLE]);
const memberships = [meeraHere, rajeshHere, anilHere, goneHere, repHere, soloAlone];
const devices = new Map(memberships.map((m) => [m, aDevice(m.held, m.of)]));

const fixture: Fixture = {
  companies: [here, alone],
  people: [meera, rajesh, anil, gone, rep, solo],
  memberships,
  devices: [...devices.values()],
};

const skip = skipWithoutDatabase(
  'OWNERS WIRE PROOF',
  'The owner names on the role card are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('the company’s owners, over HTTP against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;

  const read = async (as: Membership, company: 'held' | 'none' = 'held') =>
    http.call<{ owners: { name: string }[]; more: number; error?: { code: string } }>(
      'GET',
      PATH,
      undefined,
      await bearerFor(http, as, devices.get(as) as Device, company),
    );

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await pools.admin.db
      .update(tenantMembership)
      .set({ status: 'deactivated' })
      .where(eq(tenantMembership.id, goneHere.membershipId));
    http = await bootHttp();
  });

  afterAll(async () => {
    await http.close();
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('a member reads the first two active owners by name, and how many more', async () => {
    const reply = await read(repHere);
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body).toEqual({
      owners: [{ name: 'Anil Deshmukh' }, { name: 'Meera Shah' }],
      more: 1,
    });
  });

  it('owners of my company only', async () => {
    expect((await read(soloAlone)).body).toEqual({ owners: [{ name: 'Zubin Mehta' }], more: 0 });
    const names = (await read(meeraHere)).body.owners.map((owner) => owner.name);
    expect(names).not.toContain('Zubin Mehta');
  });

  it('401 signed out', async () => {
    expect((await http.callAnonymously('GET', PATH)).status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('403 with no company yet', async () => {
    const reply = await read(repHere, 'none');
    expect(reply.status).toBe(HttpStatus.FORBIDDEN);
    expect(reply.body.error?.code).toBe('FORBIDDEN');
  });
});
