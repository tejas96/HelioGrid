import {
  COMPANY_PROFILE,
  COMPANY_PROFILE_PART_TITLE,
  COMPANY_SIGNUP,
  createTranslator,
  destinationLabel,
  SETUP_WHAT_YOU_SELL,
  SHELL,
  settingsWords,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { expectTheLook } from '../support/look';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/company-profile` (`SCR-M01-05`, `d-settings`; `M01-29`): the business profile behind
 * `More`, inside the shell with `More` in view, titled by its row. `Save changes` writes the
 * profile and never an onboarding step; with *What you sell* open the act says what a changed
 * declaration reprices (`M01-23`).
 */
const en = await createTranslator('en');
const WORDS = settingsWords(en.t);
const SAVE = en.t(COMPANY_PROFILE.saveChangesSpoken);

test('the business profile row opens the profile in the shell; a save writes the profile, records no step, and stays', async ({
  page,
}, testInfo) => {
  const company = await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more');
  const rail = page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) });

  await page.getByRole('button', { name: WORDS.rows.company_profile }).click();

  await expect(page).toHaveURL(/\/more\/company-profile$/);
  await expect(
    page.getByRole('heading', { level: 1, name: WORDS.rows.company_profile }),
  ).toBeVisible();
  await expect(page.getByText(en.t(COMPANY_PROFILE.settingsLede))).toBeVisible();
  await expect(rail.getByRole('button', { name: destinationLabel(en.t, 'more') })).toHaveAttribute(
    'aria-current',
    'page',
  );
  // At 1536 the settings list stands beside the page, the page in view marked; at 375 it does not.
  const side = page.getByRole('navigation', { name: WORDS.title });
  if (testInfo.project.name === 'desktop') {
    await expect(side.getByRole('button', { name: WORDS.rows.company_profile })).toHaveAttribute(
      'aria-current',
      'page',
    );
  } else {
    await expect(side).toBeHidden();
  }
  await expectNoSidewaysScroll(page);
  await expect(page).toHaveTitle(/\S/);
  await expectNoSeriousViolations(page);
  await expectTheLook(page, [
    page.getByText(company),
    page.getByRole('textbox', { name: en.t(COMPANY_SIGNUP.companyName) }),
  ]);

  // In settings *What you sell* opens itself on arrival (the brief's ruling 58): a click would shut it.
  await expect(
    page.getByRole('button', { name: en.t(COMPANY_PROFILE_PART_TITLE.declarations) }),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText(en.t(COMPANY_PROFILE.reseedScope))).toBeVisible();
  const size = page.getByRole('textbox', { name: en.t(SETUP_WHAT_YOU_SELL.sizeLabel) });
  await size.fill('8');
  await size.press('Enter');

  const steps: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/onboarding/progress')) steps.push(request.url());
  });
  const saved = page.waitForResponse(
    (response) =>
      response.url().includes('/settings/business-profile') &&
      response.request().method() === 'PUT',
  );
  await page.getByRole('button', { name: SAVE }).click();
  expect((await saved).status()).toBe(200);
  // A save that lands in settings says so (`SCR-M01-05` ruling 59).
  await expect(page.getByText(en.t(COMPANY_PROFILE.saved), { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: SAVE })).toBeEnabled();
  expect(steps).toEqual([]);
  await expect(page).toHaveURL(/\/more\/company-profile$/);

  await page.reload();
  // In settings *What you sell* opens itself on arrival (the brief's ruling 58): a click would shut it.
  await expect(
    page.getByRole('button', { name: en.t(COMPANY_PROFILE_PART_TITLE.declarations) }),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByRole('textbox', { name: en.t(SETUP_WHAT_YOU_SELL.sizeLabel) }),
  ).toHaveValue('8');

  // At the desktop width More opens the first settings page beside the side list (owner ruling).
  await rail.getByRole('button', { name: destinationLabel(en.t, 'more') }).click();
  await expect(page).toHaveURL(
    testInfo.project.name === 'desktop' ? /\/more\/profile$/ : /\/more$/,
  );
});
