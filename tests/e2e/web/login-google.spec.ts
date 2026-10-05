import { COMPANY_SIGNUP, createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';

/**
 * The Google door on the web (`M01-02`, `SCR-M01-01`). No flow presses through to Google — no
 * agent holds a Google password — so the return route is driven with the answers Google's page
 * sends back: a token the api refuses, a cancel, and a planted token whose state this tab never
 * sent. The live round trip is the owner's, in QA.
 */

const en = await createTranslator('en');
const RETURN = '/login/google';
/** What the door left in this tab before it went to Google's page (`use-google-sheet.ts`). */
const PENDING_KEY = 'hg.google.pending';
const SENT = 'state-the-door-sent';

const googleButton = (page: Page) =>
  page.getByRole('button', { name: en.t(SIGN_IN.continueWithGoogleLabel) });
const failedBlock = (page: Page) => page.getByText(en.t(SIGN_IN.googleFailedTitle));

/** Leaves the pending value as a press would, then lands on the return route with `answer`. */
async function returnFromGoogle(page: Page, answer: string, pending: string | null = SENT) {
  await page.goto('/login');
  await expect(googleButton(page)).toBeVisible();
  if (pending !== null) {
    await page.evaluate(({ key, value }) => sessionStorage.setItem(key, value), {
      key: PENDING_KEY,
      value: pending,
    });
  }
  await page.goto(`${RETURN}#${answer}`);
  await expect(page.getByRole('heading', { name: en.t(SIGN_IN.signIn) })).toBeVisible();
}

test('the door offers Continue with Google under an "or", beside the number', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('textbox', { name: en.t(SIGN_IN.mobileNumber) })).toBeVisible();
  await expect(page.getByText(en.t(SIGN_IN.or), { exact: true })).toBeVisible();
  await expect(googleButton(page)).toHaveText(en.t(SIGN_IN.continueWithGoogle));
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('a token the api refuses says Google did not finish, and clears the address bar', async ({
  page,
}) => {
  const refused = page.waitForResponse((reply) => reply.url().endsWith('/auth/sign-in/google'));
  await returnFromGoogle(page, `id_token=not-a-token&state=${SENT}`);

  expect((await refused).status()).toBe(401);
  await expect(failedBlock(page)).toBeVisible();
  await expect(page.getByText(en.t(SIGN_IN.googleFailedBody))).toBeVisible();
  expect(new URL(page.url()).hash).toBe('');
  await expectNoSeriousViolations(page);
});

test('backing out of Google leaves the door as it was, with no message', async ({ page }) => {
  await returnFromGoogle(page, 'error=access_denied');
  await expect(googleButton(page)).toBeEnabled();
  await expect(failedBlock(page)).toHaveCount(0);
});

test('a token whose state this tab never sent is refused here, never sent to the api', async ({
  page,
}) => {
  const calls: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/auth/sign-in/')) calls.push(request.url());
  });
  await returnFromGoogle(page, 'id_token=planted-elsewhere&state=planted', null);
  await expect(failedBlock(page)).toBeVisible();
  expect(calls).toEqual([]);
});

test('a Google answer pasted onto /login is no answer: nothing shows, nothing is sent', async ({
  page,
}) => {
  const calls: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/auth/sign-in/')) calls.push(request.url());
  });
  await page.goto('/login#error=server_error');
  await expect(page.getByRole('heading', { name: en.t(SIGN_IN.signIn) })).toBeVisible();
  await expect(googleButton(page)).toBeEnabled();
  await expect(failedBlock(page)).toHaveCount(0);
  expect(calls).toEqual([]);
});

test('with the network down, the return says Google did not finish', async ({ page }) => {
  await page.route('**/auth/sign-in/google', (route) => route.abort());
  await returnFromGoogle(page, `id_token=not-a-token&state=${SENT}`);
  await expect(failedBlock(page)).toBeVisible();
});

test('the signup door draws no Google control', async ({ page }) => {
  await page.goto('/company-signup');
  await expect(
    page.getByRole('heading', { name: en.t(COMPANY_SIGNUP.createYourCompany) }),
  ).toBeVisible();
  await expect(googleButton(page)).toHaveCount(0);
  await expect(page.getByText(en.t(SIGN_IN.or), { exact: true })).toHaveCount(0);
});
