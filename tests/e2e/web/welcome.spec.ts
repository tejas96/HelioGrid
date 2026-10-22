import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { createCompany } from '../support/door';
import { freshMobile } from '../support/phone';

const en = await createTranslator('en');

/*
 * `SCR-M01-09`: First-Run Profile is owed only right after a join that named the account (ruling
 * 17), so a typed address — signed out or signed in — goes home. CI runs no worker, so no flow here
 * can mint a live invite link; the step itself is proven on the stack (`T-M01-009` QA rows).
 */
test('signed out, /welcome goes home, whose gate opens the door', async ({ page }) => {
  await page.goto('/welcome');

  await expect(page.getByRole('heading', { name: en.t(SIGN_IN.signIn) })).toBeVisible();
});

test('signed in with nothing owed, /welcome goes home', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await page.goto('/welcome');

  await expect(page).toHaveURL(/\/home$/);
});
