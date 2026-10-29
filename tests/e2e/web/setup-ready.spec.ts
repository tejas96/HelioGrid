import { createTranslator, SHELL, setupReadyWords } from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import {
  passCompanyProfileStep,
  passWhatYouSellStep,
  reachWhatYouSellStep,
  readyStep,
  skipInviteStep,
} from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';

/**
 * *You're ready*, setup's last screen (`SCR-M01-06`, `M01-26`). Like the steps before it, it has no
 * address of its own: the inside group's gate draws it where the shell would be, so this file is
 * named for the screen and holds no look — its measures are `components/SetupReady.spec.tsx`'s.
 */
const en = await createTranslator('en');
const ready = setupReadyWords(en.t);

const shell = (page: Page) => page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) });

/** A new number through signup and the steps before it, the invite skipped. Answers the company. */
async function reachReadyStep(page: Page): Promise<string> {
  const company = await reachWhatYouSellStep(page, en, freshMobile());
  await passWhatYouSellStep(page, en);
  await passCompanyProfileStep(page, en);
  await skipInviteStep(page, en);
  return company;
}

test('after the invite step the company is named and exactly two doors are offered; the demo door says it is not ready, and its Try again reads the company again', async ({
  page,
}) => {
  const company = await reachReadyStep(page);
  await expect(readyStep(page, en)).toBeVisible();
  await expect(page.getByText(ready.companyLine(company))).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([ready.lead.title]);
  await expect(page.getByText(ready.demo.failed)).toBeVisible();
  await expect(page.getByRole('button')).toHaveText([ready.lead.act, ready.tryAgain]);
  const reread = page.waitForResponse(
    (response) => response.request().method() === 'GET' && response.url().endsWith('/tenants/me'),
  );
  await page.getByRole('button', { name: ready.tryAgain }).click();
  expect((await reread).status()).toBe(200);
  await expect(page.getByText(ready.demo.failed)).toBeVisible();
  await expect(shell(page)).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('the first door records setup closed and opens Leads, and a reload stays there', async ({
  page,
}) => {
  await reachReadyStep(page);
  const recorded = page.waitForResponse(
    (response) =>
      response.request().method() === 'PUT' &&
      response.url().endsWith('/onboarding/progress/ready'),
  );
  await page.getByRole('button', { name: ready.lead.act }).click();
  const answer = await recorded;
  expect(answer.request().postDataJSON()).toEqual({ state: 'completed' });
  expect(answer.status()).toBe(200);
  expect((await answer.json()).steps.ready).toBe('completed');
  await expect(page).toHaveURL(/\/leads$/);
  await expect(shell(page)).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/leads$/);
  await expect(shell(page)).toBeVisible();
  await expect(readyStep(page, en)).toHaveCount(0);
});

test('a failed company read shows the wall with no door, and Try again opens the doors', async ({
  page,
}) => {
  const company = await reachWhatYouSellStep(page, en, freshMobile());
  await passWhatYouSellStep(page, en);
  await passCompanyProfileStep(page, en);
  await skipInviteStep(page, en);
  await expect(readyStep(page, en)).toBeVisible();
  // The profile step held the company already; a fresh load is what reads it again.
  await page.route('**/tenants/me', (route) => route.abort());
  await page.reload();

  await expect(page.getByText(ready.wall.title)).toBeVisible();
  await expect(page.getByText(ready.wall.line)).toBeVisible();
  await expect(page.getByRole('button', { name: ready.lead.act })).toHaveCount(0);
  await expectNoSeriousViolations(page);

  await page.unroute('**/tenants/me');
  await page.getByRole('button', { name: ready.tryAgain }).click();
  await expect(readyStep(page, en)).toBeVisible();
  await expect(page.getByText(ready.companyLine(company))).toBeVisible();
  await expect(page.getByRole('button', { name: ready.lead.act })).toBeFocused();
});
