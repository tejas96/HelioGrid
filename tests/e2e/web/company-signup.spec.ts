import { COMPANY_SIGNUP, createTranslator } from '@heliogrid/i18n';
import { type Browser, expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany, fillCompanyStep } from '../support/door';
import { freshMobile } from '../support/phone';

const en = await createTranslator('en');

test('the signup door opens to its first step with every control named', async ({ page }) => {
  await page.goto('/company-signup');

  await expect(
    page.getByRole('heading', { name: en.t(COMPANY_SIGNUP.createYourCompany) }),
  ).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('a new number verifies, names its company in one step and lands on home', async ({ page }) => {
  await createCompany(page, en, freshMobile());
});

/**
 * A second person types a company that already exists (`M01-09`): the steer offers both roads
 * full-size. The company is made first in a browser of its own, so the two people never share a
 * session.
 */
async function steeredTo(browser: Browser, page: Page): Promise<void> {
  const owner = await browser.newContext();
  const company = await createCompany(await owner.newPage(), en, freshMobile());
  await owner.close();

  await fillCompanyStep(page, en, freshMobile(), company.toLowerCase());
  await page.getByRole('button', { name: en.t(COMPANY_SIGNUP.createCompany) }).click();
  await expect(page.getByRole('heading', { name: en.t(COMPANY_SIGNUP.joinTitle) })).toBeVisible();
  await expect(
    page.getByRole('button', { name: en.t(COMPANY_SIGNUP.requestToJoin) }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: en.t(COMPANY_SIGNUP.createAnyway) })).toBeVisible();
}

test('a company that already exists steers to joining it, and the request lands on request-sent', async ({
  browser,
  page,
}) => {
  await steeredTo(browser, page);
  await expectNoSeriousViolations(page);

  await page.getByRole('button', { name: en.t(COMPANY_SIGNUP.requestToJoin) }).click();
  await expect(page.getByRole('heading', { name: en.t(COMPANY_SIGNUP.sentTitle) })).toBeVisible();
  await expect(
    page.getByRole('button', { name: en.t(COMPANY_SIGNUP.createOwnInstead) }),
  ).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('the steer is a steer: creating a new company anyway still creates it', async ({
  browser,
  page,
}) => {
  await steeredTo(browser, page);

  await page.getByRole('button', { name: en.t(COMPANY_SIGNUP.createAnyway) }).click();
  await expect(page).toHaveURL(/\/home$/);
});

test('a request that does not go through keeps the steer, says so, and sends again', async ({
  browser,
  page,
}) => {
  await steeredTo(browser, page);
  const anyway = page.getByRole('button', { name: en.t(COMPANY_SIGNUP.createAnyway) });
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/tenants/join-requests', async (route) => {
    await held;
    await route.abort();
  });

  await page.getByRole('button', { name: en.t(COMPANY_SIGNUP.requestToJoin) }).click();
  await expect(anyway).toBeDisabled();
  release();
  await expect(page.getByText(en.t(COMPANY_SIGNUP.requestFailedTitle))).toBeVisible();
  await expect(anyway).toBeEnabled();
  await expectNoSeriousViolations(page);

  await page.unroute('**/tenants/join-requests');
  await page.getByRole('button', { name: en.t(COMPANY_SIGNUP.sendRequestAgain) }).click();
  await expect(page.getByRole('heading', { name: en.t(COMPANY_SIGNUP.sentTitle) })).toBeVisible();
});
