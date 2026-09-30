import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/door';

const en = await createTranslator('en');

test('signed out, the root sends a visitor on to the door', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: en.t(SIGN_IN.signIn) })).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});
