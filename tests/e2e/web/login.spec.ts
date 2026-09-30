import { UI_LANGUAGES } from '@heliogrid/contracts';
import { COMPANY_SIGNUP, createTranslator, LANGUAGE_META, SIGN_IN } from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSidewaysScroll, requestCode, typeCode, wrongCodeFor } from '../support/door';
import { freshMobile } from '../support/phone';

const en = await createTranslator('en');

test('a wrong code says it did not match, and the door stays open', async ({ page }) => {
  await page.goto('/login');
  const code = await requestCode(page, en, freshMobile());

  await typeCode(page, en, wrongCodeFor(code));
  await page.getByRole('button', { name: en.t(SIGN_IN.verifyAndSignIn) }).click();

  await expect(page.getByText(en.t(SIGN_IN.wrongTitle))).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expectNoSidewaysScroll(page);
});

test('a new number signs in with the code it was sent and is taken to set up its company', async ({
  page,
}) => {
  await page.goto('/login');
  const code = await requestCode(page, en, freshMobile());

  await typeCode(page, en, code);
  await page.getByRole('button', { name: en.t(SIGN_IN.verifyAndSignIn) }).click();

  await expect(page).toHaveURL(/\/company-signup$/);
  await expect(page.getByRole('heading', { name: en.t(COMPANY_SIGNUP.yourCompany) })).toBeVisible();
});

test('the door speaks every language in the set, each in its own words', async ({ page }) => {
  await page.goto('/login');
  let shown = LANGUAGE_META.en.endonym;

  for (const language of UI_LANGUAGES) {
    const t = await createTranslator(language);
    await page.getByRole('button', { name: shown }).click();
    await page.getByRole('menuitemradio', { name: LANGUAGE_META[language].endonym }).click();
    shown = LANGUAGE_META[language].endonym;

    await expect(page.getByRole('heading', { name: t.t(SIGN_IN.signIn) })).toBeVisible();
    await expect(page.getByRole('button', { name: t.t(SIGN_IN.sendCode) })).toBeVisible();
    await expectNoSidewaysScroll(page);
  }
});
