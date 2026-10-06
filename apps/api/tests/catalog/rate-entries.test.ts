import { DEFAULT_PAGE_LIMIT } from '@heliogrid/contracts';
import { localDate } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ContractException } from '../../src/common/errors/contract-exception';
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
  catalogServiceOf,
  entriesOf,
  ledgerOf,
  noKey,
  preset,
  publishIndiaPack,
  removePlatformItems,
} from './support';

/**
 * A price change is a new dated entry, never an edit (`M01-44`, AC-3), against REAL state: one
 * append adds one row and leaves the earlier one byte-identical; the rate on the earlier day is
 * still the earlier amount; a day before today is refused (b4); a fraction of a paisa is refused;
 * each append records one `catalog.rate_recorded` (AC-10).
 */

const DAY_MS = 86_400_000;
const DAYS_AHEAD = 3;
const here = aCompany('Ledger EPC');
const owner = aPerson('Asha Kulkarni');
const fixture: Fixture = {
  companies: [here],
  people: [owner],
  memberships: [aMembership(here, owner, [preset.epc_owner])],
};
const OWNER = [preset.epc_owner];
const TZ = 'Asia/Kolkata';

const skip = skipWithoutDatabase(
  'CATALOG RATE-LEDGER PROOF',
  'That a price change keeps every earlier rate is UNPROVEN in this run.',
);

describe.skipIf(skip)('the rate ledger, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let catalog: ReturnType<typeof catalogServiceOf>;
  let sku: string;
  let platformItem: string;
  const now = Date.now();
  const later = now + DAYS_AHEAD * DAY_MS;
  const today = localDate(now, TZ);
  const laterDay = localDate(later, TZ);

  const rateOn = async (id: string, instant: number) =>
    (await catalog.item(here.tenantId, OWNER, id, instant)).rate;

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    catalog = catalogServiceOf(pools);
    platformItem = await aPlatformItem(pools, { model: `${aRunTag()} Ledger`, markets: ['IN'] });
    sku = (
      await catalog.createItem(
        here.tenantId,
        OWNER,
        {
          brand: 'Own',
          model: 'Ledger SKU',
          spec: aPanelSpec(),
          certifications: [],
          preferred: false,
        },
        noKey,
        actBy(owner.userId, now),
      )
    ).id;
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await removePlatformItems(pools, [platformItem]);
    await pools.close();
  });

  it('an own SKU with no entry has no rate, and is still listed', async () => {
    expect(await rateOn(sku, now)).toBeNull();
  });

  it('a change appends one row, the earlier row is byte-identical, and each day names its own rate', async () => {
    await catalog.recordRate(
      here.tenantId,
      OWNER,
      sku,
      { amount: '14500.00' },
      noKey,
      actBy(owner.userId, now),
    );
    const [first] = await ledgerOf(pools, here.tenantId);
    await catalog.recordRate(
      here.tenantId,
      OWNER,
      sku,
      { amount: '13900.5', effectiveOn: laterDay },
      noKey,
      actBy(owner.userId, now),
    );
    const ledger = await ledgerOf(pools, here.tenantId);
    expect(ledger).toHaveLength(2);
    expect(ledger[0]).toEqual(first);
    expect(await rateOn(sku, now)).toEqual({
      source: 'own_item',
      amount: '14500.00',
      currencyCode: 'INR',
      effectiveOn: today,
    });
    expect((await rateOn(sku, later))?.amount).toBe('13900.50');
  });

  it("a platform item's first rate makes its override and lands on it", async () => {
    await catalog.recordRate(
      here.tenantId,
      OWNER,
      platformItem,
      { amount: '9000' },
      noKey,
      actBy(owner.userId, now),
    );
    expect(await rateOn(platformItem, now)).toMatchObject({
      source: 'override',
      amount: '9000.00',
    });
  });

  it('a cleared rate is a dated absence, and the history keeps every entry newest first', async () => {
    await catalog.recordRate(
      here.tenantId,
      OWNER,
      platformItem,
      { amount: null, effectiveOn: laterDay },
      noKey,
      actBy(owner.userId, now),
    );
    expect(await rateOn(platformItem, later)).toBeNull();
    const history = await catalog.rateEntries(
      here.tenantId,
      platformItem,
      { limit: DEFAULT_PAGE_LIMIT, page: 1 },
      now,
    );
    expect(history.items.map((entry) => [entry.amount, entry.effectiveOn])).toEqual([
      [null, laterDay],
      ['9000.00', today],
    ]);
    expect(history.totalCount).toBe(2);
  });

  it.each([
    [
      'a day before today',
      { amount: '100', effectiveOn: localDate(now - DAY_MS, TZ) },
      HttpStatus.UNPROCESSABLE_ENTITY,
      'effectiveOn',
    ],
    ['a fraction of a paisa', { amount: '100.001' }, HttpStatus.BAD_REQUEST, 'amount'],
    [
      'more whole digits than the ledger holds',
      { amount: '999999999999' },
      HttpStatus.BAD_REQUEST,
      'amount',
    ],
  ])('refuses %s at its field and writes nothing', async (_, body, status, path) => {
    const before = await ledgerOf(pools, here.tenantId);
    const refusal = await catalog
      .recordRate(here.tenantId, OWNER, sku, body, noKey, actBy(owner.userId, now))
      .catch((error: unknown) => error);
    expect(refusal).toBeInstanceOf(ContractException);
    expect((refusal as ContractException).getStatus()).toBe(status);
    expect((refusal as ContractException).details?.[0]?.path).toBe(path);
    expect(await ledgerOf(pools, here.tenantId)).toEqual(before);
  });

  it('records each append once, under its own subject', async () => {
    const onSku = await entriesOf(pools, here.tenantId, 'catalog.rate_recorded', sku);
    const onPlatform = await entriesOf(pools, here.tenantId, 'catalog.rate_recorded', platformItem);
    expect(onSku.map((entry) => entry.subjectKind)).toEqual([
      'tenant_catalog_item',
      'tenant_catalog_item',
    ]);
    expect(onPlatform.map((entry) => entry.subjectKind)).toEqual(['catalog_item', 'catalog_item']);
  });
});
