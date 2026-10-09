import type { SessionProjection } from '@heliogrid/contracts';
import { FOUNDER_ROLE, ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { hashSecret, randomSecret } from '../../src/common/auth/secrets';
import {
  aCompany,
  aMembership,
  anInvite,
  aPerson,
  aPhone,
  type Fixture,
  openPools,
  seed,
} from '../support/fixture';
import { bootHttp, DEV_PHONE, type Http, skipWithoutHarness } from '../support/http';

/**
 * The join repeated, on the wire (`M01-13`, `F4-07`): the person an invite let in, tapping Join
 * again on a lost answer, is answered as the join was — `200` and the same company — while anyone
 * else on that answered link, a teammate in that company included, finds it landing nowhere. The
 * join's own writes are `accept.test.ts`'s; this proves the route lets the repeat reach them.
 */

const [SALES] = ROLE_PRESETS.filter((preset) => preset !== FOUNDER_ROLE) as [RolePreset];

const joining = aCompany('Repeat Join EPC');
const owner = aPerson('Anil Kale');
/** The harness's own number is invited: its session is the invitee's. */
const ownLink = randomSecret();
const toHarness = {
  ...anInvite(joining, owner, { name: 'Harness Person', phoneE164: DEV_PHONE }, [SALES]),
  tokenHash: hashSecret(ownLink),
};
/** Someone else's invite, already answered: the harness is a teammate there after joining. */
const othersLink = randomSecret();
const toSomeoneElse = {
  ...anInvite(joining, owner, { name: 'Someone Else', phoneE164: aPhone() }, [SALES], {
    status: 'accepted',
  }),
  tokenHash: hashSecret(othersLink),
};
const fixture: Fixture = {
  companies: [joining],
  people: [owner],
  memberships: [aMembership(joining, owner, [FOUNDER_ROLE])],
  invites: [toHarness, toSomeoneElse],
};

const skip = skipWithoutHarness(
  'REPEATED-JOIN WIRE PROOF',
  'A repeated join on the route is UNPROVEN in this run — only the join’s writes are.',
);

describe.skipIf(skip)('the join repeated, over HTTP', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;
  const accept = (link: string) =>
    http.call<SessionProjection>('POST', `/invitations/landing/${link}/accept`);

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    http = await bootHttp();
    await http.signIn();
  });

  // Every seeded row stays: each run seeds its own company, and deleting one breaks other
  // suites' sign-in (`apps/api/CLAUDE.md`, the first trap) — the join's rows go with it.
  afterAll(async () => {
    await http.close();
    await pools.close();
  });

  it('answers the joined person’s second Join as the first — 200 and the same company', async () => {
    const first = await accept(ownLink);
    expect(first.status).toBe(HttpStatus.OK);
    expect(first.body.membership?.tenantId).toBe(joining.tenantId);
    const again = await accept(ownLink);
    expect(again.status).toBe(HttpStatus.OK);
    expect(again.body.membership).toEqual(first.body.membership);
  });

  it('lands a teammate nowhere on someone else’s answered link', async () => {
    expect((await accept(othersLink)).status).toBe(HttpStatus.NOT_FOUND);
  });
});
