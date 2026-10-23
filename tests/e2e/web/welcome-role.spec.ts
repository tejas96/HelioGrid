import { roleCard } from '@heliogrid/domain';
import { COMPANY_SIGNUP, createTranslator, roleCardWords, SIGN_IN } from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany, requestCode, typeCode } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';

const en = await createTranslator('en');

/*
 * `/welcome/role` (`SCR-M01-10`, `M01-15`): the role card at first run. A visitor with no role to
 * read goes where `/home` sends them; anyone with a company reads their card and its act takes them
 * home for good. CI runs no worker, so no flow here can mint a live invite link: the hand-offs from
 * the landing and First-Run Profile are proven on the stack (`T-M01-010c` QA rows).
 */
test('signed out, /welcome/role goes home, whose gate opens the door', async ({ page }) => {
  await page.goto('/welcome/role');

  await expect(page.getByRole('heading', { name: en.t(SIGN_IN.signIn) })).toBeVisible();
});

test('a verified number with no company yet is sent on to the company step', async ({ page }) => {
  await page.goto('/company-signup');
  await typeCode(page, en, await requestCode(page, en, freshMobile()));
  await page.getByRole('button', { name: en.t(COMPANY_SIGNUP.verifyAndContinue) }).click();
  const companyName = page.getByRole('textbox', { name: en.t(COMPANY_SIGNUP.companyName) });
  await expect(companyName).toBeVisible();
  await page.goto('/welcome/role');

  await expect(page).toHaveURL(/\/company-signup$/);
  await expect(companyName).toBeVisible();
});

test('a new owner opens the card: every grant, no limits, no note; the act goes home for good', async ({
  page,
}) => {
  const company = await createCompany(page, en, freshMobile());
  const words = roleCardWords(en.t, roleCard(['epc_owner']), {
    companyName: company,
    setterName: null,
    owners: null,
  });
  await page.goto('/welcome/role');

  await expect(page.getByRole('heading', { level: 1, name: words.title })).toBeVisible();
  await expect(page.locator('.hg-role-card-presets')).toHaveText(words.presets);
  await expect(page.locator('.hg-role-card-phrase')).toHaveText(
    words.grants.map((line) => line.text),
  );
  await expect(page.locator('.hg-role-card-section')).toHaveCount(1);
  await expect(page.getByRole('note')).toHaveCount(0);
  await expect(page.locator('.hg-role-card-credit')).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  await page.getByRole('button', { name: words.act }).click();
  await expect(page).toHaveURL(/\/home$/);
  await page.goBack();
  await expect(page).not.toHaveURL(/\/welcome\/role$/);
});
