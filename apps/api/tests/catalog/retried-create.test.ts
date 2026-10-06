import { randomUUID } from 'node:crypto';
import {
  type CatalogItemWire,
  IDEMPOTENCY_KEY_HEADER,
  type SessionProjection,
} from '@heliogrid/contracts';
import { catalogRateEntry, tenantCatalogItem } from '@heliogrid/db';
import { HttpStatus } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openPools } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';
import {
  aPanelSpec,
  aPlatformItem,
  aRunTag,
  publishIndiaPack,
  removePlatformItems,
} from './support';

/**
 * A catalog write sent twice is ONE write (`F4-07`, b8), on the wire against a migrated database:
 * an own SKU, a rate entry and an override's rate each sent twice with one key leave one row;
 * two sends AT ONCE wait on each other; a key reused for another body — or another item — is
 * refused with nothing written. The key's decisions are proven pure in
 * `apps/api/tests/common/creation-key.test.ts`; what only a real transaction shows is here.
 */

const skip = skipWithoutHarness(
  'RETRIED CATALOG WRITE WIRE PROOF',
  'A retried catalog write is UNPROVEN on the wire in this run.',
);

const ITEMS = '/catalog/items';

describe.skipIf(skip)('a retried catalog write, over HTTP (F4-07)', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;
  let here: SessionProjection;
  let tenantId: string;
  let sku: string;
  let listed: string;
  let other: string;
  const run = aRunTag();

  const keyed = (key: string) => ({ [IDEMPOTENCY_KEY_HEADER]: key });
  const create = (model: string, key: string) =>
    http.call<CatalogItemWire>(
      'POST',
      ITEMS,
      { brand: 'Own', model, spec: aPanelSpec(), certifications: [], preferred: false },
      keyed(key),
    );
  const skusWithKey = async (key: string) =>
    (
      await pools.admin.db
        .select({ id: tenantCatalogItem.id })
        .from(tenantCatalogItem)
        .where(
          and(eq(tenantCatalogItem.tenantId, tenantId), eq(tenantCatalogItem.creationKey, key)),
        )
    ).length;
  const entriesWithKey = async (key: string) =>
    (
      await pools.admin.db
        .select({ id: catalogRateEntry.id })
        .from(catalogRateEntry)
        .where(and(eq(catalogRateEntry.tenantId, tenantId), eq(catalogRateEntry.creationKey, key)))
    ).length;

  beforeAll(async () => {
    pools = openPools();
    await publishIndiaPack(pools);
    http = await bootHttp();
    await http.signIn();
    here = await http.createCompany('Retried Catalog EPC');
    tenantId = here.membership?.tenantId ?? '';
    sku = (await create(`${run} Base`, randomUUID())).body.id;
    listed = await aPlatformItem(pools, { model: `${run} Listed`, markets: ['IN'] });
    other = await aPlatformItem(pools, { model: `${run} Other`, markets: ['IN'] });
  });

  // The company stays standing: every HTTP suite shares one development number (apps/api/CLAUDE.md).
  afterAll(async () => {
    await http.close();
    await pools.admin.db.delete(catalogRateEntry).where(eq(catalogRateEntry.tenantId, tenantId));
    await pools.admin.db.execute(
      sql`delete from tenant_catalog_override where tenant_id = ${tenantId}`,
    );
    await removePlatformItems(pools, [listed, other]);
    await pools.close();
  });

  it('answers an own SKU sent twice with one key with ONE SKU', async () => {
    const key = randomUUID();
    const [first, second] = [await create(`${run} Twice`, key), await create(`${run} Twice`, key)];
    expect([first.status, second.status]).toEqual([HttpStatus.CREATED, HttpStatus.CREATED]);
    expect(second.body.id).toBe(first.body.id);
    expect(await skusWithKey(key)).toBe(1);
  });

  it('answers two sends of one key AT ONCE with one SKU — the second waits on the first', async () => {
    const key = randomUUID();
    // Both sends need the catalog lock to insert; held, it makes them overlap for certain.
    const held = await holdLock(
      sql`select pg_advisory_xact_lock(hashtext(${`catalog:${tenantId}`}))`,
    );
    const sends = Promise.all([create(`${run} At once`, key), create(`${run} At once`, key)]);
    await held.waitForWaiters(2);
    await held.release();
    const [one, two] = await sends;
    expect([one.status, two.status]).toEqual([HttpStatus.CREATED, HttpStatus.CREATED]);
    expect(two.body.id).toBe(one.body.id);
    expect(await skusWithKey(key)).toBe(1);
  });

  it.each([
    ['a rate entry', () => `${ITEMS}/${sku}/rate-entries`, 'POST', { amount: '100' }],
    ["an override's rate", () => `${ITEMS}/${listed}/override`, 'PUT', { rate: { amount: '100' } }],
  ])('appends %s sent twice with one key ONCE', async (_, path, method, body) => {
    const key = randomUUID();
    const replies = [
      await http.call(method, path(), body, keyed(key)),
      await http.call(method, path(), body, keyed(key)),
    ];
    expect(replies.map((reply) => reply.status)).toEqual(
      method === 'POST' ? [HttpStatus.CREATED, HttpStatus.CREATED] : [HttpStatus.OK, HttpStatus.OK],
    );
    expect(await entriesWithKey(key)).toBe(1);
  });

  it.each([
    ['another body', 'POST', () => `${ITEMS}/${sku}/rate-entries`, { amount: '200' }],
    ['another item', 'POST', () => `${ITEMS}/${other}/rate-entries`, { amount: '100' }],
    [
      "another item's override",
      'PUT',
      () => `${ITEMS}/${other}/override`,
      { rate: { amount: '100' } },
    ],
  ])(
    'refuses one key reused for %s as IDEMPOTENCY_KEY_REUSED, writing nothing',
    async (_, method, path, body) => {
      const key = randomUUID();
      // The first send is on the same route kind as the reuse, so only the item or body differs.
      const first =
        method === 'POST'
          ? { path: `${ITEMS}/${sku}/rate-entries`, body: { amount: '100' } }
          : { path: `${ITEMS}/${listed}/override`, body };
      await http.call(method, first.path, first.body, keyed(key));
      const reused = await http.call(method, path(), body, keyed(key));
      expect(reused.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(reused.body).toMatchObject({ error: { code: 'IDEMPOTENCY_KEY_REUSED' } });
      expect(await entriesWithKey(key)).toBe(1);
    },
  );

  it('a keyed override save with no rate keeps nothing under its key — the key covers the rate', async () => {
    const key = randomUUID();
    await http.call('PUT', `${ITEMS}/${listed}/override`, { hidden: false }, keyed(key));
    const priced = await http.call(
      'PUT',
      `${ITEMS}/${listed}/override`,
      { rate: { amount: '150' } },
      keyed(key),
    );
    expect(priced.status).toBe(HttpStatus.OK);
    expect(await entriesWithKey(key)).toBe(1);
  });

  it('applies a send with no key as before — an app that has not updated appends twice', async () => {
    const path = `${ITEMS}/${other}/rate-entries`;
    await http.call('POST', path, { amount: '300' });
    await http.call('POST', path, { amount: '300' });
    const history = await http.call<{ totalCount: number }>('GET', path);
    expect(history.body.totalCount).toBe(2);
  });
});
