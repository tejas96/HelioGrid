import { can, RESEND_SECONDS, ROLE_PRESETS } from '@heliogrid/domain';
import {
  createTranslator,
  LANGUAGE_META,
  SETUP_LANGUAGE,
  SHELL,
  SIGN_IN,
  type Translator,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { passLanguageStep, reachLanguageStep, requestCode, typeCode } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * The language step a new owner meets once, straight after the company is made (`SCR-M01-03`,
 * `F3-03`). It has no address of its own: the inside group's gate draws it where the shell would
 * be, so this file is named for the screen and holds no look — the step's measures are
 * `components/SetupLanguage.spec.tsx`'s.
 */
const en = await createTranslator('en');

const heading = (page: Page, t: Translator) =>
  page.getByRole('heading', { name: t.t(SETUP_LANGUAGE.title) });
const shell = (page: Page, t: Translator) =>
  page.getByRole('navigation', { name: t.t(SHELL.mainNavigation) });
const card = (page: Page, language: keyof typeof LANGUAGE_META) =>
  page.getByRole('radio', { name: LANGUAGE_META[language].endonym });
const notSaved = (page: Page) =>
  page.getByRole('alert').filter({ hasText: en.t(SETUP_LANGUAGE.notSavedTitle) });
const theStepsSave = '**/onboarding/progress/language';

test('a new owner is asked for the language once, each under its own name, and Continue opens the home', async ({
  page,
}) => {
  await reachLanguageStep(page, en, freshMobile());
  for (const language of ['en', 'hi', 'mr'] as const)
    await expect(card(page, language)).toBeVisible();
  await expect(card(page, 'en')).toBeChecked();
  await expect(shell(page, en)).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  await passLanguageStep(page, en);
  await expect(shell(page, en)).toBeVisible();

  await page.reload();
  await expect(shell(page, en)).toBeVisible();
  await expect(heading(page, en)).toHaveCount(0);
});

test('a tap redraws the step in that language and saves it, with no Save to press', async ({
  page,
}) => {
  const mr = await createTranslator('mr');
  await reachLanguageStep(page, en, freshMobile());
  // The step's only buttons are the ask and the way on: nothing saves a choice but the tap.
  await expect(page.getByRole('main').getByRole('button')).toHaveText([
    '',
    en.t(SETUP_LANGUAGE.continue),
  ]);
  const saved = page.waitForRequest(
    (request) => request.method() === 'PATCH' && request.url().endsWith('/users/me'),
  );

  await card(page, 'mr').click();
  await expect(heading(page, mr)).toBeVisible();
  await expect(card(page, 'mr')).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('lang', LANGUAGE_META.mr.tag);
  expect((await saved).postDataJSON()).toEqual({ interfaceLanguage: 'mr' });

  await passLanguageStep(page, mr);
  await expect(shell(page, mr)).toBeVisible();
});

test.describe('a hi-IN browser', () => {
  test.use({ locale: 'hi-IN' });

  test('says the language came from the device, on its own card', async ({ page }) => {
    const hi = await createTranslator('hi');
    await reachLanguageStep(page, hi, freshMobile());
    await expect(card(page, 'hi')).toBeChecked();
    await expect(card(page, 'hi')).toContainText(hi.t(SETUP_LANGUAGE.devicePill));
    await expect(page.getByText(hi.t(SETUP_LANGUAGE.notInSet))).toHaveCount(0);
  });
});

/*
 * A device outside the set is told so (`SCR-M01-03` decision 10). The app's root hands the
 * provider the device's own answer; handing it English in its place would draw the first frame.
 */
test.describe('a ta-IN browser', () => {
  test.use({ locale: 'ta-IN' });

  test('opens the step in English, says why, and marks English as chosen for the person', async ({
    page,
  }) => {
    await reachLanguageStep(page, en, freshMobile());
    await expect(card(page, 'en')).toBeChecked();
    await expect(card(page, 'en')).toContainText(en.t(SETUP_LANGUAGE.chosenPill));
    await expect(page.getByText(en.t(SETUP_LANGUAGE.devicePill), { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole('status').filter({ hasText: en.t(SETUP_LANGUAGE.notInSet) }),
    ).toBeVisible();
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);
  });
});

/*
 * Setup is the owner's: the api refuses everyone else its progress, so a person whose roles do not
 * manage the company's settings is never asked and never read for. No screen makes a second member
 * yet, so the session's answer is given other roles on its way to the page.
 */
test('a person whose roles do not manage the company’s settings goes straight home, and nothing is read for them', async ({
  page,
}) => {
  const roles = ROLE_PRESETS.filter((role) => !can([role], 'onboarding.manage_tenant_settings'));
  await reachLanguageStep(page, en, freshMobile());
  await page.route('**/auth/session', async (route) => {
    const response = await route.fetch();
    const session = await response.json();
    await route.fulfill({
      response,
      json: { ...session, membership: { ...session.membership, roles: roles.slice(0, 1) } },
    });
  });
  const progressReads: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('/onboarding/progress')) progressReads.push(request.method());
  });

  await page.reload();
  await expect(shell(page, en)).toBeVisible();
  await expect(heading(page, en)).toHaveCount(0);
  expect(progressReads).toEqual([]);
});

test('a save that fails says so with two ways on, and Try again opens the home', async ({
  page,
}) => {
  await reachLanguageStep(page, en, freshMobile());
  await page.route(theStepsSave, (route) => route.abort());

  await page.getByRole('button', { name: en.t(SETUP_LANGUAGE.continue) }).click();
  await expect(notSaved(page)).toContainText(en.t(SETUP_LANGUAGE.notSavedBody));
  await expect(
    page.getByRole('button', { name: en.t(SETUP_LANGUAGE.continueAnyway) }),
  ).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  await page.unroute(theStepsSave);
  await page.getByRole('button', { name: en.t(SIGN_IN.tryAgain) }).click();
  await expect(shell(page, en)).toBeVisible();
  await expect(heading(page, en)).toHaveCount(0);
});

/*
 * `Continue` sends the language before it records the step (`SCR-M01-03` decision 14): a step
 * recorded over a language that was never stored would open the next sign-in in the old one.
 */
test('a language that does not save keeps the step open: the banner shows and the step is not recorded', async ({
  page,
}) => {
  await reachLanguageStep(page, en, freshMobile());
  const stepRecords: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('/onboarding/progress/language')) stepRecords.push(request.method());
  });
  await page.route('**/users/me', (route) => route.abort());

  await page.getByRole('button', { name: en.t(SETUP_LANGUAGE.continue) }).click();
  await expect(notSaved(page)).toBeVisible();
  await expect(shell(page, en)).toHaveCount(0);
  expect(stepRecords).toEqual([]);
});

test('Continue anyway opens the home, and the next sign-in asks for the step again', async ({
  page,
}) => {
  // The number's signup code is seconds old, and a second one is sent only after the resend gap.
  test.setTimeout(90_000);
  const mobile = freshMobile();
  await reachLanguageStep(page, en, mobile);
  await page.route(theStepsSave, (route) => route.abort());
  await page.getByRole('button', { name: en.t(SETUP_LANGUAGE.continue) }).click();
  await page.getByRole('button', { name: en.t(SETUP_LANGUAGE.continueAnyway) }).click();
  await expect(shell(page, en)).toBeVisible();
  await page.unroute(theStepsSave);

  await passTheOwnersMark(page, en);
  await page
    .getByRole('button', { name: en.t(SHELL.accountOf, { name: `Owner ${mobile.national}` }) })
    .click();
  await page.getByRole('menuitem', { name: en.t(SHELL.signOut) }).click();
  await expect(page.getByRole('heading', { name: en.t(SIGN_IN.signIn) })).toBeVisible();

  await page.waitForTimeout((RESEND_SECONDS + 1) * 1000);
  await typeCode(page, en, await requestCode(page, en, mobile));
  await page.getByRole('button', { name: en.t(SIGN_IN.verifyAndSignIn) }).click();
  await expect(heading(page, en)).toBeVisible();
  await expect(shell(page, en)).toHaveCount(0);
});
