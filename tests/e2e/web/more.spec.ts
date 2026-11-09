import { settingsRowsFor } from '@heliogrid/domain';
import {
  createTranslator,
  destinationLabel,
  NOTIFICATION_CENTRE,
  SHELL,
  settingsWords,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more` (`SCR-SHELL-01`, *More: the settings list*): on the phone's width the owner's `More`
 * opens the page titled Settings with the twelve rows the owner's presets open, in six groups,
 * `More` in view. At the shell's desktop width the sidebar holds the work and *Settings* only, as
 * OneOhm's does; *Settings* opens the owner's first settings page beside the settings side list,
 * and Back never returns to `/more`.
 */
const en = await createTranslator('en');
const WORDS = settingsWords(en.t);
const OWNER_ROWS = settingsRowsFor(['epc_owner']).flatMap((group) => group.rows);

test('More opens Settings: the owner’s twelve rows in six groups, More in view — or, at the desktop width, the first settings page beside them', async ({
  page,
}, testInfo) => {
  const mobile = freshMobile();
  await createCompany(page, en, mobile);
  await passTheOwnersMark(page, en);
  const rail = page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) });

  if (testInfo.project.name === 'desktop') {
    // No settings row sits in the sidebar: they live beside the settings pages.
    for (const row of OWNER_ROWS) {
      await expect(rail.getByRole('button', { name: WORDS.rows[row], exact: true })).toHaveCount(0);
    }
    const before = page.url();
    const settings = rail.getByRole('button', { name: WORDS.title, exact: true });
    await settings.click();
    await expect(settings).toHaveAttribute('aria-current', 'page');
    await expect(page).toHaveURL(/\/more\/profile$/);
    const side = page.getByRole('navigation', { name: WORDS.title });
    await expect(side.getByRole('button')).toHaveText(OWNER_ROWS.map((row) => WORDS.rows[row]));
    await expect(side.getByRole('button', { name: WORDS.rows.profile })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await side.getByRole('button', { name: WORDS.rows.billing }).click();
    await expect(side.getByRole('button', { name: WORDS.rows.billing })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page).toHaveURL(/\/more\/billing$/);
    await expect(settings).toHaveAttribute('aria-current', 'page');
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);
    // `/more` was replaced, so Back returns through the pages opened, never to `/more`.
    await page.goBack();
    await page.goBack();
    await expect(page).toHaveURL(before);

    // A sidebar press with the centre open closes it, so the side list it would hide stands.
    await page
      .getByRole('button', { name: en.t(NOTIFICATION_CENTRE.bellName, { count: 0 }), exact: true })
      .click();
    const centre = page.getByRole('dialog', { name: en.t(NOTIFICATION_CENTRE.title) });
    await expect(centre).toBeVisible();
    await settings.click();
    await expect(centre).toBeHidden();
    await expect(side).toBeVisible();
    return;
  }
  await rail.getByRole('button', { name: destinationLabel(en.t, 'more') }).click();
  await expect(rail.getByRole('button', { name: destinationLabel(en.t, 'more') })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page).toHaveURL(/\/more$/);
  await expect(page.getByRole('heading', { level: 1, name: WORDS.title })).toBeVisible();
  await expect(page.locator('.hg-settings-row-name')).toHaveText(
    OWNER_ROWS.map((row) => WORDS.rows[row]),
  );
  await expectNoSidewaysScroll(page);
  await expect(page).toHaveTitle(/\S/);
  await expectNoSeriousViolations(page);
});
