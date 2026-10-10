import { createTranslator, SHELL, SIGN_IN } from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';

const en = await createTranslator('en');

/*
 * `SCR-M01-01` `m-not-found` (D87): an address no route serves says so in the reader's language and
 * offers one way home — sign in when signed out, the home when signed in; inside the shell, a door
 * the shell does not offer says the same within the shell.
 */
test('signed out, an unknown address says the page does not exist and leads to sign in', async ({
  page,
}) => {
  await page.goto('/no/such-page');

  await expect(page.getByRole('heading', { level: 1, name: en.t(SHELL.notFound) })).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
  await page.getByRole('button', { name: en.t(SHELL.goToSignIn) }).click();
  await expect(page.getByRole('heading', { name: en.t(SIGN_IN.signIn) })).toBeVisible();
});

test('signed in, a door the shell does not offer says so inside the shell and leads home', async ({
  page,
}) => {
  await createCompany(page, en, freshMobile());
  await page.goto('/no-such-door');

  await expect(page.getByRole('heading', { level: 1, name: en.t(SHELL.notFound) })).toBeAttached();
  await expect(page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) })).toBeVisible();
  await expectNoSeriousViolations(page);
  await page.getByRole('button', { name: en.t(SHELL.goToHome) }).click();
  await expect(page).toHaveURL(/\/home$/);
});
