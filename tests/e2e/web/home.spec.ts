import { createTranslator } from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { createCompany, expectNoSidewaysScroll } from '../support/door';
import { freshMobile } from '../support/phone';

const en = await createTranslator('en');

test('signed out, home sends a visitor to the door', async ({ page }) => {
  await page.goto('/home');

  await expect(page).toHaveURL(/\/login$/);
});

test('with a company, home opens and stays within the viewport', async ({ page }) => {
  await createCompany(page, en, freshMobile());

  await expect(page.getByRole('main')).toBeVisible();
  await expectNoSidewaysScroll(page);
});
