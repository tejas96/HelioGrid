import { randomUUID } from 'node:crypto';
import {
  DEFAULT_PAGE_LIMIT,
  IDEMPOTENCY_KEY_HEADER,
  MAX_RATES_PER_VERSION,
  type PriceBookPublish,
  priceBookPublishSchema,
  type RoleSet,
} from '@heliogrid/contracts';
import { createDb, tenantPool } from '@heliogrid/db';
import { ForbiddenException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  aCompany,
  aMembership,
  aPerson,
  databaseUrl,
  type Fixture,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { holdLock } from '../support/held-lock';
import {
  actBy,
  aRate,
  aRateSet,
  entriesOf,
  noKey,
  preset,
  priceBookServiceOf,
  publishIndiaPack,
  storedVersion,
  versionCount,
} from './support';

/**
 * A price-book publish (`M01-48`, AC-1, AC-3, AC-5, AC-9 – AC-11), against REAL state: a publish
 * writes a new immutable version and leaves every earlier one byte-identical; the newest is the one
 * in force; two publishes held on the lock both land in server order; Finance reads and never
 * publishes; a refused body writes nothing; each publish records one audit entry; a retried
 * publish answers the version the first one made.
 */

const here = aCompany('Price Book EPC');
const owner = aPerson('Rajesh Kulkarni');
const fixture: Fixture = {
  companies: [here],
  people: [owner],
  memberships: [aMembership(here, owner, [preset.epc_owner])],
};
const OWNER: RoleSet = [preset.epc_owner];
const FINANCE: RoleSet = [preset.finance];
const FIRST_PAGE = { limit: DEFAULT_PAGE_LIMIT, page: 1 };
const RACING_CONNECTIONS = 3;
const keyed = () => ({ [IDEMPOTENCY_KEY_HEADER]: randomUUID() });

const skip = skipWithoutDatabase(
  'PRICE BOOK PUBLISH PROOF',
  'That a publish versions rates and never rewrites one is UNPROVEN in this run.',
);

describe.skipIf(skip)('the price-book publish, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let book: ReturnType<typeof priceBookServiceOf>;
  const publish = (body: PriceBookPublish = aRateSet(), roles: RoleSet = OWNER, headers = noKey) =>
    book.publish(here.tenantId, roles, body, headers, actBy(owner.userId));

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    book = priceBookServiceOf(pools);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('a publish inserts one version and its rows and leaves the prior version byte-identical', async () => {
    const first = await publish();
    const before = await storedVersion(pools, first.id);
    const second = await publish(
      aRateSet({ note: 'DISCOM liaison raised.', defaultMarginPct: '16.50' }),
    );

    expect(second.number).toBe(first.number + 1);
    expect(await storedVersion(pools, first.id)).toEqual(before);
    const { rates } = await storedVersion(pools, second.id);
    expect(rates.map((rate) => [rate.position, rate.basis, rate.amount])).toEqual([
      [0, 'per_kw', '1450.000'],
      [1, 'per_job', '9000.000'],
    ]);
    expect((await book.active(here.tenantId, Date.now())).version?.id).toBe(second.id);
  });

  it('the versions list serves every version and marks only the newest active', async () => {
    const newest = await publish(aRateSet({ rates: [] }));
    const { items, totalCount } = await book.versions(here.tenantId, FIRST_PAGE);

    expect(totalCount).toBe(await versionCount(pools, here.tenantId));
    expect(items.map((version) => version.number)).toEqual(
      [...items.map((version) => version.number)].sort((a, b) => b - a),
    );
    expect(items.filter((version) => version.active).map((version) => version.id)).toEqual([
      newest.id,
    ]);
    expect(items[0]).toMatchObject({ rateCount: 0, publishedBy: { id: owner.userId } });
  });

  it('two publishes held on the lock both land with distinct numbers and two audit entries', async () => {
    // Each publish holds a connection while it waits, so the two need a pool wider than one.
    const wide = createDb(databaseUrl, { max: RACING_CONNECTIONS });
    const racing = priceBookServiceOf({ ...pools, tenants: tenantPool(wide.db) });
    const publishAtOnce = (note: string) =>
      racing.publish(here.tenantId, OWNER, aRateSet({ note }), noKey, actBy(owner.userId));
    const held = await holdLock(
      sql`select pg_advisory_xact_lock(hashtext(${`price-book:${here.tenantId}`}))`,
    );
    const [one, two] = await (async () => {
      try {
        const both = Promise.all([
          publishAtOnce('First of two at once.'),
          publishAtOnce('Second of two at once.'),
        ]);
        try {
          await held.waitForWaiters(2);
        } finally {
          await held.release();
        }
        return await both;
      } finally {
        await wide.client.end();
      }
    })();

    expect(Math.abs(one.number - two.number)).toBe(1);
    const active = await book.active(here.tenantId, Date.now());
    expect(active.version?.number).toBe(Math.max(one.number, two.number));
    for (const version of [one, two]) {
      expect(
        await entriesOf(pools, here.tenantId, 'price_book.version_published', version.id),
      ).toHaveLength(1);
    }
  });

  it('Finance reads every version and is refused the publish', async () => {
    const count = await versionCount(pools, here.tenantId);

    await expect(publish(aRateSet(), FINANCE)).rejects.toBeInstanceOf(ForbiddenException);
    expect(await versionCount(pools, here.tenantId)).toBe(count);
    const { items } = await book.versions(here.tenantId, FIRST_PAGE);
    expect(items).toHaveLength(count);
    expect((await book.version(here.tenantId, items[0]?.id ?? '', Date.now())).rates).toBeDefined();
  });

  it.each([
    ['a margin one hundredth above the highest', { defaultMarginPct: '60.01' }, 'defaultMarginPct'],
    ['a negative amount', { rates: [aRate({ amount: '-1' })] }, 'rates.0.amount'],
    ['an empty note', { note: '' }, 'note'],
    ['one rate past the bound', { rates: Array(MAX_RATES_PER_VERSION + 1).fill(aRate()) }, 'rates'],
  ])('the contract refuses %s at its path', (_case, override, path) => {
    const parsed = priceBookPublishSchema.safeParse(
      aRateSet(override as Partial<PriceBookPublish>),
    );

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.map((issue) => issue.path.join('.'))).toContain(path);
  });

  it.each([
    ['the highest margin', { defaultMarginPct: '60.00' }],
    ['a zero amount', { rates: [aRate({ amount: '0' })] }],
    ['no rates at all', { rates: [] }],
  ])('the contract accepts %s', (_case, override) => {
    expect(priceBookPublishSchema.safeParse(aRateSet(override)).success).toBe(true);
  });

  it.each([
    ['one decimal place past the currency', '1.001', false],
    ['the currency’s own two places', '1.01', true],
  ])('a rate at %s is refused at its path, and nothing is written', async (_case, amount, kept) => {
    const count = await versionCount(pools, here.tenantId);
    const body = aRateSet({ rates: [aRate({ amount })] });

    if (kept) {
      await publish(body);
      expect(await versionCount(pools, here.tenantId)).toBe(count + 1);
    } else {
      await expect(publish(body)).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        details: [{ path: 'rates.0.amount' }],
      });
      expect(await versionCount(pools, here.tenantId)).toBe(count);
    }
  });

  it('a publish writes one audit entry on its version', async () => {
    const version = await publish();

    expect(
      await entriesOf(pools, here.tenantId, 'price_book.version_published', version.id),
    ).toEqual([{ subjectKind: 'price_book_version', actorRef: owner.userId }]);
  });

  it('a retried publish answers the first version', async () => {
    const headers = keyed();
    const first = await publish(aRateSet(), OWNER, headers);
    const count = await versionCount(pools, here.tenantId);

    expect((await publish(aRateSet(), OWNER, headers)).id).toBe(first.id);
    expect(await versionCount(pools, here.tenantId)).toBe(count);
    await expect(
      publish(aRateSet({ note: 'Another body under the same key.' }), OWNER, headers),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
    expect(await versionCount(pools, here.tenantId)).toBe(count);
  });
});
