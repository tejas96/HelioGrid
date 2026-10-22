import { createTranslator, INVITE_LANDING } from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';

const en = await createTranslator('en');

/** A well-formed link with no invite behind it: 43 base64url characters, as the token is minted. */
const UNKNOWN_TOKEN = 'A'.repeat(43);

/*
 * `SCR-M01-08` `m-empty`: a link with no invite behind it says so, names nobody, sends no code and
 * leads to sign in. CI runs no worker, so no flow here can mint a live link; the live landing is
 * proven on the stack (`T-M01-008` QA rows).
 */
test('an invite link with nothing behind it says so, sends no code, and leads to sign in', async ({
  page,
}) => {
  const codeRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/auth/otp/request')) codeRequests.push(request.url());
  });
  await page.goto(`/invite/${UNKNOWN_TOKEN}`);

  await expect(page.getByText(en.t(INVITE_LANDING.goneTitle))).toBeVisible();
  await expect(page.getByText(en.t(INVITE_LANDING.goneNote))).toBeVisible();
  expect(codeRequests).toEqual([]);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
  await page.getByRole('button', { name: en.t(INVITE_LANDING.signIn) }).click();
  await expect(page).toHaveURL(/\/login$/);
});
