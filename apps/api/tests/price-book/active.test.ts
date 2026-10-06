import { DEFAULT_PAGE_LIMIT, type RoleSet } from '@heliogrid/contracts';
import { NotFoundException } from '@nestjs/common';
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
import { actBy, aRateSet, noKey, preset, priceBookServiceOf, publishIndiaPack } from './support';

/**
 * The rate card in force (§M01.5, AC-2, AC-4, AC-8), against REAL state: before a company's first
 * publish it reads no version, no rates and the platform default margin, and that publish is
 * version 1 (owner ruling 1A); after it, the read names the newest version a draft compares its
 * pin against; a rate's name keeps every language its author wrote; another company's version is
 * not found, never forbidden.
 */

const here = aCompany('Rate Card EPC');
const elsewhere = aCompany('Other Rate Card EPC');
const owner = aPerson('Anjali Kulkarni');
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
const FIRST_PAGE = { limit: DEFAULT_PAGE_LIMIT, page: 1 };

const skip = skipWithoutDatabase(
  'PRICE BOOK ACTIVE PROOF',
  'Which version is in force, and whose it is, is UNPROVEN in this run.',
);

describe.skipIf(skip)('the price book in force, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let book: ReturnType<typeof priceBookServiceOf>;
  const publishAt = (tenantId: string, userId: string, note: string) =>
    book.publish(tenantId, OWNER, aRateSet({ note }), noKey, actBy(userId));

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

  it('a new company reads no version, no rates and the platform default margin; its first publish is version 1', async () => {
    expect(await book.active(here.tenantId, Date.now())).toEqual({
      version: null,
      defaultMarginPct: '18.00',
      currencyCode: 'INR',
      rates: [],
    });
    expect((await book.versions(here.tenantId, FIRST_PAGE)).totalCount).toBe(0);

    expect((await publishAt(here.tenantId, owner.userId, 'Our first rate card.')).number).toBe(1);
  });

  it('the active read names the id and number of the newest version', async () => {
    const newest = await publishAt(here.tenantId, owner.userId, 'Scaffolding added.');

    const active = await book.active(here.tenantId, Date.now());
    expect(active.version).toMatchObject({
      id: newest.id,
      number: newest.number,
      note: 'Scaffolding added.',
      publishedBy: { id: owner.userId, name: owner.name },
    });
    expect(active.rates).toEqual(
      aRateSet().rates.map((rate) => ({ ...rate, amount: `${rate.amount}.00` })),
    );
  });

  it('a rate’s name keeps every language its author wrote', async () => {
    const name = { en: 'Site survey visit', hi: 'साइट सर्वे विज़िट' };
    await book.publish(
      here.tenantId,
      OWNER,
      aRateSet({ rates: [{ name, basis: 'per_visit', amount: '1200' }] }),
      noKey,
      actBy(owner.userId),
    );

    expect((await book.active(here.tenantId, Date.now())).rates.map((rate) => rate.name)).toEqual([
      name,
    ]);
  });

  it('another company’s version is not found', async () => {
    const theirs = await publishAt(elsewhere.tenantId, rival.userId, 'Their rates.');

    await expect(book.version(here.tenantId, theirs.id, Date.now())).rejects.toBeInstanceOf(
      NotFoundException,
    );
    const ours = await book.versions(here.tenantId, FIRST_PAGE);
    expect(ours.items.map((version) => version.id)).not.toContain(theirs.id);
    expect((await book.active(here.tenantId, Date.now())).version?.id).not.toBe(theirs.id);
  });
});
