import { FOUNDER_ROLE } from '@heliogrid/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Act } from '../../src/common/auth/session-context';
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
import { entriesOf, publishIndiaPack, settingsServicesOf } from './support';

/**
 * Bank details typed half way, against REAL state (`M06-17`, `M01-31`): the half is kept on the
 * profile's own read and never on what a document reads; a save that never names it keeps it;
 * whole bank details replace it; and a save equal to what is stored records nothing.
 */

const here = aCompany('Half Bank EPC');
const owner = aPerson('Meera Kulkarni');
const fixture: Fixture = {
  companies: [here],
  people: [owner],
  memberships: [aMembership(here, owner, [FOUNDER_ROLE])],
};

const skip = skipWithoutDatabase(
  'BANK-DETAILS-TYPED PROOF',
  'Keeping bank details typed half way is UNPROVEN in this run — only its pure rules are.',
);

describe.skipIf(skip)('bank details typed half way, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let settings: ReturnType<typeof settingsServicesOf>['settings'];
  const by = (): Act => ({ actorUserId: owner.userId, now: Date.now() });
  const saves = () => entriesOf(pools, here.tenantId, 'settings.business_profile_changed');

  const half = {
    bankName: 'HDFC Bank',
    accountName: null,
    accountNumber: '5010',
    bankRoutingIdentifier: null,
  };
  const whole = {
    bankName: 'HDFC Bank',
    accountName: 'Half Bank EPC',
    accountNumber: '50100123454821',
    bankRoutingIdentifier: 'HDFC0001234',
  };

  /** A company with the half stored and no whole bank details, whatever case ran before. */
  const typeTheHalf = async () => {
    const read = await settings.businessProfile(here.tenantId);
    const typed = { ...read, bankDetails: null, bankDetailsTyped: half };
    return settings.saveBusinessProfile(here.tenantId, typed, by());
  };

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    ({ settings } = settingsServicesOf(pools));
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('reads no half on a company that never typed one', async () => {
    expect((await settings.businessProfile(here.tenantId)).bankDetailsTyped).toBeNull();
  });

  it('keeps a half on the profile’s own read, and off what a document reads', async () => {
    const read = await settings.businessProfile(here.tenantId);
    const typed = { ...read, bankDetailsTyped: half };
    expect(await settings.saveBusinessProfile(here.tenantId, typed, by())).toEqual(typed);
    expect(await settings.businessProfile(here.tenantId)).toEqual(typed);

    const effective = await settings.effective(here.tenantId);
    expect(effective.companyIdentity.value).not.toHaveProperty('bankDetailsTyped');
    expect(effective.companyIdentity.value.bankDetails).toBeNull();
    expect(effective.companyIdentity.source).toBe('platform');
    expect(effective.pendingPromptPoints).toContain('bank_details');
  });

  it('keeps the half a save never names — a client built before the field — and records the one change', async () => {
    await typeTheHalf();
    const { bankDetailsTyped: _unread, ...asAnOlderClientRead } = await settings.businessProfile(
      here.tenantId,
    );
    const moved = { ...asAnOlderClientRead, address: '12 FC Road, Pune' };
    const before = (await saves()).length;
    expect(await settings.saveBusinessProfile(here.tenantId, moved, by())).toEqual({
      ...moved,
      bankDetailsTyped: half,
    });
    expect(await saves()).toHaveLength(before + 1);
  });

  it('writes and records nothing for a save equal to what is stored', async () => {
    const stored = await typeTheHalf();
    const before = (await saves()).length;
    expect(await settings.saveBusinessProfile(here.tenantId, stored, by())).toEqual(stored);
    expect(await saves()).toHaveLength(before);
  });

  it('clears the half when told', async () => {
    const stored = await typeTheHalf();
    const cleared = { ...stored, bankDetailsTyped: null };
    expect(await settings.saveBusinessProfile(here.tenantId, cleared, by())).toEqual(cleared);
    expect((await settings.businessProfile(here.tenantId)).bankDetailsTyped).toBeNull();
  });

  it('replaces the half with whole bank details, even from a save that never names the half', async () => {
    const { bankDetailsTyped: _unread, ...unnamed } = await typeTheHalf();

    const saved = await settings.saveBusinessProfile(
      here.tenantId,
      { ...unnamed, bankDetails: whole },
      by(),
    );

    expect(saved).toMatchObject({ bankDetails: whole, bankDetailsTyped: null });
    expect(await settings.businessProfile(here.tenantId)).toEqual(saved);
    const effective = await settings.effective(here.tenantId);
    expect(effective.companyIdentity.value.bankDetails).toEqual(whole);
    expect(effective.pendingPromptPoints).not.toContain('bank_details');
  });
});
