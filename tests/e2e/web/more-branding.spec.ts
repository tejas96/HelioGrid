import { COMPANY_LOGO_LIMITS } from '@heliogrid/domain';
import {
  brandColourFieldWords,
  brandingStandingLine,
  brandingWords,
  createTranslator,
  SHELL,
  settingsWords,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany, OWNER_NAME } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/branding` (`SCR-M01-18`, `M01-50`): the owner sets the brand colour their customers see,
 * saves it in one write, and a fresh read names it and who saved it; a person whose presets do not
 * open the row meets the not-found page (`F7-48`).
 */
const en = await createTranslator('en');
const ROWS = settingsWords(en.t).rows;
const WORDS = brandingWords(en.t, { limits: COMPANY_LOGO_LIMITS, companyName: '', taxLabel: '' });
const HEX = brandColourFieldWords(en.t).hexLabel;
const COLOUR = '#0D7A4F';

/** Stands where the date goes, so the words before it come from the one whole message. */
const DATE_SLOT = '\u0000';
const [SAVED_BY_OWNER = ''] = brandingStandingLine(
  en.t,
  { kind: 'saved', at: 0, name: OWNER_NAME },
  { date: () => DATE_SLOT },
).split(DATE_SLOT);

test('an owner saves a colour and reads it back', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more');
  await page.getByRole('button', { name: ROWS.branding }).click();

  await expect(page).toHaveURL(/\/more\/branding$/);
  await expect(page.getByRole('heading', { level: 1, name: ROWS.branding })).toBeVisible();
  await expect(
    page.getByText(brandingStandingLine(en.t, { kind: 'never-set' }, { date: String })),
  ).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expect(page).toHaveTitle(/\S/);
  await expectNoSeriousViolations(page);

  const parts = page.getByRole('radiogroup', { name: WORDS.edit });
  await parts.getByRole('radio', { name: WORDS.colour }).click();
  const hex = page.getByRole('textbox', { name: HEX, exact: true });
  await hex.fill(COLOUR);
  /* The field takes a colour when it is left, as a person leaves it: Enter. */
  await hex.press('Enter');
  await expect(page.getByText(WORDS.notSaved)).toBeVisible();

  const saved = page.waitForResponse(
    (response) =>
      response.url().includes('/settings/branding') && response.request().method() === 'PUT',
  );
  await page.getByRole('button', { name: WORDS.save }).click();
  expect((await saved).status()).toBe(200);
  await expect(page.getByRole('button', { name: WORDS.save })).toHaveCount(0);

  await page.reload();
  await expect(page.getByText(SAVED_BY_OWNER, { exact: false })).toBeVisible();
  await page
    .getByRole('radiogroup', { name: WORDS.edit })
    .getByRole('radio', { name: WORDS.colour })
    .click();
  await expect(page.getByRole('textbox', { name: HEX, exact: true })).toHaveValue(COLOUR);
});

/**
 * No flow in CI can mint a live invite (it runs no worker), so the reader is the owner's own
 * session read back as a Sales Executive's: the page's gate reads the presets the session names.
 * The api's own refusal of the write is `apps/api/tests/settings/branding.test.ts`'s.
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

  await page.goto('/more/branding');

  await expect(page.getByRole('heading', { level: 1, name: en.t(SHELL.notFound) })).toBeAttached();
  await expect(page.getByRole('heading', { level: 1, name: ROWS.branding })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: HEX, exact: true })).toHaveCount(0);
});
