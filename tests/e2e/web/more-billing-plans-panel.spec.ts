import type { BillingHome } from '@heliogrid/contracts';
import type { Tier } from '@heliogrid/domain';
import {
  BILLING_HOME,
  compareGridWords,
  createTranslator,
  PLAN_SELECTION,
  PRICING,
  SHELL,
  tierName,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { paidHome } from '../support/billing-home';
import { createCompany } from '../support/door';
import { settledBox } from '../support/layout';
import { freshMobile } from '../support/phone';
import { previewOf } from '../support/plan-previews';
import { passTheOwnersMark } from '../support/shell';
import { expectTouchFloor } from '../support/touch-target';

/**
 * `/more/billing/plans` (`SCR-M12-03`), the review panel at width and the comparison on a trial —
 * beside `more-billing-plans.spec.ts`, which holds the route's landing and acts. The panel opens
 * beside the plans with the settings list stepped aside (brief decision 9, board d2), names its
 * Close in every language, and a trial's comparison marks no plan as its own (`M12-52`).
 */
const en = await createTranslator('en');
const hi = await createTranslator('hi');
const P = PLAN_SELECTION;

const plan = (page: Page, tier: Tier) =>
  page.getByRole('radio', { name: new RegExp(`^${tierName(tier)}`) });

async function start(page: Page, paid: boolean) {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  if (paid) {
    await page.route('**/billing/home', async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, json: paidHome((await response.json()) as BillingHome) });
    });
  }
  await page.route('**/billing/plan-change/preview?*', async (route) => {
    const query = new URL(route.request().url()).searchParams;
    await route.fulfill({ json: previewOf(query.get('tier') ?? '', query.get('cycle') ?? '') });
  });
}

test('at width the settings list steps aside while the review panel is open, and the panel leaves the plans their room', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'the side list and the panel are the 1536 layout');
  await start(page, true);
  await page.goto('/more/billing/plans');
  const side = page.locator('.hg-settings-page-side');
  await expect(side).toBeVisible();
  await plan(page, 'pro').click();
  await page.getByRole('button', { name: en.t(P.reviewChange) }).click();
  const panel = page.getByRole('dialog', { name: en.t(P.review) });
  await expect(panel).toBeVisible();
  /* Fix 1 holds on these two: the list stepped aside, and no card sits under the panel. */
  await expect(side).toBeHidden();
  const cards = await settledBox(page.getByRole('radiogroup', { name: en.t(P.choosePlan) }));
  const sheet = await settledBox(panel);
  expect(cards.x + cards.width).toBeLessThanOrEqual(sheet.x);
  await panel.getByRole('button', { name: en.t(SHELL.close) }).click();
  await expect(panel).toHaveCount(0);
  await expect(side).toBeVisible();
});

test('the review panel names its Close in Hindi, at the touch floor', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'the side panel is the 1536 form');
  await start(page, true);
  await page.route('**/auth/session', async (route) => {
    const response = await route.fetch();
    const projection = await response.json();
    await route.fulfill({
      response,
      json: { ...projection, actor: { ...projection.actor, interfaceLanguage: 'hi' } },
    });
  });
  await page.goto('/more/billing/plans');
  await plan(page, 'pro').click();
  await page.getByRole('button', { name: hi.t(P.reviewChange) }).click();
  const panel = page.getByRole('dialog', { name: hi.t(P.review) });
  /* Fix 2 holds on this: the panel's Close is there, named in Hindi, and 44 px each way. */
  const close = panel.getByRole('button', { name: hi.t(SHELL.close) });
  await expect(close).toBeVisible();
  await expectTouchFloor([close]);
});

test('a trial’s comparison pairs two plans with neither marked its own', async ({ page }, info) => {
  await start(page, false);
  await page.goto('/more/billing/plans');
  const words = compareGridWords(en.t);
  const yourPlan = en.t(BILLING_HOME.yourPlan);
  if (info.project.name === 'desktop') {
    const matrix = page.getByRole('group', { name: words.compare(4) });
    await expect(matrix).toBeVisible();
    /* Fix 3 holds on this at width: no column of the matrix is the trial's own. */
    await expect(matrix.getByText(yourPlan, { exact: true })).toHaveCount(0);
    return;
  }
  await page.getByText(en.t(P.compareAll)).click();
  /* Fix 3 holds on these at 375: the pricing page's pair and caption, and no own column. */
  const caption = en.t(PRICING.pairCaption, {
    plan: tierName('growth'),
    against: tierName('pro'),
  });
  await expect(page.getByText(caption, { exact: true })).toBeVisible();
  await expect(page.getByRole('tablist', { name: en.t(PRICING.plan) })).toBeVisible();
  const pair = page.getByRole('group', { name: words.compare(2) });
  await expect(pair.getByText(yourPlan, { exact: true })).toHaveCount(0);
});
