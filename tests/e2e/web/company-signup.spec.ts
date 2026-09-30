import { COMPANY_SIGNUP, createTranslator } from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { freshMobile } from '../support/phone';

const en = await createTranslator('en');

test('the signup door opens to its first step with every control named', async ({ page }) => {
  await page.goto('/company-signup');

  await expect(
    page.getByRole('heading', { name: en.t(COMPANY_SIGNUP.createYourCompany) }),
  ).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('a new number verifies, names its company in one step and lands on home', async ({ page }) => {
  await createCompany(page, en, freshMobile());
});
