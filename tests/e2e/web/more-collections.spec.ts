import { createTranslator, SHELL, settingsWords } from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { collectionsWords, MALFORMED_UPI_ID, UPI_ID } from '../support/payments';
import { freshMobile } from '../support/phone';
import { packWord } from '../support/project-facts';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/collections` (`SCR-M11-04`): the owner sets the company's own UPI ID once and tests it
 * with a one-rupee QR from their own phone; the bank is the business profile's, shown here, and
 * the market's ways to record sit below. A saved UPI ID draws the test QR and stays across a
 * reload; one that does not read as name@bank is refused at its field and draws none. A person
 * whose presets do not open the row meets the not-found page.
 */
const en = await createTranslator('en');
const ROWS = settingsWords(en.t).rows;
const WORDS = collectionsWords(en);

async function openCollections(page: Page) {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more');
  /* The settings list's row: on the phone the list page, on desktop the side list beside the page. */
  await page.getByRole('main').getByRole('button', { name: ROWS.collections }).click();
  await expect(page).toHaveURL(/\/more\/collections$/);
  await expect(page.getByRole('heading', { level: 1, name: WORDS.title })).toBeVisible();
}

const upiField = (page: Page) => page.getByRole('textbox', { name: WORDS.upiId, exact: true });
const save = (page: Page) => page.getByRole('button', { name: WORDS.save, exact: true });
const testQr = (page: Page) => page.getByRole('img', { name: WORDS.qrLabel });

test('the owner saves a UPI ID: the test QR appears and stays across a reload', async ({
  page,
}) => {
  await openCollections(page);
  await expect(page.getByText(WORDS.lead, { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: WORDS.bank })).toBeVisible();
  const ways = page.locator('section').filter({
    has: page.getByRole('heading', { level: 2, name: WORDS.ways }),
  });
  /* The India pack's first way to record, as its chip names it. */
  await expect(ways.getByText(packWord('mode', 'upi'), { exact: true })).toBeVisible();
  await expect(testQr(page)).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expect(page).toHaveTitle(/\S/);
  await expectNoSeriousViolations(page);

  await upiField(page).fill(UPI_ID);
  const saved = page.waitForResponse(
    (answer) =>
      answer.url().endsWith('/settings/collections') && answer.request().method() === 'PUT',
  );
  await save(page).click();
  expect((await saved).status()).toBe(200);
  await expect(testQr(page)).toBeVisible();
  await expect(page.getByText(WORDS.testTitle, { exact: true })).toBeVisible();

  await page.reload();
  await expect(upiField(page)).toHaveValue(UPI_ID);
  await expect(testQr(page)).toBeVisible();
});

test('a UPI ID that does not read as name@bank is refused at its field', async ({ page }) => {
  await openCollections(page);
  await upiField(page).fill(MALFORMED_UPI_ID);
  await save(page).click();

  await expect(page.getByText(WORDS.malformed, { exact: true })).toBeVisible();
  await expect(testQr(page)).toHaveCount(0);
  await expectNoSeriousViolations(page);
});

/**
 * The reader is the owner's own session read back as a Sales Executive's, as
 * `more-payment-terms.spec.ts` does: the page's gate reads the presets the session names.
 */
test('a reader without the grant meets not found', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.route('**/auth/session', async (route) => {
    const response = await route.fetch();
    const projection = await response.json();
    const membership =
      projection.membership === null
        ? null
        : { ...projection.membership, roles: ['sales_executive'] };
    await route.fulfill({ response, json: { ...projection, membership } });
  });

  await page.goto('/more/collections');

  await expect(page.getByRole('heading', { level: 1, name: en.t(SHELL.notFound) })).toBeAttached();
  await expect(page.getByRole('heading', { level: 1, name: WORDS.title })).toHaveCount(0);
});
