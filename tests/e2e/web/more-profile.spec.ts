import {
  createTranslator,
  LANGUAGE_META,
  PROFILE_PREFERENCES,
  presetName,
  settingsRowName,
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
 * across a reload, with no Save; a language redraws the page in place (`F3-03`, `F3-04`, `F3-23`).
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
