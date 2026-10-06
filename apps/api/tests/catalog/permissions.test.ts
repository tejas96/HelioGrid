import { DEFAULT_PAGE_LIMIT, type RoleSet } from '@heliogrid/contracts';
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
  catalogServiceOf,
  noKey,
  preset,
  publishIndiaPack,
  removePlatformItems,
} from './support';

/**
 * Who reads money and who writes (§M01.4, ruling 1A, decision 12; AC-8), against REAL state:
 * Finance reads every price and changes nothing; adding an own SKU is also the add grant's, and
 * that grant alone changes nothing else; a preset without the manage grant sees no money key at
 * all; another tenant's SKU is 404 on every route — never 403.
 */

const run = aRunTag();
const here = aCompany('Grants EPC');
const elsewhere = aCompany('Other Grants EPC');
const owner = aPerson('Asha Kulkarni');
const rival = aPerson('Imran Shaikh');
const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [owner, rival],
  memberships: [
    aMembership(here, owner, [preset.epc_owner]),
    aMembership(elsewhere, rival, [preset.epc_owner]),
  ],
};
const OWNER: RoleSet = [preset.epc_owner];
const FINANCE: RoleSet = [preset.finance];
const SALES: RoleSet = [preset.sales_executive];

const skip = skipWithoutDatabase(
  'CATALOG PERMISSIONS PROOF',
  'Who reads catalog money and who writes is UNPROVEN in this run.',
);

describe.skipIf(skip)('the catalog grants, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let catalog: ReturnType<typeof catalogServiceOf>;
  let priced: string;
  let ownSku: string;
  let rivalSku: string;
  const by = () => actBy(owner.userId);
  const form = (model: string) => ({
    brand: 'Own',
    model,
    spec: aPanelSpec(),
    certifications: [],
    preferred: false,
  });
  const listedAs = async (roles: RoleSet) =>
    (
      await catalog.list(
        here.tenantId,
        roles,
        { q: run, limit: DEFAULT_PAGE_LIMIT, page: 1 },
        Date.now(),
      )
    ).items;

  /** Every write a manage-grant holder may make, on an own SKU or a platform item. */
  const writes = (roles: RoleSet, tenantId: string) => ({
    'edit an own SKU': () => catalog.saveItem(tenantId, roles, ownSku, form(`${run} Own`), by()),
    archive: () => catalog.setArchived(tenantId, roles, ownSku, true, by()),
    unarchive: () => catalog.setArchived(tenantId, roles, ownSku, false, by()),
    'save an override': () =>
      catalog.saveOverride(tenantId, roles, priced, { hidden: false }, noKey, by()),
    'clear an override': () => catalog.clearOverride(tenantId, roles, priced, by()),
    'record a rate': () =>
      catalog.recordRate(tenantId, roles, ownSku, { amount: '1' }, noKey, by()),
  });

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    catalog = catalogServiceOf(pools);
    priced = await aPlatformItem(pools, { model: `${run} Priced`, markets: ['IN'] });
    await catalog.saveOverride(
      here.tenantId,
      OWNER,
      priced,
      { rate: { amount: '7000' } },
      noKey,
      by(),
    );
    ownSku = (await catalog.createItem(here.tenantId, OWNER, form(`${run} Own`), noKey, by())).id;
    rivalSku = (
      await catalog.createItem(
        elsewhere.tenantId,
        OWNER,
        form(`${run} Rival`),
        noKey,
        actBy(rival.userId),
      )
    ).id;
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await removePlatformItems(pools, [priced]);
    await pools.close();
  });

  it('Finance reads the money — the rate and the tax keys — and the history', async () => {
    const [item] = (await listedAs(FINANCE)).filter((one) => one.id === priced);
    expect(item?.rate?.amount).toBe('7000.00');
    expect(item && 'tax' in item).toBe(true);
    const history = await catalog.rateEntries(
      here.tenantId,
      priced,
      { limit: DEFAULT_PAGE_LIMIT, page: 1 },
      Date.now(),
    );
    expect(history.totalCount).toBe(1);
  });

  it.each(Object.keys(writes(FINANCE, here.tenantId)))('Finance is refused: %s', async (act) => {
    const write = writes(FINANCE, here.tenantId)[act as keyof ReturnType<typeof writes>];
    await expect(write()).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Finance cannot add an own SKU either', async () => {
    await expect(
      catalog.createItem(here.tenantId, FINANCE, form(`${run} By finance`), noKey, by()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('the add grant alone adds an own SKU, and is refused the override', async () => {
    const made = await catalog.createItem(
      here.tenantId,
      SALES,
      form(`${run} By sales`),
      noKey,
      by(),
    );
    expect(made.source).toBe('own_item');
    await expect(writes(SALES, here.tenantId)['save an override']()).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it.each([
    ['the add grant alone', SALES],
    ["Finance's limited cell", FINANCE],
  ])('%s cannot put a price on an add, and nothing is written', async (_, roles) => {
    const model = `${run} Priced by ${roles.join()}`;
    const attempt = catalog.createItem(
      here.tenantId,
      roles,
      { ...form(model), rate: { amount: '100' } },
      noKey,
      by(),
    );
    await expect(attempt).rejects.toBeInstanceOf(ForbiddenException);
    const listed = await listedAs(OWNER);
    expect(listed.filter((item) => item.model === model)).toEqual([]);
  });

  it('a preset without the manage grant sees no money key at all — not even null', async () => {
    const items = await listedAs(SALES);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect('rate' in item).toBe(false);
      expect('tax' in item).toBe(false);
    }
  });

  it.each([
    ['read it', () => catalog.item(elsewhere.tenantId, OWNER, ownSku, Date.now())],
    [
      'read its history',
      () =>
        catalog.rateEntries(
          elsewhere.tenantId,
          ownSku,
          { limit: DEFAULT_PAGE_LIMIT, page: 1 },
          Date.now(),
        ),
    ],
    ...Object.entries(writes(OWNER, elsewhere.tenantId)).filter(
      ([act]) => !act.includes('override'),
    ),
    [
      'put an override on it',
      () =>
        catalog.saveOverride(
          elsewhere.tenantId,
          OWNER,
          ownSku,
          { hidden: true },
          noKey,
          actBy(rival.userId),
        ),
    ],
    [
      'clear an override on it',
      () => catalog.clearOverride(elsewhere.tenantId, OWNER, ownSku, actBy(rival.userId)),
    ],
  ])("another tenant's own SKU is 404 when they try to %s", async (_, attempt) => {
    await expect(attempt()).rejects.toBeInstanceOf(NotFoundException);
  });

  it("this tenant's own SKU is untouched by those attempts", async () => {
    const mine = await catalog.item(here.tenantId, OWNER, ownSku, Date.now());
    expect([mine.archived, mine.rate]).toEqual([false, null]);
    expect(rivalSku).not.toBe(ownSku);
  });
});
