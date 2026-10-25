import {
  CATALOG_EDITOR,
  CATALOG_SETTINGS,
  catalogImportNotes,
  catalogImportWords,
  createTranslator,
  settingsWords,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/catalog` (`SCR-M01-15`, `T-M01-015`): a new company's owner finds the market's platform
 * items with no price, gives one a price through the editor beside the list, and publishes a named
 * release that the strip then names (`M01-37`, `M01-43`).
 */
const en = await createTranslator('en');
const WORDS = settingsWords(en.t);
const PRICE = '12500';
const IMPORT = catalogImportWords(en.t);
const NOTES = catalogImportNotes(en.t);
const OVER_THE_LIMIT = 2_000_001;

test('an owner prices an item and publishes a release', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more');
  await page.getByRole('button', { name: WORDS.rows.catalog }).click();

  await expect(page).toHaveURL(/\/more\/catalog$/);
  await expect(
    page.getByRole('heading', { level: 1, name: en.t(CATALOG_SETTINGS.title) }),
  ).toBeVisible();
  await expect(page.getByText(en.t(CATALOG_SETTINGS.noRelease))).toBeVisible();

  /* A platform item carries no price (`M01-37`); the row opens the editor by its whole sentence.
     At 1536 the pointer's target is the visible row, so the named button is reached by keyboard. */
  const unpriced = page.getByRole('button', { name: /, no price set$/u }).first();
  const itemName = ((await unpriced.getAttribute('aria-label')) ?? '').replace(
    /, no price set$/u,
    '',
  );
  await unpriced.focus();
  await page.keyboard.press('Enter');
  const editor = page.getByRole('dialog');
  await editor.getByRole('textbox', { name: en.t(CATALOG_EDITOR.price) }).fill(PRICE);
  await editor.getByRole('textbox', { name: en.t(CATALOG_EDITOR.price) }).press('Tab');
  await page.getByRole('button', { name: en.t(CATALOG_EDITOR.saveOverride) }).click();
  await expect(editor).toBeHidden();
  await expect(
    page.getByRole('button', {
      name: new RegExp(`^${itemName.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}, ₹12,500`, 'u'),
    }),
  ).toBeVisible();

  /* Publishing asks for a name, and the strip names the release in force (`M01-43`). */
  const label = `E2E ${Date.now()}`;
  await page
    .getByRole('button', { name: en.t(CATALOG_SETTINGS.publish) })
    .first()
    .click();
  const publish = page.getByRole('dialog', { name: en.t(CATALOG_EDITOR.publishTitle) });
  await publish.getByRole('textbox', { name: en.t(CATALOG_EDITOR.releaseName) }).fill(label);
  await publish.getByRole('button', { name: en.t(CATALOG_SETTINGS.publish) }).click();
  await expect(publish).toBeHidden();
  await expect(page.getByText(label)).toBeVisible();

  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

/**
 * The import wizard's entry (`SCR-M01-17`, `T-M01-017`): *Import a file* opens the empty file step,
 * and a file over the catalog's limit is refused in words on the device with nothing uploaded. This
 * lane runs no worker, so no job goes past step 1 — the later steps are proven on the running app.
 */
test('an owner opens the import from Catalog and a file over the limit is refused before upload', async ({
  page,
}) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more');
  await page.getByRole('button', { name: WORDS.rows.catalog }).click();
  await expect(page).toHaveURL(/\/more\/catalog$/);

  await page.getByRole('button', { name: en.t(CATALOG_SETTINGS.importFile) }).click();
  const wizard = page.getByRole('dialog', { name: IMPORT.title });
  await expect(wizard.getByText(IMPORT.choose)).toBeVisible();
  // A company with no import keeps no report, so *Kept reports* is not drawn.
  await expect(wizard.getByText(IMPORT.keptReports)).toHaveCount(0);
  await expectNoSeriousViolations(page);

  const declared: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/files') {
      declared.push(request.url());
    }
  });
  await wizard.locator('input[type="file"]').setInputFiles({
    name: 'Price list too big.csv',
    mimeType: 'text/csv',
    buffer: Buffer.alloc(OVER_THE_LIMIT, 'a'),
  });
  const refusal = NOTES.upload({ state: 'refused', refusal: 'too-large' }, 2) ?? '';
  await expect(wizard.getByText(refusal)).toBeVisible();
  expect(declared).toEqual([]);

  await wizard.getByRole('button', { name: IMPORT.close }).click();
  await expect(wizard).toBeHidden();
});
