import { randomUUID } from 'node:crypto';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { preset } from '../catalog/support';
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
import { bearerFor, bootHttp, type Http } from '../support/http';
import { publishIndiaPack } from './support';

/**
 * The payment terms' two new doors on the WIRE (`SCR-M01-20`, AC-5): restore and the preview
 * are the settings grant's, so a Sales Executive is refused both before the handler runs, while
 * the owner is answered in the shapes the contract declares. The app boots as production boots.
 */

const here = aCompany('Terms Door EPC');
const owner = aPerson('Rajesh Kulkarni');
const sales = aPerson('Sunita Pawar');
const ownerHere = aMembership(here, owner, [preset.epc_owner]);
const salesHere = aMembership(here, sales, [preset.sales_executive]);
const memberships = [ownerHere, salesHere];
const devices = new Map(memberships.map((m) => [m, aDevice(m.held, m.of)]));
const fixture: Fixture = {
  companies: [here],
  people: [owner, sales],
  memberships,
  devices: [...devices.values()],
};

const skip = skipWithoutDatabase(
  'PAYMENT TERMS DOOR PROOF',
  'Who may restore a template or preview a schedule is UNPROVEN on the wire in this run.',
);

const whole = { lines: [{ percent: '40.00' }, { percent: '60.00' }] };

describe.skipIf(skip)('the payment terms’ doors, over HTTP against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;

  const bearerOf = (membership: Membership) =>
    bearerFor(http, membership, devices.get(membership) as Device);
  const doors = () =>
    [
      ['POST', `/settings/tranche-templates/${randomUUID()}/restore`, undefined],
      ['POST', '/settings/tranche-templates/preview', whole],
    ] as const;

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    http = await bootHttp();
  });

  afterAll(async () => {
    await http.close();
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('a reader without the grant is refused restore and preview', async () => {
    for (const [method, path, body] of doors()) {
      const reply = await http.call(method, path, body, await bearerOf(salesHere));
      expect({ path, status: reply.status }).toEqual({ path, status: HttpStatus.FORBIDDEN });
    }
  });

  it('the owner is answered as the contract declares', async () => {
    const [restore, preview] = doors();
    const missing = await http.call(restore[0], restore[1], undefined, await bearerOf(ownerHere));
    expect(missing.status).toBe(HttpStatus.NOT_FOUND);
    const schedule = await http.call(preview[0], preview[1], preview[2], await bearerOf(ownerHere));
    expect(schedule).toMatchObject({
      status: HttpStatus.OK,
      body: { currencyCode: 'INR', contract: '420000.00', amounts: ['168000.00', '252000.00'] },
    });
  });
});
