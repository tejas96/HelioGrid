import {
  businessProfile,
  onboardingProgress,
  trancheTemplate,
  trancheTemplateLine,
} from '@heliogrid/db';
import { allocationVerdict, basisPoints, ONBOARDING_STEPS } from '@heliogrid/domain';
import { asc, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedTenantSettings } from '../../src/modules/settings/settings.admin.repository';
import { TenantAdminRepository } from '../../src/modules/tenant/tenant.admin.repository';
import {
  aPerson,
  type Company,
  type Fixture,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';

/**
 * The seed at tenant creation (`M01-28`, `M01-54`), through the REAL signup transaction: a new
 * company holds its corridor row at the first step, one empty profile, and the two standard
 * splits with exactly one default whose lines total the whole — and a second seed for the same
 * company lands nothing twice.
 */

const founder = aPerson('Anil Patil');
const fixture: Fixture = { companies: [], people: [founder], memberships: [] };

const skip = skipWithoutDatabase(
  'TENANT-SEED PROOF',
  'The settings seed is UNPROVEN in this run — only the defaults it copies are.',
);

describe.skipIf(skip)(
  'the settings seed inside company signup, against a migrated database',
  () => {
    let pools: ReturnType<typeof openPools>;
    let created: Company;

    beforeAll(async () => {
      pools = openPools();
      await seed(pools.admin.db, fixture);
      const row = await new TenantAdminRepository(pools.admin.db).createWithOwner({
        companyName: 'Fresh EPC',
        city: 'Nashik',
        marketCode: 'IN',
        currencyCode: 'INR',
        defaultLanguage: 'en',
        timezone: 'Asia/Kolkata',
        ownerUserId: founder.userId,
        ownerName: founder.name,
        now: Date.now(),
      });
      created = { tenantId: row.id, companyName: row.companyName };
    });

    afterAll(async () => {
      await unseed(pools.admin.db, { ...fixture, companies: [created] });
      await pools.close();
    });

    it('holds exactly the seeded rows: the corridor at its first step, an empty profile, two splits with one default', async () => {
      const [progress] = await pools.admin.db
        .select()
        .from(onboardingProgress)
        .where(eq(onboardingProgress.tenantId, created.tenantId));
      expect(progress).toMatchObject({
        resumeStep: ONBOARDING_STEPS[0],
        stepStates: {},
        promptPointStates: {},
      });
      const profiles = await pools.admin.db
        .select()
        .from(businessProfile)
        .where(eq(businessProfile.tenantId, created.tenantId));
      expect(profiles).toHaveLength(1);
      expect(profiles[0]).toMatchObject({ address: null, bankDetails: null });
      const templates = await templatesOf();
      expect(templates.map((template) => [template.isDefault, template.archived])).toEqual([
        [true, false],
        [false, false],
      ]);
    });

    it('seeds the default split whole — its lines total 100.00 — and the other too', async () => {
      for (const template of await templatesOf()) {
        const lines = await pools.admin.db
          .select({ share: trancheTemplateLine.shareBasisPoints })
          .from(trancheTemplateLine)
          .where(eq(trancheTemplateLine.trancheTemplateId, template.id))
          .orderBy(asc(trancheTemplateLine.position));
        expect(allocationVerdict(lines.map((line) => basisPoints(line.share))).state).toBe('met');
      }
    });

    it('seeds nothing twice: a second seed for the same company changes no count', async () => {
      const before = await counts();
      await pools.admin.db.transaction((tx) =>
        seedTenantSettings(tx, { tenantId: created.tenantId, now: Date.now() }),
      );
      expect(await counts()).toEqual(before);
    });

    async function templatesOf() {
      return pools.admin.db
        .select({
          id: trancheTemplate.id,
          isDefault: trancheTemplate.isDefault,
          archived: trancheTemplate.archived,
        })
        .from(trancheTemplate)
        .where(eq(trancheTemplate.tenantId, created.tenantId))
        .orderBy(asc(trancheTemplate.createdAt), asc(trancheTemplate.id));
    }

    async function counts() {
      const templates = await templatesOf();
      const lines = await pools.admin.db
        .select({ id: trancheTemplateLine.id })
        .from(trancheTemplateLine)
        .where(eq(trancheTemplateLine.tenantId, created.tenantId));
      const profiles = await pools.admin.db
        .select({ id: businessProfile.id })
        .from(businessProfile)
        .where(eq(businessProfile.tenantId, created.tenantId));
      return { templates: templates.length, lines: lines.length, profiles: profiles.length };
    }
  },
);
