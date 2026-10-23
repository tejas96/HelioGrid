import {
  createTranslator,
  FIRST_RUN_PROFILE,
  LANGUAGE_META,
  NAME_AND_PHOTO_EDITOR,
  PROFILE_PREFERENCES,
  presetName,
  settingsRowName,
  TYPE_GROUP_NAME,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/profile` (`SCR-M01-11`): the person's own page — their name and role, then the languages
 * in their own scripts and the measurements, each applied as it is touched and kept by the server
 * across a reload, with no Save; a language redraws the page in place (`F3-03`, `F3-04`, `F3-23`);
 * a push group switched off stays off across a reload and a language change, and the Owner's
 * Billing stays on, locked (`F6-15`); *Edit name* changes the name in a panel, and the page and the
 * account menu follow (`T-M01-011c`).
 */
const en = await createTranslator('en');
const hi = await createTranslator('hi');
const W = (key: keyof typeof PROFILE_PREFERENCES) => en.t(PROFILE_PREFERENCES[key]);

test('a person changes language and units in place, and a reload keeps both', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more/profile');

  await expect(
    page.getByRole('heading', { level: 1, name: settingsRowName(en.t, 'profile') }),
  ).toBeVisible();
  await expect(page.getByText(presetName(en.t, 'epc_owner'))).toBeVisible();
  const languages = page.getByRole('radiogroup', { name: W('language') });
  for (const language of ['en', 'hi', 'mr'] as const)
    await expect(
      languages.getByRole('radio', { name: LANGUAGE_META[language].endonym }),
    ).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  const units = page.getByRole('radiogroup', { name: W('measurements') });
  await units.getByRole('radio', { name: W('feet') }).click();
  await expect(units.getByRole('radio', { name: W('feet') })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByText(W('yourChoice'))).toBeVisible();
  await page.reload();
  await expect(
    page
      .getByRole('radiogroup', { name: W('measurements') })
      .getByRole('radio', { name: W('feet') }),
  ).toHaveAttribute('aria-checked', 'true');

  await page
    .getByRole('radiogroup', { name: W('language') })
    .getByRole('radio', { name: LANGUAGE_META.hi.endonym })
    .click();
  const hindiTitle = page.getByRole('heading', {
    level: 1,
    name: settingsRowName(hi.t, 'profile'),
  });
  await expect(hindiTitle).toBeVisible();
  await expect(page).toHaveURL(/\/more\/profile$/);
  await page.reload();
  await expect(hindiTitle).toBeVisible();
});

test('the Owner turns a push group off, and it stays off; Billing stays on', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more/profile');

  const billing = page.getByRole('switch', { name: en.t(TYPE_GROUP_NAME.billing) });
  await expect(billing).toBeChecked();
  await expect(billing).toBeDisabled();
  const payments = page.getByRole('switch', { name: en.t(TYPE_GROUP_NAME.payments) });
  await expect(payments).toBeChecked();
  await page.getByText(en.t(TYPE_GROUP_NAME.payments), { exact: true }).click();
  await expect(payments).not.toBeChecked();

  await page.reload();
  await expect(payments).not.toBeChecked();
  await page
    .getByRole('radiogroup', { name: W('language') })
    .getByRole('radio', { name: LANGUAGE_META.hi.endonym })
    .click();
  await expect(
    page.getByRole('switch', { name: hi.t(TYPE_GROUP_NAME.payments) }),
  ).not.toBeChecked();
  await expect(page.getByRole('switch', { name: hi.t(TYPE_GROUP_NAME.billing) })).toBeChecked();
});

test('a person changes their name from Edit name, and the page and the account menu follow', async ({
  page,
}) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more/profile');

  await page.getByRole('button', { name: W('editName') }).click();
  const panel = page.getByRole('dialog', { name: en.t(FIRST_RUN_PROFILE.aboutTitle) });
  await expect(panel).toBeVisible();
  await expectNoSeriousViolations(page);
  const renamed = 'Anjali Joshi';
  await panel.getByLabel(en.t(FIRST_RUN_PROFILE.nameLabel)).fill(renamed);
  await panel.getByRole('button', { name: en.t(NAME_AND_PHOTO_EDITOR.save) }).click();
  await expect(panel).toBeHidden();
  await expect(page.locator('.hg-profile-preferences-name-words')).toHaveText(renamed);
  await expect(page.getByRole('button', { name: new RegExp(`^${renamed}`) })).toBeVisible();
  await page.reload();
  await expect(page.locator('.hg-profile-preferences-name-words')).toHaveText(renamed);
});
