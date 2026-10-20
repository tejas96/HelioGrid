import { TENANT_SEGMENTS } from '@heliogrid/domain';
import {
  COMPANY_PROFILE,
  COMPANY_PROFILE_PART_TITLE,
  COMPANY_PROFILE_STANDING_WORD,
  createTranslator,
  SETUP_WHAT_YOU_SELL,
  SHELL,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import {
  abortWrites,
  answerWhatYouSell,
  companyProfileAct,
  inviteStep,
  reachCompanyProfileByFinishLater,
} from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';

/**
 * The company profile reached by the step before's `Finish later`, after that step's save failed
 * (`SCR-M01-05`, *arrived-from-a-failed-save*; `M01-23`). The step before is put off, not
 * recorded, so each flow also says what the next visit asks for. The profile's own flows are
 * `company-profile.spec.ts`'s.
 */
const en = await createTranslator('en');

const theProfile = '**/settings/business-profile';
const theStepBefore = '**/onboarding/progress/what_you_sell';

const heading = (page: Page) => page.getByRole('heading', { name: en.t(COMPANY_PROFILE.title) });
const stepBefore = (page: Page) =>
  page.getByRole('heading', { name: en.t(SETUP_WHAT_YOU_SELL.title) });
const shell = (page: Page) => page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) });
const whatYouSell = (page: Page) =>
  page
    .locator('.hg-accordion-toggle')
    .filter({ hasText: en.t(COMPANY_PROFILE_PART_TITLE.declarations) });
const notSavedBefore = (page: Page) => page.getByText(en.t(COMPANY_PROFILE.ledeNotSaved));
const cost = (page: Page) => page.getByText(en.t(COMPANY_PROFILE.marketDefaults));

/** Every write the page sends from here on, in order: a step by its name and state, the rest by address. */
function writesOf(page: Page): string[] {
  const writes: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'PUT') return;
    const { pathname } = new URL(request.url());
    const step = /\/onboarding\/progress\/(\w+)$/.exec(pathname)?.[1];
    writes.push(step === undefined ? pathname : `${step} ${request.postDataJSON().state}`);
  });
  return writes;
}
const THE_PROFILES_WRITE = expect.stringMatching(/\/settings\/business-profile$/);

test('Finish later after answers that were not saved opens the profile, which says so; both answers given there are saved and record both steps', async ({
  page,
}) => {
  await reachCompanyProfileByFinishLater(page, en, freshMobile(), theProfile);
  await expect(notSavedBefore(page)).toBeVisible();
  await expect(whatYouSell(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(whatYouSell(page)).toContainText(en.t(COMPANY_PROFILE_STANDING_WORD.not_declared));
  await expect(cost(page)).toBeVisible();
  await expect(shell(page)).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  await answerWhatYouSell(page, en);
  await expect(notSavedBefore(page)).toHaveCount(0);
  await expect(cost(page)).toHaveCount(0);

  const writes = writesOf(page);
  const saved = page.waitForRequest(
    (request) => request.method() === 'PUT' && request.url().endsWith('/business-profile'),
  );
  await companyProfileAct(page, en).click();
  expect((await saved).postDataJSON()).toMatchObject({
    segment: TENANT_SEGMENTS[0],
    typicalSystemKwp: 5,
  });
  await expect(inviteStep(page, en)).toBeVisible();
  // The answers are stored before their step is recorded, and no registration changed.
  expect(writes).toEqual([
    THE_PROFILES_WRITE,
    'what_you_sell completed',
    'business_profile skipped',
  ]);

  await page.reload();
  await expect(inviteStep(page, en)).toBeVisible();
  await expect(stepBefore(page)).toHaveCount(0);
});

test('the profile saved without the two answers records its own step alone, and the next visit asks what the company sells', async ({
  page,
}) => {
  await reachCompanyProfileByFinishLater(page, en, freshMobile(), theProfile);
  const writes = writesOf(page);
  await companyProfileAct(page, en).click();
  await expect(inviteStep(page, en)).toBeVisible();
  expect(writes).toEqual([THE_PROFILES_WRITE, 'business_profile skipped']);

  await page.reload();
  await expect(stepBefore(page)).toBeVisible();
  await expect(shell(page)).toHaveCount(0);
});

test('when the answers were stored and only their step was not, the profile reads them back, and its save records both steps', async ({
  page,
}) => {
  await reachCompanyProfileByFinishLater(page, en, freshMobile(), theStepBefore);
  await expect(notSavedBefore(page)).toHaveCount(0);
  await expect(whatYouSell(page)).toContainText(en.t(COMPANY_PROFILE_STANDING_WORD.answered));

  const writes = writesOf(page);
  await companyProfileAct(page, en).click();
  await expect(inviteStep(page, en)).toBeVisible();
  expect(writes).toEqual([
    THE_PROFILES_WRITE,
    'what_you_sell completed',
    'business_profile skipped',
  ]);
});

test('after Finish later, Continue without it on a failed profile save opens the invite step with no step recorded', async ({
  page,
}) => {
  await reachCompanyProfileByFinishLater(page, en, freshMobile(), theProfile);
  await abortWrites(page, theProfile);
  const writes = writesOf(page);
  await companyProfileAct(page, en).click();
  await page.getByRole('button', { name: en.t(COMPANY_PROFILE.onwardUnsavedSpoken) }).click();
  await expect(inviteStep(page, en)).toBeVisible();
  expect(writes).toEqual([THE_PROFILES_WRITE]);
  await expect(heading(page)).toHaveCount(0);
});
