import {
  DEFAULT_TIMELINE_PHASES,
  FOUNDER_ROLE,
  IN_FORMATS,
  resolveEffectiveSettings,
  STANDARD_TRANCHE_TEMPLATES,
} from '@heliogrid/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedTenantSettings } from '../../src/modules/settings/settings.admin.repository';
import { SettingsRepository } from '../../src/modules/settings/settings.repository';
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

/**
 * The effective read against REAL rows (`M01-28`, `M01-53`): a company with no settings rows
 * at all resolves every setting to its platform default, marked so, and the seeded company reads
 * the platform split through its own row. The resolver's decisions are proven pure in
 * `packages/domain/tests/commerce/effective-settings.test.ts`; what only a database can show is
 * that the one read gathers every row and that absence reads as a state, never as an error.
 */

const bare = aCompany('Bare EPC');
const seeded = aCompany('Seeded EPC');
const owner = aPerson('Meera Joshi');

const fixture: Fixture = {
  companies: [bare, seeded],
  people: [owner],
  memberships: [
    aMembership(bare, owner, [FOUNDER_ROLE]),
    aMembership(seeded, owner, [FOUNDER_ROLE]),
  ],
};

const skip = skipWithoutDatabase(
  'EFFECTIVE-SETTINGS PROOF',
  'The effective read is UNPROVEN in this run — only its pure resolver is.',
);

describe.skipIf(skip)('the effective settings read, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let settings: SettingsRepository;

  beforeAll(async () => {
    pools = openPools();
    settings = new SettingsRepository(pools.runtime.db);
    await seed(pools.admin.db, fixture);
    await pools.admin.db.transaction((tx) =>
      seedTenantSettings(tx, { tenantId: seeded.tenantId, now: Date.now() }),
    );
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('resolves a company with no settings rows to the platform everywhere, nothing undefined', async () => {
    const read = await settings.everything(bare.tenantId);
    if (read === null) throw new Error('the bare company is not visible to its own session');
    const { marketCode, ...tenant } = read.tenant;
    expect(marketCode).toBe('IN');
    const effective = resolveEffectiveSettings({ formats: IN_FORMATS, ...read, tenant });
    for (const [name, setting] of Object.entries(effective)) {
      expect(setting, name).toBeDefined();
    }
    expect(effective.companyIdentity).toEqual({
      source: 'platform',
      value: {
        companyName: bare.companyName,
        city: 'Pune',
        segment: null,
        typicalSystemKwp: null,
        defaultLanguage: 'en',
        timezone: IN_FORMATS.timeZone,
        address: null,
        bankDetails: null,
      },
    });
    expect(effective.taxRegistrations).toEqual({ source: 'platform', value: [] });
    expect(effective.branding.source).toBe('platform');
    expect(effective.proposalTemplate.source).toBe('platform');
    expect(effective.timelineTemplate).toEqual({
      source: 'platform',
      value: { phases: DEFAULT_TIMELINE_PHASES },
    });
    expect(effective.defaultTrancheTemplate.source).toBe('platform');
    expect(effective.defaultTrancheTemplate.value.id).toBeNull();
    expect(effective.holidays).toEqual({ source: 'platform', value: [] });
    expect(effective.locale.source).toBe('platform');
  });

  it('carries the timeline, the default split, the terms and the bank details for a company that never opened settings — the bank details absent, their prompt-point pending', async () => {
    const read = await settings.everything(seeded.tenantId);
    if (read === null) throw new Error('the seeded company is not visible to its own session');
    const { marketCode: _market, ...tenant } = read.tenant;
    const effective = resolveEffectiveSettings({ formats: IN_FORMATS, ...read, tenant });
    expect(effective.timelineTemplate.value.phases.length).toBeGreaterThan(0);
    expect(effective.proposalTemplate.value.defaultTerms.en.blocks.length).toBeGreaterThan(0);
    expect(effective.defaultTrancheTemplate.source).toBe('platform');
    expect(effective.defaultTrancheTemplate.value.id).not.toBeNull();
    expect(effective.defaultTrancheTemplate.value.lines).toEqual(
      STANDARD_TRANCHE_TEMPLATES[0].lines,
    );
    expect(effective.companyIdentity.value.bankDetails).toBeNull();
    expect(effective.pendingPromptPoints).toEqual([
      'company_profile',
      'payment_terms',
      'bank_details',
    ]);
  });
});
