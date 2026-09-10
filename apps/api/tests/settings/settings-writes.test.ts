import { tenant } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Act } from '../../src/common/auth/session-context';
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
import { entriesOf, publishIndiaPack, settingsServicesOf } from './support';

/**
 * The settings writes against REAL state (`M01-25`, `M01-31`, `M01-50`, `M01-59`, `F2-22`): a
 * malformed registration is refused with the market's format sentence in the reader's language
 * and nothing lands; a brand colour is never refused and comes back with its shades; the
 * calendar and the registrations are replaced whole; the profile lands on both its rows in one
 * write; and every write leaves exactly one entry while a refused one leaves none.
 */

const here = aCompany('Writes EPC');
const owner = aPerson('Sunita Deshpande');
const fixture: Fixture = {
  companies: [here],
  people: [owner],
  memberships: [aMembership(here, owner, [FOUNDER_ROLE])],
};

const skip = skipWithoutDatabase(
  'SETTINGS-WRITES PROOF',
  'The settings writes are UNPROVEN in this run — only their pure rules are.',
);

describe.skipIf(skip)('the settings writes, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let settings: ReturnType<typeof settingsServicesOf>['settings'];
  let templates: ReturnType<typeof settingsServicesOf>['templates'];
  const by = (): Act => ({ actorUserId: owner.userId, now: Date.now() });

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    ({ settings, templates } = settingsServicesOf(pools));
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('refuses a malformed registration with the market’s format on the field, in Marathi, and writes nothing', async () => {
    const attempt = settings.saveTaxRegistrations(
      here.tenantId,
      { registrations: [{ registrationType: 'IN_GST', value: '27ABCDE1234F1Z' }] },
      by(),
      'mr',
    );
    await expect(attempt).rejects.toBeInstanceOf(ContractException);
    await expect(attempt).rejects.toMatchObject({
      code: 'TAX_REGISTRATION_MALFORMED',
      details: [{ path: 'registrations.0.value', issue: expect.stringContaining('15 अक्षरे') }],
    });
    expect((await settings.taxRegistrations(here.tenantId)).registrations).toEqual([]);
    expect(
      await entriesOf(pools, here.tenantId, 'settings.tax_registrations_changed'),
    ).toHaveLength(0);
  });

  it('refuses a type this market never declared', async () => {
    await expect(
      settings.saveTaxRegistrations(
        here.tenantId,
        { registrations: [{ registrationType: 'IN_PAN', value: 'ABCDE1234F' }] },
        by(),
        'en',
      ),
    ).rejects.toMatchObject({ code: 'DOMAIN_RULE_VIOLATION' });
  });

  it('stores a well-formed registration, replaces the list whole, and records each change once', async () => {
    const stored = await settings.saveTaxRegistrations(
      here.tenantId,
      { registrations: [{ registrationType: 'IN_GST', value: '27ABCDE1234F1Z5' }] },
      by(),
      'en',
    );
    expect(stored.registrations).toEqual([
      { registrationType: 'IN_GST', value: '27ABCDE1234F1Z5' },
    ]);
    const emptied = await settings.saveTaxRegistrations(
      here.tenantId,
      { registrations: [] },
      by(),
      'en',
    );
    expect(emptied.registrations).toEqual([]);
    expect(
      await entriesOf(pools, here.tenantId, 'settings.tax_registrations_changed'),
    ).toHaveLength(2);
  });

  it('never refuses a brand colour: the answer rides back with the save, derived, not stored', async () => {
    const saved = await settings.saveBranding(
      here.tenantId,
      { brandColour: '#006fff', letterhead: null },
      by(),
    );
    expect(saved.shades).toMatchObject({ brand: '#006FFF', whiteOnBrand: false });
    expect(saved.shades?.ink).not.toBe('#006FFF');
    const cleared = await settings.saveBranding(
      here.tenantId,
      {
        brandColour: null,
        letterhead: { tagline: { en: 'Solar since 2011' }, lines: [], footerNote: null },
      },
      by(),
    );
    expect(cleared).toMatchObject({ brandColour: null, shades: null });
    expect((await settings.branding(here.tenantId)).letterhead?.tagline).toEqual({
      en: 'Solar since 2011',
    });
    expect(await entriesOf(pools, here.tenantId, 'settings.branding_changed')).toHaveLength(2);
  });

  it('replaces the tenant’s holidays whole and leaves them in the effective calendar', async () => {
    await settings.saveHolidays(
      here.tenantId,
      {
        holidays: [
          { date: '2026-11-08', label: 'Diwali' },
          { date: '2026-08-15', label: 'Independence Day' },
        ],
      },
      by(),
    );
    const kept = await settings.saveHolidays(
      here.tenantId,
      { holidays: [{ date: '2026-11-08', label: 'Diwali holiday' }] },
      by(),
    );
    expect(kept.holidays).toEqual([{ date: '2026-11-08', label: 'Diwali holiday' }]);
    expect((await settings.effective(here.tenantId)).holidays).toEqual({
      source: 'tenant',
      value: ['2026-11-08'],
    });
    expect(await entriesOf(pools, here.tenantId, 'settings.holidays_changed')).toHaveLength(2);
  });

  it('saves the profile on both its rows in one write — the company facts on the tenant, the rest on its row — with one entry', async () => {
    const profile = {
      companyName: 'Writes Solar Pvt Ltd',
      city: 'Nagpur',
      segment: 'both' as const,
      typicalSystemKwp: 5.5,
      address: '4 Civil Lines, Nagpur',
      bankDetails: {
        bankName: 'Bank of Nagpur',
        accountName: 'Writes Solar Pvt Ltd',
        accountNumber: '00123456789',
        bankRoutingIdentifier: 'NAGP0001234',
      },
    };
    expect(await settings.saveBusinessProfile(here.tenantId, profile, by())).toEqual(profile);
    const [row] = await pools.admin.db
      .select({
        companyName: tenant.companyName,
        segment: tenant.segment,
        kwp: tenant.typicalSystemKwp,
      })
      .from(tenant)
      .where(eq(tenant.id, here.tenantId));
    expect(row).toEqual({ companyName: 'Writes Solar Pvt Ltd', segment: 'both', kwp: '5.50' });
    expect(await settings.businessProfile(here.tenantId)).toEqual(profile);
    expect(await entriesOf(pools, here.tenantId, 'settings.business_profile_changed')).toHaveLength(
      1,
    );
    const effective = await settings.effective(here.tenantId);
    expect(effective.companyIdentity.source).toBe('tenant');
    expect(effective.pendingPromptPoints).toEqual(['payment_terms']);
  });

  it('keeps the terms in a proposal template whatever the list said, and records the two template writes', async () => {
    const saved = await templates.saveProposalTemplate(
      here.tenantId,
      {
        cover: null,
        sectionsIncluded: ['system'],
        defaultTerms: { en: { version: 1, blocks: [] } },
      },
      by(),
    );
    expect(saved.sectionsIncluded).toEqual(['system', 'terms']);
    const timeline = await templates.saveTimelineTemplate(
      here.tenantId,
      { phases: [{ name: { en: 'Survey' }, description: { en: 'We visit your roof.' } }] },
      by(),
    );
    expect(timeline.phases).toHaveLength(1);
    expect((await templates.timelineTemplate(here.tenantId)).phases).toEqual(timeline.phases);
    expect(
      await entriesOf(pools, here.tenantId, 'settings.proposal_template_changed'),
    ).toHaveLength(1);
    expect(
      await entriesOf(pools, here.tenantId, 'settings.timeline_template_changed'),
    ).toHaveLength(1);
  });
});
