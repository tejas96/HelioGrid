import { readFile } from 'node:fs/promises';
import { formatMoney, IN_FORMATS } from '@heliogrid/domain';
import { createTranslator, ownerDashboardWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

const en = await createTranslator('en');
const dashboard = ownerDashboardWords(en.t);

/**
 * The owner dashboard on a new company's home (`SCR-M13-01`): every section reads, honestly empty;
 * the company target is set inline and kept (`M13-17`); the export saves the CSV with each figure's
 * label beside it (`M13-52`, `M13-53`).
 */
test('a new company reads every section, sets its target inline and keeps it', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);

  await expect(page.getByText(dashboard.allClearTitle)).toBeVisible();
  await expect(page.getByText(dashboard.forecastGap)).toBeVisible();
  await expect(page.getByText(dashboard.pipelineTitle)).toBeVisible();
  await expect(page.getByText(dashboard.tooFew(0, 0))).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  await page.getByRole('button', { name: dashboard.setTarget }).click();
  await page.getByRole('textbox', { name: dashboard.targetLabel }).fill('2500000');
  const saved = page.waitForResponse(
    (answer) => answer.url().endsWith('/dashboards/target') && answer.request().method() === 'PUT',
  );
  await page.getByRole('button', { name: dashboard.saveTarget }).click();
  expect((await saved).status()).toBe(200);
  await expect(page.getByRole('button', { name: dashboard.saveTarget })).toBeHidden();

  await page.reload();
  await expect(page.getByRole('button', { name: dashboard.editTarget })).toBeVisible();
  await expect(page.getByRole('button', { name: dashboard.setTarget })).toBeHidden();
  // The target reads in full money, as every other figure on the home does.
  await expect(
    page.getByText(
      dashboard.ofTarget(dashboard.percent('0'), formatMoney(IN_FORMATS, '2500000.00')),
    ),
  ).toBeVisible();
});

test('the export saves the dashboard as a CSV, each figure beside its label', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await expect(page.getByText(dashboard.allClearTitle)).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: dashboard.export }).click();
  const file = await download;

  expect(file.suggestedFilename()).toMatch(/^dashboard-\d{4}-\d{2}\.csv$/);
  const path = await file.path();
  const text = await readFile(path, 'utf8');
  expect(text).toContain(`"${dashboard.forecastGap}"`);
  expect(text).toContain(`"${dashboard.valuesGap}"`);
  // The header row opens the file; the day it was taken closes it.
  const rows = text
    .replace(/^\uFEFF/, '')
    .trimEnd()
    .split('\r\n');
  expect(rows[0]?.match(/","/g)).toHaveLength(3);
  expect(rows.at(-1)).not.toContain('","');
});
