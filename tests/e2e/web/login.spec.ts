import { UI_LANGUAGES } from '@heliogrid/contracts';
import {
  COMPANY_SIGNUP,
  CONNECTION,
  createTranslator,
  LANGUAGE_META,
  SHELL,
  SIGN_IN,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import {
  createCompany,
  expectNumberFieldRinged,
  requestCode,
  typeCode,
  wrongCodeFor,
} from '../support/door';
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

/**
 * The door opens in the browser's first language where the set holds it, with nothing asked of the
 * person (`F3-03`), and in English where it does not.
 */
for (const [browserLanguage, language] of [
  ['hi-IN', 'hi'],
  ['mr-IN', 'mr'],
  ['ta-IN', 'en'],
] as const) {
  test.describe(`a ${browserLanguage} browser`, () => {
    test.use({ locale: browserLanguage });

    test(`opens the door in ${LANGUAGE_META[language].endonym}`, async ({ page }) => {
      const t = await createTranslator(language);
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: t.t(SIGN_IN.signIn) })).toBeVisible();
      await expect(page.getByRole('button', { name: t.t(SIGN_IN.sendCode) })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', LANGUAGE_META[language].tag);
    });
  });
}

/**
 * A signed-in person's own language wins over the browser's (`F3-02`), in the one order that could
 * lose it: the browser's catalog still loading when the session answers. The Hindi catalog is held
 * until the English home is drawn, so the overlap is forced.
 */
test('an English account reloading on a hi-IN browser keeps its English when the Hindi catalog arrives late', async ({
  browser,
}) => {
  const owner = await browser.newContext();
  await createCompany(await owner.newPage(), en, freshMobile());
  const signedIn = await owner.storageState();
  await owner.close();

  const hindiBrowser = await browser.newContext({ locale: 'hi-IN', storageState: signedIn });
  const page = await hindiBrowser.newPage();
  const hindiWords = (await createTranslator('hi')).t(SIGN_IN.signIn);
  const escaped = [...hindiWords]
    .map((letter) => `\\u${letter.charCodeAt(0).toString(16).padStart(4, '0')}`)
    .join('');
  const englishShell = page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) });
  let catalogArrived = false;
  await page.route('**/_next/static/**', async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const isTheHindiCatalog = body.includes(hindiWords) || body.includes(escaped);
    if (isTheHindiCatalog) await expect(englishShell).toBeVisible();
    await route.fulfill({ response, body });
    if (isTheHindiCatalog) catalogArrived = true;
  });

  await page.goto('/home');
  await expect.poll(() => catalogArrived).toBe(true);
  await expect(englishShell).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', LANGUAGE_META.en.tag);
  await hindiBrowser.close();
});

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
