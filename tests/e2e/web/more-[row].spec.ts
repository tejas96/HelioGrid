import { createTranslator, destinationLabel, SHELL, settingsWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/[row]` (`SCR-SHELL-01`, *More: the settings list*): a row opens its screen's address
 * inside the shell — the shell's placeholder until that screen lands — with `More` still in view;
 * Back returns to where the row was opened from: the list page on the phone's width, the first
 * settings page beside the side list at the desktop width (`More` opens there); an address no row
 * owns is not found.
 */
const en = await createTranslator('en');
const WORDS = settingsWords(en.t);

test('a row opens its screen’s address inside the shell, More in view; Back returns to where it was opened', async ({
  page,
}, testInfo) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more');
  const rail = page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) });

  await page.getByRole('button', { name: WORDS.rows.roles }).click();

  await expect(page).toHaveURL(/\/more\/roles$/);
  await expect(page.getByRole('heading', { level: 1, name: WORDS.rows.roles })).toBeAttached();
  await expect(page.getByText(en.t(SHELL.comingLater))).toBeVisible();
  await expect(rail.getByRole('button', { name: destinationLabel(en.t, 'more') })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expectNoSidewaysScroll(page);
  await expect(page).toHaveTitle(/\S/);
  await expectNoSeriousViolations(page);

  await page.goBack();
  if (testInfo.project.name === 'desktop') {
    await expect(page).toHaveURL(/\/more\/profile$/);
    await expect(
      page
        .getByRole('navigation', { name: WORDS.title })
        .getByRole('button', { name: WORDS.rows.profile }),
    ).toHaveAttribute('aria-current', 'page');
  } else {
    await expect(page).toHaveURL(/\/more$/);
    await expect(page.getByRole('heading', { level: 1, name: WORDS.title })).toBeVisible();
  }
});

test('an address no row owns is not found, inside the shell', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);

  await page.goto('/more/not-a-row');

  await expect(page.getByRole('heading', { level: 1, name: en.t(SHELL.notFound) })).toBeAttached();
  await expect(page.getByRole('button', { name: en.t(SHELL.goToHome) })).toBeVisible();
});
