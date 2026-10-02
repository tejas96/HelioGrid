import {
  createTranslator,
  doorTitle,
  firstRunMarkWords,
  homeTitle,
  SHELL,
  verbLabel,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany, expectNoSidewaysScroll } from '../support/door';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

const en = await createTranslator('en');
const ownerHome = homeTitle(en.t, 'epc_owner');
const addLead = verbLabel(en.t, 'add_lead');
const verbMark = firstRunMarkWords(en.t, 'centre-action', 'epc_owner', 'add_lead');

test('signed out, home sends a visitor to the door', async ({ page }) => {
  await page.goto('/home');

  await expect(page).toHaveURL(/\/login$/);
});

test('a new owner lands on their home inside the shell, with one mark on the verb', async ({
  page,
}) => {
  const mobile = freshMobile();
  await createCompany(page, en, mobile);

  await expect(page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) })).toBeVisible();
  await expect(page.getByText(`E2E ${mobile.national}`)).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: ownerHome })).toBeAttached();
  await expect(page.getByRole('button', { name: addLead })).toBeVisible();
  await expect(page.getByText(verbMark?.body ?? '')).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  await passTheOwnersMark(page, en);
  await expect(page.getByText(verbMark?.body ?? '')).toBeHidden();
  await page.reload();
  await expect(page.getByRole('button', { name: addLead })).toBeVisible();
  await expect(page.getByText(verbMark?.body ?? '')).toBeHidden();
});

test('the verb opens its door once, however fast it is pressed', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);

  await page.getByRole('button', { name: addLead }).dblclick();

  await expect(page).toHaveURL(/\/add-lead$/);
  await expect(
    page.getByRole('heading', { level: 1, name: doorTitle(en.t, 'add_lead') }),
  ).toBeAttached();
  await page.goBack();
  await expect(page).toHaveURL(/\/home$/);
});

test('the account menu holds the grievance contact and sign-out', async ({ page }) => {
  const mobile = freshMobile();
  await createCompany(page, en, mobile);
  await passTheOwnersMark(page, en);
  const account = page.getByRole('button', {
    name: en.t(SHELL.accountOf, { name: `Owner ${mobile.national}` }),
  });

  await account.click();
  await page.getByRole('menuitem', { name: en.t(SHELL.grievanceOfficer) }).click();
  await expect(page.getByText(en.t(SHELL.grievanceNotPublished))).toBeVisible();
  await page.keyboard.press('Escape');

  await account.click();
  await page.getByRole('menuitem', { name: en.t(SHELL.signOut) }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("the home's blocks say when its work could not be read", async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await page.route('**/tenants/me', (route) => route.abort());
  await page.route('**/tenants/me/membership', (route) => route.abort());

  await page.reload();

  await expect(page.getByText(en.t(SHELL.couldNotLoad)).first()).toBeVisible();
  await expect(page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) })).toBeVisible();
});
