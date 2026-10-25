import { IN_CERTIFICATION_SCHEMES } from '@heliogrid/domain';
import {
  CATALOG_EDITOR,
  CATALOG_SETTINGS,
  catalogAddItemWords,
  catalogImportNotes,
  catalogImportWords,
  catalogItemAddedToast,
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

/**
 * The add sheet (`SCR-M01-16`, `T-M01-016`): *Add an item* opens the panel beside the list, the
 * owner turns it to a battery, types it and its price, and the item stands first in the list,
 * tinted, with the toast naming it — and a reload still finds it, as the person's own SKU.
 */
test('an owner adds a battery from Catalog settings', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more');
  await page.getByRole('button', { name: WORDS.rows.catalog }).click();
  await expect(page).toHaveURL(/\/more\/catalog$/);

  const words = catalogAddItemWords(en.t, {
    kind: 'battery',
    caller: 'settings',
    schemes: IN_CERTIFICATION_SCHEMES.schemes,
    priced: true,
    copiedFrom: null,
  });
  await page.getByRole('button', { name: en.t(CATALOG_SETTINGS.addItem) }).click();
  const sheet = page.getByRole('dialog').first();
  await sheet.getByRole('combobox', { name: words.whatItIs }).click();
  await page
    .getByRole('option', { name: words.kinds.find((k) => k.value === 'battery')?.label })
    .click();
  await expect(sheet.getByText(words.title, { exact: true })).toBeVisible();

  const brand = `E2E Battery ${Date.now()}`;
  await sheet.getByRole('textbox', { name: words.brand }).fill(brand);
  await sheet.getByRole('textbox', { name: words.model }).fill('LFP 5.1');
  const figures: [string, string][] = [
    ['usableKwh', '5.1'],
    ['nominalV', '51.2'],
    ['powerKw', '2.5'],
    ['cycleLife', '6000'],
    ['weightKg', '52'],
    ['widthMm', '480'],
    ['depthMm', '200'],
    ['heightMm', '640'],
  ];
  for (const [path, value] of figures) {
    await sheet.getByRole('textbox', { name: words.fields[path]?.label, exact: true }).fill(value);
  }
  await sheet.getByRole('combobox', { name: words.fields.chemistry?.label }).click();
  await page.getByRole('option', { name: 'LFP', exact: true }).click();
  /* The switch's input is visually hidden: a person presses its words, as `more-profile` does. */
  const dcr = words.schemeRows.DCR?.label ?? '';
  await sheet.getByText(dcr, { exact: true }).click();
  await expect(sheet.getByRole('switch', { name: dcr })).toBeChecked();
  await sheet.getByRole('textbox', { name: words.yourPrice }).fill('98500');
  await sheet.getByRole('button', { name: words.primary, exact: true }).click();

  const toast = catalogItemAddedToast(en.t, `${brand} LFP 5.1`);
  const raised = page.locator('.hg-toast').filter({ hasText: toast.title });
  await expect(raised).toBeVisible();
  await expect(raised.getByText(toast.description, { exact: true })).toBeVisible();
  /* A table row at 1536, a card at 375. */
  const first = page.locator('.hg-dt-row, .hg-dt-card').first();
  await expect(first).toContainText(brand);
  await expect(first).toHaveAttribute('data-highlighted', 'true');

  await page.reload();
  await page.getByRole('searchbox', { name: en.t(CATALOG_SETTINGS.searchLabel) }).fill(brand);
  await expect(page.getByText(`${brand} LFP 5.1`).first()).toBeVisible();
  await expectNoSeriousViolations(page);
});
