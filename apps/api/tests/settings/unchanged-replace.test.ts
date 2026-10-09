import {
  brandingSettings,
  businessProfile,
  membershipRole,
  proposalTemplateSettings,
  taxRegistration,
  tenant,
  tenantHoliday,
  tenantMembership,
  timelineTemplate,
  trancheTemplate,
  trancheTemplateLine,
} from '@heliogrid/db';
import { FOUNDER_ROLE, ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { eq, type SQL, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Act } from '../../src/common/auth/session-context';
import { DECLARED } from '../../src/common/filters/declared-statuses';
import { seedTenantSettings } from '../../src/modules/settings/settings.admin.repository';
import { TenantRepository } from '../../src/modules/tenant/tenant.repository';
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
 * A whole-value replace sent again (`F4-07`, `F2-22`): a save equal to what is stored answers the
 * stored value and writes, records and moves nothing — no audit entry, no row version, no new
 * authorization version — while a changed save records once. The census holds every `PUT` and
 * `PATCH` route to this proof or to a stated reason, so a new replace route cannot land unjudged.
 */

const [SALES, SURVEY] = ROLE_PRESETS.filter((preset) => preset !== FOUNDER_ROLE) as [
  RolePreset,
  RolePreset,
];

const here = aCompany('Repeat EPC');
const owner = aPerson('Meera Joshi');
const spare = aPerson('Kiran Bhosale');
const spareHere = aMembership(here, spare, [SALES]);
const fixture: Fixture = {
  companies: [here],
  people: [owner, spare],
  memberships: [aMembership(here, owner, [FOUNDER_ROLE]), spareHere],
};

/** What one replace route is sent: its body, the same body again (a set reordered), a changed body. */
type Send = 'first' | 'again' | 'changed';

interface Replace {
  readonly route: string;
  readonly event: string;
  readonly save: (send: Send) => Promise<unknown>;
  /** Every stored row the save could touch, by Postgres row version — a write moves one. */
  readonly rows: () => Promise<readonly string[]>;
}

const NO_REPEAT_TO_PROVE: Readonly<Record<string, string>> = {
  'PUT /catalog/items/:id': 'records every repeat — deferred D163',
  'PUT /catalog/items/:id/override': 'records every repeat — deferred D163',
  'PUT /catalog/imports/:id/mapping': 'an import’s working state; records no entry',
  'PUT /catalog/imports/:id/rows/:rowNumber': 'an import’s working state; records no entry',
  'PUT /notifications/preferences/:group': 'records no entry',
  'PUT /onboarding/progress/:step': 'records no entry',
  'PUT /onboarding/prompt-points/:fact': 'records no entry',
  'PATCH /tenants/me/membership': 'records no entry',
  'PUT /settings/quiet-hours': 'records no entry',
  'PATCH /users/me': 'records no entry',
};

const skip = skipWithoutDatabase(
  'UNCHANGED-REPLACE PROOF',
  'A repeated replace is UNPROVEN in this run — only the route census is.',
);

let pools: ReturnType<typeof openPools>;
let services: ReturnType<typeof settingsServicesOf>;
let tenants: TenantRepository;
let splitId: string;
const by = (): Act => ({ actorUserId: owner.userId, now: Date.now() });

function versionsOf(table: PgTable, where: SQL | undefined): Promise<readonly string[]> {
  return pools.admin.db
    .select({ version: sql<string>`xmin::text` })
    .from(table)
    .where(where)
    .then((rows) => rows.map((row) => row.version).sort());
}

const ofHere = (column: Parameters<typeof eq>[0]) => eq(column, here.tenantId);

const REPLACES: readonly Replace[] = [
  {
    route: 'PUT /settings/business-profile',
    event: 'settings.business_profile_changed',
    save: (send) =>
      services.settings.saveBusinessProfile(
        here.tenantId,
        {
          companyName: 'Repeat Solar Pvt Ltd',
          city: send === 'changed' ? 'Pune' : 'Nagpur',
          segment: 'both',
          typicalSystemKwp: 5.5,
          address: '4 Civil Lines, Nagpur',
          bankDetails: {
            bankName: 'Bank of Nagpur',
            accountName: 'Repeat Solar Pvt Ltd',
            accountNumber: '00123456789',
            bankRoutingIdentifier: 'NAGP0001234',
          },
        },
        by(),
      ),
    rows: async () => [
      ...(await versionsOf(tenant, eq(tenant.id, here.tenantId))),
      ...(await versionsOf(businessProfile, ofHere(businessProfile.tenantId))),
    ],
  },
  {
    route: 'PUT /settings/tax-registrations',
    event: 'settings.tax_registrations_changed',
    save: (send) =>
      services.settings.saveTaxRegistrations(
        here.tenantId,
        {
          registrations:
            send === 'changed' ? [] : [{ registrationType: 'IN_GST', value: '27ABCDE1234F1Z5' }],
        },
        by(),
        'en',
      ),
    rows: () => versionsOf(taxRegistration, ofHere(taxRegistration.tenantId)),
  },
  {
    route: 'PUT /settings/branding',
    event: 'settings.branding_changed',
    save: (send) =>
      services.settings.saveBranding(
        here.tenantId,
        {
          brandColour: send === 'changed' ? null : '#006fff',
          letterhead: { tagline: { en: 'Solar since 2011' }, lines: [], footerNote: null },
        },
        by(),
      ),
    rows: () => versionsOf(brandingSettings, ofHere(brandingSettings.tenantId)),
  },
  {
    route: 'PUT /settings/proposal-template',
    event: 'settings.proposal_template_changed',
    save: (send) =>
      services.templates.saveProposalTemplate(
        here.tenantId,
        {
          cover: null,
          sectionsIncluded: send === 'changed' ? ['system', 'timeline'] : ['system'],
          defaultTerms: { en: { version: 1, blocks: [] } },
        },
        by(),
      ),
    rows: () => versionsOf(proposalTemplateSettings, ofHere(proposalTemplateSettings.tenantId)),
  },
  {
    route: 'PUT /settings/timeline-template',
    event: 'settings.timeline_template_changed',
    save: (send) =>
      services.templates.saveTimelineTemplate(
        here.tenantId,
        {
          phases: [
            {
              name: { en: 'Survey' },
              description: { en: send === 'changed' ? 'We measure.' : 'We visit your roof.' },
            },
          ],
        },
        by(),
      ),
    rows: () => versionsOf(timelineTemplate, ofHere(timelineTemplate.tenantId)),
  },
  {
    route: 'PUT /settings/tranche-templates/:id',
    event: 'settings.tranche_template_changed',
    save: (send) =>
      services.templates.saveTrancheTemplate(
        here.tenantId,
        splitId,
        {
          name: { en: send === 'changed' ? 'Half and half' : 'Even split' },
          lines: [
            { label: { en: 'Advance' }, percent: '50.00', dueOnStage: 'won' },
            { label: { en: 'On handover' }, percent: '50.00', dueOnStage: 'commissioned' },
          ],
        },
        by(),
      ),
    rows: async () => [
      ...(await versionsOf(trancheTemplate, eq(trancheTemplate.id, splitId))),
      ...(await versionsOf(
        trancheTemplateLine,
        eq(trancheTemplateLine.trancheTemplateId, splitId),
      )),
    ],
  },
  {
    route: 'PUT /settings/holidays',
    event: 'settings.holidays_changed',
    save: (send) => {
      const diwali = { date: '2026-11-08', label: 'Diwali' };
      const independence = { date: '2026-08-15', label: 'Independence Day' };
      const holidays = {
        first: [diwali, independence],
        again: [independence, diwali],
        changed: [diwali],
      }[send];
      return services.settings.saveHolidays(here.tenantId, { holidays }, by());
    },
    rows: () => versionsOf(tenantHoliday, ofHere(tenantHoliday.tenantId)),
  },
  {
    route: 'PUT /tenants/me/members/:membershipId/roles',
    event: 'team.roles_changed',
    save: (send) => {
      const roles = { first: [SURVEY, SALES], again: [SALES, SURVEY, SALES], changed: [SALES] }[
        send
      ];
      return tenants.assignRoles(here.tenantId, spareHere.membershipId, roles, by());
    },
    rows: async () => [
      ...(await versionsOf(tenantMembership, eq(tenantMembership.id, spareHere.membershipId))),
      ...(await versionsOf(
        membershipRole,
        eq(membershipRole.membershipId, spareHere.membershipId),
      )),
    ],
  },
];

describe.skipIf(skip)('a replace equal to what is stored, against a migrated database', () => {
  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    await pools.admin.db.transaction((tx) =>
      seedTenantSettings(tx, { tenantId: here.tenantId, now: Date.now() }),
    );
    services = settingsServicesOf(pools);
    tenants = new TenantRepository(pools.tenants);
    const { items } = await services.templates.trancheTemplates(here.tenantId);
    splitId = items[1]?.id ?? '';
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it.each(REPLACES)(
    '$route sent again answers the stored value and writes, records and moves nothing',
    async ({ event, save, rows }) => {
      const recorded = async () => (await entriesOf(pools, here.tenantId, event)).length;
      const before = await recorded();
      const first = await save('first');
      expect(await recorded()).toBe(before + 1);
      const stored = await rows();
      expect(await save('again')).toEqual(first);
      expect(await rows()).toEqual(stored);
      expect(await recorded()).toBe(before + 1);
      await save('changed');
      expect(await recorded()).toBe(before + 2);
    },
  );
});

describe('the replace-route census', () => {
  it('holds every PUT and PATCH route to the repeat proof or to a stated reason', () => {
    const replaces = [...DECLARED.keys()].filter((key) => /^(PUT|PATCH) /.test(key)).sort();
    const judged = [...REPLACES.map(({ route }) => route), ...Object.keys(NO_REPEAT_TO_PROVE)];
    expect(replaces).toEqual(judged.sort());
  });
});
