import { UI_LANGUAGES } from '@heliogrid/contracts';
import { COMPANY_SIGNUP, createTranslator, LANGUAGE_META, SIGN_IN } from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
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
  await expectNoSeriousViolations(page);
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
  await expectNoSeriousViolations(page);
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
    await expectNoSeriousViolations(page);
  }
});

/*
 * `F8-36`: with no answer from the api, the attempt fails at once and says so, and offers to try
 * again. Dropped and aborted are two ways a request goes unanswered; each is its own drive.
 */
for (const [drop, cut] of [
  ['with the network down', (page: Page) => page.context().setOffline(true)],
  [
    'with the code request aborted',
    (page: Page) => page.route('**/auth/otp/request', (route) => route.abort()),
  ],
] as const) {
  test(`${drop}, Send code says the code could not be sent and offers to send it again`, async ({
    page,
  }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: en.t(SIGN_IN.signIn) })).toBeVisible();
    await cut(page);

    await page
      .getByRole('textbox', { name: en.t(SIGN_IN.mobileNumber) })
      .fill(freshMobile().national);
    await page.getByRole('button', { name: en.t(SIGN_IN.sendCode) }).click();

    await expect(page.getByText(en.t(SIGN_IN.requestFailedTitle))).toBeVisible();
    await expect(page.getByRole('button', { name: en.t(SIGN_IN.sendItAgain) })).toBeVisible();
  });
}
