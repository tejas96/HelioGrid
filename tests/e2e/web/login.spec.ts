import { UI_LANGUAGES } from '@heliogrid/contracts';
import {
  COMPANY_SIGNUP,
  CONNECTION,
  createTranslator,
  LANGUAGE_META,
  SIGN_IN,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNumberFieldRinged, requestCode, typeCode, wrongCodeFor } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { expectTheLook } from '../support/look';
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
  await expectNumberFieldRinged(page, en);
  await expectTheLook(page);
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
  test(`${drop}, Send code says HelioGrid could not be reached and keeps the number`, async ({
    page,
  }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: en.t(SIGN_IN.signIn) })).toBeVisible();
    await cut(page);

    const number = page.getByRole('textbox', { name: en.t(SIGN_IN.mobileNumber) });
    const typed = freshMobile().national;
    await number.fill(typed);
    await page.getByRole('button', { name: en.t(SIGN_IN.sendCode) }).click();

    await expect(page.getByText(en.t(SIGN_IN.requestFailedTitle))).toBeVisible();
    await expect(page.getByText(en.t(SIGN_IN.notReached))).toBeVisible();
    await expect(page.getByText(en.t(SIGN_IN.ourSideFailed))).toHaveCount(0);
    await expect(number).toHaveValue(new RegExp(typed.slice(-4)));
    await expect(page.getByRole('button', { name: en.t(SIGN_IN.sendCode) })).toBeEnabled();
  });
}

/*
 * `M01-07`: a boot check with no answer never opens the door by itself — the app says HelioGrid
 * could not be reached and asks again, and the answer it then gets decides where the person lands.
 */
test('a boot check with no answer shows the no-connection screen, and Try again asks again', async ({
  page,
}) => {
  await page.route('**/auth/session', (route) => route.abort());
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: en.t(CONNECTION.title) })).toBeVisible();
  await expect(page.getByRole('heading', { name: en.t(SIGN_IN.signIn) })).toHaveCount(0);
  await expectNoSeriousViolations(page);

  // A retry that still gets no answer stays on the screen and says so.
  await page.getByRole('button', { name: en.t(SIGN_IN.tryAgain) }).click();
  await expect(page.getByText(en.t(CONNECTION.stillNoAnswer))).toBeVisible();

  await page.unroute('**/auth/session');
  await page.getByRole('button', { name: en.t(SIGN_IN.tryAgain) }).click();
  await expect(page.getByRole('heading', { name: en.t(SIGN_IN.signIn) })).toBeVisible();
  await expectNoSeriousViolations(page);
});
