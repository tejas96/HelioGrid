import type { SessionClaims } from '@heliogrid/contracts';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TokenService } from '../../src/modules/auth/internal/token.service';
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
import { bootHttp, type Http } from '../support/http';
import { aRateSet, preset } from './support';

/**
 * The price book's door on the WIRE (§M01.5, AC-8): every route is the catalog's money grant's, so
 * a preset without `onboarding.manage_catalog` in any form is refused each read before the
 * handler runs, while Finance's limited cell reads. The app boots as production boots, so the
 * guard and the declared route access are in the path.
 */

const here = aCompany('Door EPC');
const owner = aPerson('Rajesh Kulkarni');
const finance = aPerson('Ravi Joshi');
const sales = aPerson('Sunita Pawar');
const ownerHere = aMembership(here, owner, [preset.epc_owner]);
const financeHere = aMembership(here, finance, [preset.finance]);
const salesHere = aMembership(here, sales, [preset.sales_executive]);
const memberships = [ownerHere, financeHere, salesHere];
const devices = new Map(memberships.map((m) => [m, aDevice(m.held, m.of)]));
const fixture: Fixture = {
  companies: [here],
  people: [owner, finance, sales],
  memberships,
  devices: [...devices.values()],
};

const skip = skipWithoutDatabase(
  'PRICE BOOK DOOR PROOF',
  'Who may read the price book is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('the price book’s door, over HTTP against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;
  let versionId: string;

  /** A bearer for the membership's own device, carrying its roles as the session does. */
  const bearerOf = async (membership: Membership) => {
    const device = devices.get(membership) as Device;
    const claims: SessionClaims = {
      sub: membership.held.userId,
      sid: device.sessionId,
      membership: {
        tenantId: membership.of.tenantId,
        roles: [...membership.roles],
        authorizationVersion: 0,
      },
    };
    const { token } = await http.app.get(TokenService).mint(claims, Date.now());
    return { authorization: `Bearer ${token}` };
  };
  const reads = () => [
    ['the rate card in force', '/price-book/active'],
    ['the version list', '/price-book/versions'],
    ['one version', `/price-book/versions/${versionId}`],
  ];

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    http = await bootHttp();
    const published = await http.call<{ id: string }>(
      'POST',
      '/price-book/versions',
      aRateSet(),
      await bearerOf(ownerHere),
    );
    versionId = published.body.id;
  });

  afterAll(async () => {
    await http.close();
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('a Sales Executive is refused every read', async () => {
    for (const [, path] of reads()) {
      const reply = await http.call('GET', path ?? '', undefined, await bearerOf(salesHere));
      expect({ path, status: reply.status }).toEqual({ path, status: HttpStatus.FORBIDDEN });
    }
  });

  it('Finance reads every route', async () => {
    for (const [, path] of reads()) {
      const reply = await http.call('GET', path ?? '', undefined, await bearerOf(financeHere));
      expect({ path, status: reply.status }).toEqual({ path, status: HttpStatus.OK });
    }
  });
});
