import { FOUNDER_ROLE, ONBOARDING_STEPS } from '@heliogrid/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SettingsOnboardingRepository } from '../../src/modules/settings/settings.onboarding.repository';
import { SettingsOnboardingService } from '../../src/modules/settings/settings.onboarding.service';
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
 * The setup corridor against REAL state (`M01-10`, `M01-29`): a company with no row resumes at
 * the first step, each answer moves the resume point as the sequence says, and a prompt-point
 * lives once — fired, then answered — with a second fire refused. The transitions are proven
 * pure in `packages/domain/tests/tenancy/onboarding-steps.test.ts`.
 */

const here = aCompany('Corridor EPC');
const owner = aPerson('Vikram Nair');
const fixture: Fixture = {
  companies: [here],
  people: [owner],
  memberships: [aMembership(here, owner, [FOUNDER_ROLE])],
};

const skip = skipWithoutDatabase(
  'ONBOARDING-PROGRESS PROOF',
  'The setup corridor is UNPROVEN in this run — only its pure transitions are.',
);

describe.skipIf(skip)('the setup corridor, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let onboarding: SettingsOnboardingService;

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    onboarding = new SettingsOnboardingService(
      new SettingsOnboardingRepository(pools.runtime.db),
      new SettingsRepository(pools.runtime.db),
    );
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('reads a company with no row as fresh: the first step, every fact still owed', async () => {
    expect(await onboarding.progress(here.tenantId)).toEqual({
      resumeStep: ONBOARDING_STEPS[0],
      steps: {},
      promptPoints: {},
      pendingPromptPoints: ['company_profile', 'payment_terms', 'bank_details'],
    });
  });

  it('moves the resume point as steps are answered, and closes the corridor after the last', async () => {
    const [first, second] = ONBOARDING_STEPS;
    const after = await onboarding.recordStep(here.tenantId, first, 'completed', Date.now());
    expect(after.resumeStep).toBe(second);
    let latest = after;
    for (const step of ONBOARDING_STEPS.slice(1)) {
      latest = await onboarding.recordStep(here.tenantId, step, 'skipped', Date.now());
    }
    expect(latest.resumeStep).toBeNull();
    expect(latest.steps).toEqual({
      language: 'completed',
      what_you_sell: 'skipped',
      business_profile: 'skipped',
      invite_team: 'skipped',
      ready: 'skipped',
    });
  });

  it('fires a prompt-point once, refuses a second fire, then takes one answer and no other', async () => {
    const fired = await onboarding.promptPoint(here.tenantId, 'bank_details', 'fired', Date.now());
    expect(fired.promptPoints).toEqual({ bank_details: 'fired' });
    expect(fired.pendingPromptPoints).toEqual(['company_profile', 'payment_terms']);
    await expect(
      onboarding.promptPoint(here.tenantId, 'bank_details', 'fired', Date.now()),
    ).rejects.toThrow('This prompt has already been shown once.');
    const declined = await onboarding.promptPoint(
      here.tenantId,
      'bank_details',
      'declined',
      Date.now(),
    );
    expect(declined.promptPoints).toEqual({ bank_details: 'declined' });
    await expect(
      onboarding.promptPoint(here.tenantId, 'bank_details', 'completed', Date.now()),
    ).rejects.toThrow('This prompt was already answered.');
    await expect(
      onboarding.promptPoint(here.tenantId, 'catalog', 'completed', Date.now()),
    ).rejects.toThrow('This prompt has not been shown yet.');
  });
});
