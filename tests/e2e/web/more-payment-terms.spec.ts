import { allocationVerdict, basisPoints } from '@heliogrid/domain';
import {
  allocationRefusal,
  createTranslator,
  paymentTermsSavedLine,
  paymentTermsWords,
  SHELL,
  settingsWords,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany, OWNER_NAME } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { wordsBeforeDate } from '../support/saved-line';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/payment-terms` (`SCR-M01-20`, `M01-54`): the owner changes a seeded split, saves it, and
 * a fresh read shows it on its card and names who saved; a split short of the whole is refused
 * with the remainder named; a person whose presets do not open the row meets the not-found page.
 */
const en = await createTranslator('en');
const ROWS = settingsWords(en.t).rows;
const WORDS = paymentTermsWords(en.t);
/* The seeded split the flow edits, as the platform seeds it (`STANDARD_TRANCHE_TEMPLATES`). */
const SECOND_SEEDED = 'Standard 30/60/10';
const SECOND_LINE = 'Before dispatch';

const SAVED_BY_OWNER = wordsBeforeDate((date) =>
  paymentTermsSavedLine(en.t, { kind: 'saved', at: 0, name: OWNER_NAME }, { date }),
);

async function openTerms(page: Page) {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more');
  await page.getByRole('button', { name: ROWS.payment_terms }).click();
  await expect(page).toHaveURL(/\/more\/payment-terms$/);
}

async function share(page: Page, name: string, value: string) {
  const field = page.getByRole('textbox', { name, exact: true });
  await field.fill(value);
  await field.press('Enter');
}

test('an owner saves a split and reads it back', async ({ page }) => {
  await openTerms(page);
  await expect(page.getByText(WORDS.seededTitle)).toBeVisible();
  await expect(page.getByText(WORDS.neverChanged)).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expect(page).toHaveTitle(/\S/);
  await expectNoSeriousViolations(page);

  await page.getByRole('button', { name: SECOND_SEEDED, exact: true }).click();
  await share(page, WORDS.share, '40');
  await share(page, WORDS.shareOf(SECOND_LINE), '50');
  await expect(page.getByText(WORDS.notSaved)).toBeVisible();
  await page.getByRole('button', { name: WORDS.save }).click();
  await expect(page.getByRole('button', { name: WORDS.save })).toHaveCount(0);

  await page.reload();
  await expect(page.getByText(SAVED_BY_OWNER, { exact: false })).toBeVisible();
  const split = page.getByRole('region', { name: WORDS.split(SECOND_SEEDED) });
  await expect(split).toContainText('40%');
  await expect(split).toContainText('50%');
});

test('a split short of the whole is refused', async ({ page }) => {
  await openTerms(page);
  await page.getByRole('button', { name: SECOND_SEEDED, exact: true }).click();
  await share(page, WORDS.share, '20');

  const save = page.getByRole('button', { name: WORDS.save });
  await expect(save).toHaveAttribute('aria-disabled', 'true');
  const short = allocationVerdict([2000, 6000, 1000].map(basisPoints));
  await save.focus();
  await expect(page.getByText(allocationRefusal(en.t, short) ?? '').first()).toBeVisible();
});

/**
 * No flow in CI can mint a live invite (it runs no worker), so the reader is the owner's own
 * session read back as a Sales Executive's: the page's gate reads the presets the session names.
 * The api's own refusal of the writes is `apps/api/tests/settings/tranche-route-access.test.ts`'s.
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

  await page.goto('/more/payment-terms');

  await expect(page.getByRole('heading', { level: 1, name: en.t(SHELL.notFound) })).toBeAttached();
  await expect(page.getByRole('heading', { level: 1, name: ROWS.payment_terms })).toHaveCount(0);
});
