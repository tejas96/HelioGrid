import { settingsRowsFor } from '@heliogrid/domain';
import { createTranslator, destinationLabel, SHELL, settingsWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { expectTheLook } from '../support/look';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more` (`SCR-SHELL-01`, *More: the settings list*): the owner's `More` opens the page titled
 * Settings with the twelve rows the owner's presets open, in six groups, `More` in view.
 */
const en = await createTranslator('en');
const WORDS = settingsWords(en.t);
const OWNER_ROWS = settingsRowsFor(['epc_owner']).flatMap((group) => group.rows);

test('More opens Settings: the owner’s twelve rows in six groups, More in view', async ({
  page,
}) => {
  const mobile = freshMobile();
  const company = await createCompany(page, en, mobile);
  await passTheOwnersMark(page, en);
  const rail = page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) });

  await rail.getByRole('button', { name: destinationLabel(en.t, 'more') }).click();

  await expect(page).toHaveURL(/\/more$/);
  await expect(page.getByRole('heading', { level: 1, name: WORDS.title })).toBeVisible();
  await expect(page.locator('.hg-settings-row-name')).toHaveText(
    OWNER_ROWS.map((row) => WORDS.rows[row]),
  );
  await expect(rail.getByRole('button', { name: destinationLabel(en.t, 'more') })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expectNoSidewaysScroll(page);
  await expect(page).toHaveTitle(/\S/);
  await expectNoSeriousViolations(page);
  // The person's tile names the owner, and the flow names each fresh owner by their number.
  await expectTheLook(page, [page.getByText(company), page.getByText(`Owner ${mobile.national}`)]);
});
