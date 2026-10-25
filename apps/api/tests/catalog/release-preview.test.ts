import type { RoleSet } from '@heliogrid/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  aCompany,
  aMembership,
  aPerson,
  type Fixture,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import {
  actBy,
  aPanelSpec,
  aPlatformItem,
  aRunTag,
  catalogReleasesServiceOf,
  catalogServiceOf,
  noKey,
  preset,
  publishIndiaPack,
  removePlatformItems,
} from './support';

/**
 * The release preview (`SCR-M01-15` s-publish, `T-M01-015` AC-17): what a publish now would carry,
 * against REAL state — the very lines the next publish writes, money on the tenant's day, nothing
 * written by the read, an empty preview a 200, pages that follow on, and no other tenant's changes.
 */

const here = aCompany('Preview EPC');
const elsewhere = aCompany('Rival Preview EPC');
const owner = aPerson('Kavya Desai');
const rival = aPerson('Arjun Mehta');
const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [owner, rival],
  memberships: [
    aMembership(here, owner, [preset.epc_owner]),
    aMembership(elsewhere, rival, [preset.epc_owner]),
  ],
};
const OWNER: RoleSet = [preset.epc_owner];
const ALL = { limit: 50, page: 1 };

const skip = skipWithoutDatabase(
  'CATALOG RELEASE PREVIEW PROOF',
  'That the publish dialog shows what a publish writes is UNPROVEN in this run.',
);

describe.skipIf(skip)('the release preview, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let catalog: ReturnType<typeof catalogServiceOf>;
  let releases: ReturnType<typeof catalogReleasesServiceOf>;
  let platformItem: string;
  const run = aRunTag();
  const now = Date.now();
  const by = (userId: string) => actBy(userId, now);
  const sku = (tenantId: string, userId: string, model: string) =>
    catalog.createItem(
      tenantId,
      OWNER,
      {
        brand: 'Own',
        model: `${run} ${model}`,
        spec: aPanelSpec(),
        certifications: [],
        preferred: false,
      },
      noKey,
      by(userId),
    );
  const preview = (tenantId: string, page = ALL) => releases.preview(tenantId, page, now);
  const releaseCount = async () =>
    (await releases.releases(here.tenantId, { limit: 1, page: 1 })).totalCount;

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    catalog = catalogServiceOf(pools);
    releases = catalogReleasesServiceOf(pools);
    platformItem = await aPlatformItem(pools, { model: `${run} Listed`, markets: ['IN'] });
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await removePlatformItems(pools, [platformItem]);
    await pools.close();
  });

  it('nothing changed previews empty', async () => {
    const empty = await preview(here.tenantId);
    expect(empty.counts).toEqual({ added: 0, changed: 0, archived: 0 });
    expect(empty.lines).toEqual({ items: [], totalCount: 0 });
  });

  it('the preview lists what a publish then writes', async () => {
    const own = await sku(here.tenantId, owner.userId, 'First');
    await catalog.recordRate(
      here.tenantId,
      OWNER,
      own.id,
      { amount: '13600' },
      noKey,
      by(owner.userId),
    );
    await catalog.saveOverride(
      here.tenantId,
      OWNER,
      platformItem,
      { rate: { amount: '14900' }, taxPct: '5.00' },
      noKey,
      by(owner.userId),
    );
    const seen = await preview(here.tenantId);
    expect(seen.counts).toEqual({ added: 2, changed: 0, archived: 0 });
    const amounts = seen.lines.items.map((line) => line.after.rate?.amount).sort();
    expect(amounts).toEqual(['13600.00', '14900.00']);

    const published = await releases.publish(
      here.tenantId,
      OWNER,
      { label: `${run} r1` },
      noKey,
      by(owner.userId),
    );
    const written = await releases.release(here.tenantId, published.id, ALL, now);
    expect(written.lines.items).toEqual(seen.lines.items);
    expect(written.release.counts).toEqual(seen.counts);
  });

  it('a preview writes nothing', async () => {
    const before = await releaseCount();
    await sku(here.tenantId, owner.userId, 'Unpublished');
    await preview(here.tenantId);
    await preview(here.tenantId);
    expect(await releaseCount()).toBe(before);
    expect((await preview(here.tenantId)).counts.added).toBe(1);
  });

  it('a second page continues the first', async () => {
    await sku(here.tenantId, owner.userId, 'Second');
    await sku(here.tenantId, owner.userId, 'Third');
    const whole = await preview(here.tenantId);
    const first = await preview(here.tenantId, { limit: 2, page: 1 });
    const second = await preview(here.tenantId, { limit: 2, page: 2 });
    expect(first.lines.totalCount).toBe(whole.lines.totalCount);
    expect([...first.lines.items, ...second.lines.items].map((line) => line.item.id)).toEqual(
      whole.lines.items
        .slice(0, first.lines.items.length + second.lines.items.length)
        .map((line) => line.item.id),
    );
  });

  it("another tenant's changes stay out", async () => {
    const before = (await preview(here.tenantId)).lines.totalCount;
    await sku(elsewhere.tenantId, rival.userId, 'Rival');
    expect((await preview(here.tenantId)).lines.totalCount).toBe(before);
    const theirs = await preview(elsewhere.tenantId);
    expect(theirs.lines.totalCount).toBe(1);
    expect(theirs.lines.items.map((line) => line.item.model)).toEqual([`${run} Rival`]);
  });
});
