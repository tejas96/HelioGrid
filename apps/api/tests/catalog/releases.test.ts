import { randomUUID } from 'node:crypto';
import { DEFAULT_PAGE_LIMIT, type RoleSet } from '@heliogrid/contracts';
import { localDate } from '@heliogrid/domain';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
  entriesOf,
  noKey,
  preset,
  publishIndiaPack,
  removePlatformItems,
} from './support';

/**
 * A release is a labelled, append-only publish of the tenant's catalog changes (`M01-43`, AC-9),
 * against REAL state: one line per changed own SKU or override with its before and after; a used
 * label, a publish with nothing changed and a reused retry key are refused with nothing written;
 * a change made and reverted between releases says nothing; a rate dated ahead is named by the
 * first publish on or after its day (c1); each publish records one audit entry (AC-10).
 */

const DAY_MS = 86_400_000;
const DAYS_AHEAD = 3;
const TZ = 'Asia/Kolkata';
const here = aCompany('Release EPC');
const elsewhere = aCompany('Rival EPC');
const owner = aPerson('Asha Kulkarni');
const finance = aPerson('Ravi Joshi');
const rival = aPerson('Meera Rao');
const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [owner, finance, rival],
  memberships: [
    aMembership(here, owner, [preset.epc_owner]),
    aMembership(here, finance, [preset.finance]),
    aMembership(elsewhere, rival, [preset.epc_owner]),
  ],
};
const OWNER: RoleSet = [preset.epc_owner];
const FINANCE: RoleSet = [preset.finance];
const FIRST_PAGE = { limit: DEFAULT_PAGE_LIMIT, page: 1 };

const skip = skipWithoutDatabase(
  'CATALOG RELEASE PROOF',
  'That a release records exactly what changed is UNPROVEN in this run.',
);

describe.skipIf(skip)('catalog releases, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let catalog: ReturnType<typeof catalogServiceOf>;
  let releases: ReturnType<typeof catalogReleasesServiceOf>;
  let platformItem: string;
  let sku: string;
  let october: string;
  const run = aRunTag();
  const now = Date.now();
  const later = now + DAYS_AHEAD * DAY_MS;
  const by = (instant: number = now) => actBy(owner.userId, instant);
  const form = (model: string, preferred = false) => ({
    brand: 'Own',
    model: `${run} ${model}`,
    spec: aPanelSpec(),
    certifications: [],
    preferred,
  });
  const publish = (label: string, instant: number = now, headers = noKey) =>
    releases.publish(here.tenantId, OWNER, { label }, headers, by(instant));
  const releaseCount = async () => (await releases.releases(here.tenantId, FIRST_PAGE)).totalCount;
  const linesOf = async (id: string) =>
    (await releases.release(here.tenantId, id, FIRST_PAGE, now)).lines.items;

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

  it('a catalog with nothing of its own is refused as nothing changed, and nothing is written', async () => {
    await expect(publish('Empty')).rejects.toMatchObject({ code: 'CATALOG_NOTHING_CHANGED' });
    expect(await releaseCount()).toBe(0);
  });

  it('a publish writes one line per changed item with before and after', async () => {
    sku = (
      await catalog.createItem(
        here.tenantId,
        OWNER,
        { ...form('Rayzon 545'), rate: { amount: '14500' } },
        noKey,
        by(),
      )
    ).id;
    await catalog.saveOverride(
      here.tenantId,
      OWNER,
      platformItem,
      { preferred: true, rate: { amount: '9000' } },
      noKey,
      by(),
    );
    const neverNamed = (await catalog.createItem(here.tenantId, OWNER, form('Gone'), noKey, by()))
      .id;
    await catalog.setArchived(here.tenantId, OWNER, neverNamed, true, by());

    const release = await publish('October prices');
    october = release.id;

    expect(release).toMatchObject({
      label: 'October prices',
      publishedAt: new Date(now).toISOString(),
      counts: { added: 2, changed: 0, archived: 0 },
    });
    const lines = await linesOf(october);
    expect(lines.map((line) => line.item.id).sort()).toEqual([platformItem, sku].sort());
    const own = lines.find((line) => line.item.id === sku);
    expect(own).toMatchObject({
      item: { source: 'own_item', kind: 'panel', brand: 'Own', model: `${run} Rayzon 545` },
      changeKind: 'added',
      before: null,
      after: {
        kind: 'own_item',
        archived: false,
        rate: { amount: '14500.00', currencyCode: 'INR', effectiveOn: localDate(now, TZ) },
      },
    });
    expect(lines.find((line) => line.item.id === platformItem)).toMatchObject({
      item: { source: 'platform_item' },
      changeKind: 'added',
      after: { kind: 'override', preferred: true, hidden: false, rate: { amount: '9000.00' } },
    });
  });

  it('a second publish of the same label is refused, and nothing is written', async () => {
    await catalog.saveItem(here.tenantId, OWNER, sku, form('Rayzon 545', true), by());
    await expect(publish('October prices')).rejects.toMatchObject({
      code: 'CATALOG_LABEL_TAKEN',
    });
    expect(await releaseCount()).toBe(1);
  });

  it('a change made and reverted between releases writes no line', async () => {
    await catalog.saveOverride(here.tenantId, OWNER, platformItem, { hidden: true }, noKey, by());
    await catalog.saveOverride(here.tenantId, OWNER, platformItem, { hidden: false }, noKey, by());

    const release = await publish('November prices');

    expect(release.counts).toEqual({ added: 0, changed: 1, archived: 0 });
    expect(await linesOf(release.id)).toEqual([
      expect.objectContaining({
        item: expect.objectContaining({ id: sku }),
        changeKind: 'changed',
        before: expect.objectContaining({ preferred: false }),
        after: expect.objectContaining({ preferred: true }),
      }),
    ]);
  });

  it('nothing changed since the last release is refused, and nothing is written', async () => {
    await expect(publish('Again')).rejects.toMatchObject({ code: 'CATALOG_NOTHING_CHANGED' });
    expect(await releaseCount()).toBe(2);
  });

  it('a rate dated ahead says nothing before its day, and the first publish on its day names it', async () => {
    await catalog.recordRate(
      here.tenantId,
      OWNER,
      sku,
      { amount: '15000', effectiveOn: localDate(later, TZ) },
      noKey,
      by(),
    );
    await expect(publish('Too early')).rejects.toMatchObject({
      code: 'CATALOG_NOTHING_CHANGED',
    });

    const release = await publish('The new rate', later);

    expect(await linesOf(release.id)).toEqual([
      expect.objectContaining({
        changeKind: 'changed',
        before: expect.objectContaining({ rate: expect.objectContaining({ amount: '14500.00' }) }),
        after: expect.objectContaining({ rate: expect.objectContaining({ amount: '15000.00' }) }),
      }),
    ]);
  });

  it('an own SKU archived since its last line is archived', async () => {
    await catalog.setArchived(here.tenantId, OWNER, sku, true, by(later));
    const release = await publish('Rayzon retired', later);
    expect(release.counts).toEqual({ added: 0, changed: 0, archived: 1 });
  });

  it('the list returns the releases newest first, each with its counts', async () => {
    const newestFirst = ['Rayzon retired', 'The new rate', 'November prices', 'October prices'];
    const { items, totalCount } = await releases.releases(here.tenantId, FIRST_PAGE);
    expect(totalCount).toBe(newestFirst.length);
    expect(items.map((release) => release.label)).toEqual(newestFirst);
    expect(items.at(-1)?.counts).toEqual({ added: 2, changed: 0, archived: 0 });
  });

  it('a retried publish makes one release, and its key on another label is refused', async () => {
    await catalog.setArchived(here.tenantId, OWNER, sku, false, by(later));
    const headers = { 'idempotency-key': randomUUID() };
    const published = await releaseCount();
    const first = await publish('Rayzon back', later, headers);
    const again = await publish('Rayzon back', later, headers);

    expect(again.id).toBe(first.id);
    expect(await releaseCount()).toBe(published + 1);
    await expect(publish('Another name', later, headers)).rejects.toMatchObject({
      code: 'IDEMPOTENCY_KEY_REUSED',
    });
  });

  it('Finance cannot publish, and nothing is written', async () => {
    const published = await releaseCount();
    await catalog.saveItem(here.tenantId, OWNER, sku, form('Rayzon 545'), by(later));
    await expect(
      releases.publish(here.tenantId, FINANCE, { label: 'Finance' }, noKey, actBy(finance.userId)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(await releaseCount()).toBe(published);
  });

  it('a publish whose clock reads behind the last release still comes after it', async () => {
    const [last] = (await releases.releases(here.tenantId, FIRST_PAGE)).items;
    const lastAt = Date.parse(last?.publishedAt ?? '');
    const behind = await publish('Clock behind', lastAt - 1);

    expect(Date.parse(behind.publishedAt)).toBeGreaterThan(lastAt);
    expect((await releases.releases(here.tenantId, FIRST_PAGE)).items[0]?.id).toBe(behind.id);
    await expect(publish('Still nothing', later)).rejects.toMatchObject({
      code: 'CATALOG_NOTHING_CHANGED',
    });
  });

  it("another tenant's release is 404, and its list is its own", async () => {
    await expect(
      releases.release(elsewhere.tenantId, october, FIRST_PAGE, now),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect((await releases.releases(elsewhere.tenantId, FIRST_PAGE)).totalCount).toBe(0);
  });

  it('the publish records its one audit entry on the release', async () => {
    expect(await entriesOf(pools, here.tenantId, 'catalog.release_published', october)).toEqual([
      { subjectKind: 'catalog_release', actorRef: owner.userId },
    ]);
  });
});
