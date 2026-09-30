import { createTranslator } from '@heliogrid/i18n';
import { test } from '@playwright/test';
import { createCompany } from '../support/door';
import { freshMobile } from '../support/phone';

const en = await createTranslator('en');

test('a new number verifies, names its company in one step and lands on home', async ({ page }) => {
  await createCompany(page, en, freshMobile());
});
