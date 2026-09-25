import { randomUUID } from 'node:crypto';
import {
  type CreateTenant,
  IDEMPOTENCY_KEY_HEADER,
  type SessionProjection,
  tenantContract,
} from '@heliogrid/contracts';
import { tenant } from '@heliogrid/db';
import { HttpStatus } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { creationKeyOf } from '../../src/common/creation-key';
import { TenantAdminRepository } from '../../src/modules/tenant/tenant.admin.repository';
import { openPools } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';

/**
 * A company signup sent twice is ONE company (`F4-07`), on the wire against a migrated database.
 * The signup is the create whose answer carries a login token, so a replay must adopt the SAME
 * company again and mint its token then — no token is ever stored — and it is the create that can die
 * between its two steps: the company committed, the session not yet moved onto it.
 *
 * The companies stay standing: every HTTP suite shares one development number, and deleting a
 * tenant races another suite's sign-in (`apps/api/tests/notifications/preferences.test.ts`).
 */

const skip = skipWithoutHarness(
  'RETRIED SIGNUP WIRE PROOF',
  'A retried company signup is UNPROVEN on the wire in this run.',
);

const signup = (companyName: string): CreateTenant => ({
  companyName,
  ownerName: 'Harness Owner',
  city: 'Pune',
});

describe.skipIf(skip)('a retried company signup, over HTTP (F4-07)', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;
  let userId: string;

  const create = (body: CreateTenant, key: string) =>
    http.call<SessionProjection>('POST', '/tenants', body, { [IDEMPOTENCY_KEY_HEADER]: key });

  beforeAll(async () => {
    pools = openPools();
    http = await bootHttp();
    userId = (await http.signIn()).actor.userId;
  });

  afterAll(async () => {
    await http.close();
    await pools.close();
  });

  it('answers the same key twice with ONE company, adopted again under a working token', async () => {
    const key = randomUUID();
    const name = `Signed Up Twice ${key}`;
    const first = await create(signup(name), key);
    const second = await create(signup(name), key);
    expect([first.status, second.status]).toEqual([HttpStatus.CREATED, HttpStatus.CREATED]);
    expect(second.body.membership?.tenantId).toBe(first.body.membership?.tenantId);
    expect(await companiesNamed(name)).toBe(1);
    expect(second.headers.getSetCookie().some((line) => line.startsWith('hg_token='))).toBe(true);
    const me = await http.call<{ id: string }>('GET', '/tenants/me');
    expect(me).toMatchObject({
      status: HttpStatus.OK,
      body: { id: first.body.membership?.tenantId },
    });
  });

  it('answers two signups of one key AT ONCE with ONE company — the second waits on the first', async () => {
    const key = randomUUID();
    const name = `Signed Up At Once ${key}`;
    // The signup writes the owner's name onto the account; a lock on that row holds the first send
    // after its insert. Without the key lock the second inserts too and breaks the unique key.
    const held = await holdLock(sql`select id from user_account where id = ${userId} for update`);
    const sends = Promise.all([create(signup(name), key), create(signup(name), key)]);
    await held.waitForWaiters(2);
    await held.release();
    const [first, second] = await sends;
    expect([first.status, second.status]).toEqual([HttpStatus.CREATED, HttpStatus.CREATED]);
    expect(second.body.membership?.tenantId).toBe(first.body.membership?.tenantId);
    expect(await companiesNamed(name)).toBe(1);
  });

  it('refuses the same key with another company as IDEMPOTENCY_KEY_REUSED, writing nothing', async () => {
    const key = randomUUID();
    await create(signup(`Kept ${key}`), key);
    const reused = await create(signup(`Refused ${key}`), key);
    expect(reused.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(reused.body).toMatchObject({ error: { code: 'IDEMPOTENCY_KEY_REUSED' } });
    expect(await companiesNamed(`Refused ${key}`)).toBe(0);
  });

  it('finishes a signup whose company committed before the session moved onto it', async () => {
    const key = randomUUID();
    const body = signup(`Half Finished ${key}`);
    // The first send's transaction, committed, and then nothing: the process died before the
    // session adopted the company, so the person never heard back.
    const committed = await new TenantAdminRepository(pools.admin.db).createWithOwner({
      ...body,
      marketCode: 'IN',
      currencyCode: 'INR',
      defaultLanguage: 'en',
      timezone: 'Asia/Kolkata',
      ownerUserId: userId,
      now: Date.now(),
      key: creationKeyOf({ [IDEMPOTENCY_KEY_HEADER]: key }, userId, tenantContract.create, body),
    });
    if (committed.outcome !== 'created') throw new Error('the first send must create');
    const retried = await create(body, key);
    expect(retried.status).toBe(HttpStatus.CREATED);
    expect(retried.body.membership?.tenantId).toBe(committed.row.id);
    expect(await companiesNamed(body.companyName)).toBe(1);
  });

  async function companiesNamed(companyName: string): Promise<number> {
    const rows = await pools.admin.db
      .select({ id: tenant.id })
      .from(tenant)
      .where(eq(tenant.companyName, companyName));
    return rows.length;
  }
});
