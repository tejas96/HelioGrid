import { firstNameOf, ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import {
  assignRolesWords,
  createTranslator,
  rolesReferenceWords,
  settingsWords,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany, OWNER_NAME } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/roles` (`SCR-M01-14`, `T-M01-014`): the twelve fixed roles behind `More`, each with how
 * many active people hold it, read from the Team roster. A new company's owner holds EPC Owner
 * alone, so that tile reads one person and every other reads zero. Assign Roles' round *Roles
 * reference* opens the same page, and its way back returns to the editor with the ticks kept.
 */
const en = await createTranslator('en');
const WORDS = settingsWords(en.t);
const [OWNER, SALES_MANAGER, , , , , , , , FINANCE] = ROLE_PRESETS;

test('the roles reference reads the roster', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more');

  await page.getByRole('button', { name: WORDS.rows.roles }).click();

  await expect(page).toHaveURL(/\/more\/roles$/);
  const words = rolesReferenceWords(en.t, null);
  await expect(page.getByRole('heading', { level: 1, name: words.title })).toBeVisible();
  const tiles = page.getByRole('list', { name: words.roles }).getByRole('button');
  await expect(tiles).toHaveCount(12);
  const name = (preset: RolePreset | undefined) =>
    words.presets.find((each) => each.value === preset)?.name ?? '';
  await expect(tiles.filter({ hasText: name(OWNER) })).toContainText('1 person');
  await expect(tiles.filter({ hasText: name(SALES_MANAGER) })).toContainText('0 people');
  await tiles.filter({ hasText: name(OWNER) }).click();
  await expect(page.getByRole('dialog')).toContainText(OWNER_NAME);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('Assign Roles opens the reference and comes back to its ticks', async ({ page }) => {
  const company = await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more/team');
  const roles = assignRolesWords(en.t, {
    firstName: firstNameOf(OWNER_NAME),
    companyName: company,
    locks: { epc_owner: 'sole-owner' },
  });
  await page.getByRole('main').getByRole('button', { name: OWNER_NAME, exact: true }).focus();
  await page.keyboard.press('Enter');
  const editor = page.getByRole('dialog', { name: new RegExp(OWNER_NAME, 'u') });
  const finance = editor.getByRole('checkbox', {
    name: roles.rows[ROLE_PRESETS.indexOf(FINANCE ?? 'finance')]?.title ?? '',
  });
  await finance.click();

  await editor.getByRole('button', { name: roles.reference }).click();

  await expect(page).toHaveURL(/\/more\/roles\?from=assign-roles$/);
  const words = rolesReferenceWords(en.t, null);
  await page.getByRole('button', { name: words.backToAssign }).click();
  await expect(page).toHaveURL(/\/more\/team$/);
  await expect(editor).toBeVisible();
  await expect(finance).toHaveAttribute('aria-checked', 'true');
});
