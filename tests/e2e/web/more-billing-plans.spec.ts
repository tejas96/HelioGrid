import { BILLING_HOME, createTranslator, SHELL } from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/billing/plans` (`SCR-M12-03`, RFC D11): before the plans are built, `Change plan` and
 * `Pick a plan` land on the shell's *coming later* page inside the settings, never a dead link.
 * T-M12-003 replaces this flow with the plans' own.
 */
const en = await createTranslator('en');

test('the plans route stands as the shell’s coming-later page', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more/billing/plans');

  await expect(
    page.getByRole('heading', { level: 1, name: en.t(BILLING_HOME.changePlan) }),
  ).toBeAttached();
  await expect(page.getByText(en.t(SHELL.comingLater))).toBeVisible();
  await expectNoSeriousViolations(page);
});
