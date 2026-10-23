import { FOUNDER_ROLE, ROLE_PRESETS } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
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
 * The roster carries every member's phone, so only someone who manages the team reads it
 * (`M01` Permissions, `F2.M01.manage-team`; D324). The role card's owner names stay on the
 * names-only `/tenants/me/owners`, which any member reads.
 */

const PATH = '/tenants/me/members';
const [WORKING_PRESET] = ROLE_PRESETS.filter((preset) => preset !== FOUNDER_ROLE);
if (WORKING_PRESET === undefined) throw new Error('the matrix holds no preset but the owner');

const here = aCompany('Roster Guard EPC');
const owner = aPerson('Rajesh Sharma');
const rep = aPerson('Priya Kulkarni');
const ownerHere = aMembership(here, owner, [FOUNDER_ROLE]);
const repHere = aMembership(here, rep, [WORKING_PRESET]);
const memberships = [ownerHere, repHere];
const devices = new Map(memberships.map((m) => [m, aDevice(m.held, m.of)]));

const fixture: Fixture = {
  companies: [here],
  people: [owner, rep],
  memberships,
  devices: [...devices.values()],
};

const skip = skipWithoutDatabase(
  'ROSTER GUARD WIRE PROOF',
  'Who may read the team roster is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('the team roster, over HTTP against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;

  const read = async (as: Membership) =>
    http.call<{ items?: { membershipId: string }[]; error?: { code: string } }>(
      'GET',
      PATH,
      undefined,
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

  it('a member who does not manage the team is refused: 403 FORBIDDEN', async () => {
    const reply = await read(repHere);
    expect(reply.status).toBe(HttpStatus.FORBIDDEN);
    expect(reply.body.error?.code).toBe('FORBIDDEN');
  });

  it('an EPC Owner reads the whole roster', async () => {
    const reply = await read(ownerHere);
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.items?.map((item) => item.membershipId).sort()).toEqual(
      [ownerHere.membershipId, repHere.membershipId].sort(),
    );
  });
});
