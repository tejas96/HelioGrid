import { COMPANY_SIGNUP, createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { type Browser, expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany, expectNumberFieldRinged, fillCompanyStep } from '../support/door';
import { expectTheLook } from '../support/look';
import { freshMobile } from '../support/phone';

const en = await createTranslator('en');

test('the signup door opens to its first step with every control named, its ask at the heading and the helper on the field', async ({
  page,
}) => {
  await page.goto('/company-signup');

  await expect(
    page.getByRole('heading', { name: en.t(COMPANY_SIGNUP.createYourCompany) }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: en.t(COMPANY_SIGNUP.asksLabel) })).toBeVisible();
  await expect(page.getByText(en.t(COMPANY_SIGNUP.numberHelper))).toBeVisible();
  await expectNoSeriousViolations(page);
  await expectNumberFieldRinged(page, en);
  await expectTheLook(page);
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

test('a request with no answer keeps the steer, never says nothing was sent, and sends again', async ({
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
  await expect(page.getByText(en.t(COMPANY_SIGNUP.noAnswer))).toBeVisible();
  await expect(page.getByText(en.t(COMPANY_SIGNUP.requestMayHaveGone))).toBeVisible();
  await expect(page.getByText(en.t(COMPANY_SIGNUP.requestFailedBody))).toHaveCount(0);
  await expect(anyway).toBeEnabled();
  await expectNoSeriousViolations(page);

  await page.unroute('**/tenants/join-requests');
  await page.getByRole('button', { name: en.t(COMPANY_SIGNUP.sendRequestAgain) }).click();
  await expect(page.getByRole('heading', { name: en.t(COMPANY_SIGNUP.sentTitle) })).toBeVisible();
});

/*
 * `F8-36`: a create with no answer may have made the company, so the step never says nothing was
 * created. Here the first send never arrived, so Try again creates it.
 */
test('a create with no answer says the company may have been made, and Try again lands home', async ({
  page,
}) => {
  const mobile = freshMobile();
  await fillCompanyStep(page, en, mobile, `E2E ${mobile.national}`);
  await page.route('**/tenants', (route) => route.abort());
  await page.getByRole('button', { name: en.t(COMPANY_SIGNUP.createCompany) }).click();

  await expect(
    page.getByRole('heading', { name: en.t(COMPANY_SIGNUP.couldNotConfirm) }),
  ).toBeVisible();
  await expect(page.getByText(en.t(COMPANY_SIGNUP.mayHaveBeenMade))).toBeVisible();
  await expect(page.getByText(en.t(COMPANY_SIGNUP.nothingCreated))).toHaveCount(0);
  await expectNoSeriousViolations(page);

  await page.unroute('**/tenants');
  await page.getByRole('button', { name: en.t(SIGN_IN.tryAgain) }).click();
  await expect(page).toHaveURL(/\/home$/);
});
