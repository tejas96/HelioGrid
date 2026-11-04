import type { BillingHome, BillingStanding, PlanChangePreview } from '@heliogrid/contracts';
import type { Tier } from '@heliogrid/domain';
import {
  BILLING_HOME,
  BILLING_STATE_WORD,
  billingStripWords,
  createTranslator,
  PLAN_SELECTION,
  PRICING,
  tierName,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { at, paidHome } from '../support/billing-home';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll, settledBox } from '../support/layout';
import { freshMobile } from '../support/phone';
import { conversionOf, previewOf } from '../support/plan-previews';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/billing/plans` (`SCR-M12-03`): the plans, one review before anything moves, and the
 * handoff. A fresh company is a real trial; no flow in CI drives a gateway, so a paid state is the
 * company's own home read back in it, and each pick's preview and act answer as the contract
 * shapes them — the api's own answers are `apps/api/tests/billing/plan-change-*.test.ts`'s.
 */
const en = await createTranslator('en');
const P = PLAN_SELECTION;
/** The company's own home, read back through `shape`; each pick answers its preview. */
async function readsAs(
  page: Page,
  shape: (home: BillingHome) => BillingHome,
  preview: (tier: string, cycle: string) => PlanChangePreview = previewOf,
) {
  await page.route('**/billing/home', async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, json: shape((await response.json()) as BillingHome) });
  });
  await page.route('**/billing/plan-change/preview?*', async (route) => {
    const query = new URL(route.request().url()).searchParams;
    await route.fulfill({ json: preview(query.get('tier') ?? '', query.get('cycle') ?? '') });
  });
}

async function openPlans(page: Page) {
  await page.goto('/more/billing/plans');
  await expect(page.getByRole('heading', { level: 1, name: en.t(PRICING.plans) })).toBeVisible();
}

const plan = (page: Page, tier: Tier) =>
  page.getByRole('radio', { name: new RegExp(`^${tierName(tier)}`) });
const review = (page: Page) => page.getByRole('dialog', { name: en.t(P.review) });

async function start(page: Page) {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
}

test('the default: your plan, the plans, and an act that waits for a pick', async ({ page }) => {
  await start(page);
  await readsAs(page, paidHome);
  await openPlans(page);
  const held = page.getByRole('region', { name: en.t(BILLING_HOME.yourPlan) });
  await expect(
    held.locator('.hg-status-chip').filter({ hasText: en.t(BILLING_STATE_WORD.active) }),
  ).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: en.t(P.choosePlan) })).toBeVisible();
  await expect(page.getByRole('button', { name: en.t(P.reviewChange) })).toBeDisabled();
  await expect(page.getByRole('button', { name: en.t(PRICING.talkToSales) })).toBeVisible();
  await expect(page.getByText(en.t(P.compareAll)).first()).toBeVisible();
  await expect(review(page)).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('an upgrade’s review shows the part of this cycle and pays on the provider’s own page', async ({
  page,
}) => {
  await start(page);
  await readsAs(page, paidHome);
  const pageUrl = new URL('/gateway-page', page.url()).toString();
  await page.route('**/billing/plan-change', (route) =>
    route.fulfill({ json: { outcome: 'page', checkoutUrl: pageUrl } }),
  );
  await openPlans(page);
  await plan(page, 'pro').click();
  await page.getByRole('button', { name: en.t(P.reviewChange) }).click();
  const sheet = review(page);
  await expect(sheet).toContainText(en.t(P.whatChanges));
  await expect(sheet).toContainText(en.t(P.totalToday));
  await expect(sheet).toContainText('3,200.00');
  await expect(sheet).toContainText(en.t(P.lineNow));
  const gateway = page.context().waitForEvent('page');
  await sheet.getByRole('button', { name: /3,200\.00/ }).click();
  expect((await gateway).url()).toBe(pageUrl);
});

test("a downgrade's review shows what it blocks before its confirm", async ({ page }) => {
  await start(page);
  await readsAs(page, paidHome);
  let scheduled = 0;
  await page.route('**/billing/plan-change', async (route) => {
    scheduled += 1;
    await route.fulfill({ json: { outcome: 'scheduled', effectiveAt: at(16) } });
  });
  await openPlans(page);
  await plan(page, 'starter').click();
  await page.getByRole('button', { name: en.t(P.reviewChange) }).click();
  const sheet = review(page);
  const blocks = sheet.getByText(en.t(P.blocksTitle, { plan: tierName('starter') }));
  const confirm = sheet.getByRole('button', { name: en.t(P.scheduleDowngrade) });
  await expect(blocks).toBeVisible();
  await expect(sheet).toContainText(en.t(PRICING.storage));
  await expect(sheet).toContainText(
    en.t(P.usedOf, { used: '32', limit: en.t(PRICING.storageGb, { amount: '10' }) }),
  );
  await expect(sheet).toContainText(en.t(P.noRefund));
  /* The block is the consent surface: it stands above the act that confirms it (`M12-49`). */
  expect((await settledBox(blocks)).y).toBeLessThan((await settledBox(confirm)).y);
  expect(scheduled).toBe(0);
  await confirm.click();
  await expect(page).toHaveURL(/\/more\/billing$/);
  expect(scheduled).toBe(1);
});

test('a monthly-to-yearly switch costs nothing today and starts at the cycle’s end', async ({
  page,
}) => {
  await start(page);
  await readsAs(page, paidHome);
  await openPlans(page);
  await page.getByRole('tab', { name: en.t(PRICING.yearly) }).click();
  await plan(page, 'growth').click();
  await page.getByRole('button', { name: en.t(P.reviewChange) }).click();
  const sheet = review(page);
  await expect(sheet).toContainText(en.t(P.yearlyStarts));
  await expect(sheet).toContainText('0.00');
  await expect(sheet.getByRole('button', { name: en.t(P.switchToYearly) })).toBeVisible();
  await expect(sheet).toContainText(en.t(P.lineAtStart));
});

test('an expired trial picks its plan here while its work still reads and exports', async ({
  page,
}) => {
  await start(page);
  await readsAs(
    page,
    (home) => ({
      ...home,
      standing: { ...home.standing, state: 'expired', phase: 'expired', trialEndsAt: at(-1) },
    }),
    conversionOf,
  );
  const checkoutUrl = new URL('/gateway-checkout', page.url()).toString();
  const sent: unknown[] = [];
  await page.route('**/billing/checkout', async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({ json: { checkoutUrl } });
  });
  await openPlans(page);
  /* The strip says what still works — reading and export — with no act: its act led here. */
  await expect(page.getByText(billingStripWords(en.t).stillWorks).first()).toBeVisible();
  const held = page.getByRole('region', { name: en.t(BILLING_HOME.yourPlan) });
  await expect(held).toContainText(en.t(BILLING_STATE_WORD.expired));
  await plan(page, 'growth').click();
  await page.getByRole('button', { name: en.t(P.reviewChange) }).click();
  const sheet = review(page);
  await expect(sheet).toContainText(en.t(P.paidCycleStarts));
  await expect(sheet).toContainText('3,999.00');
  const gateway = page.context().waitForEvent('page');
  await sheet.getByRole('button', { name: /3,999\.00/ }).click();
  expect((await gateway).url()).toBe(checkoutUrl);
  expect(sent).toEqual([{ tier: 'growth', cycle: 'monthly' }]);
});

test('a handoff the gateway refused leaves the trial as it was and says so', async ({ page }) => {
  await start(page);
  await readsAs(page, (home) => home, conversionOf);
  await page.route('**/billing/checkout', (route) =>
    route.fulfill({
      status: 502,
      json: { error: { code: 'GATEWAY_UNAVAILABLE', message: 'down', requestId: 'e2e' } },
    }),
  );
  await openPlans(page);
  await plan(page, 'growth').click();
  await page.getByRole('button', { name: en.t(P.reviewChange) }).click();
  await review(page)
    .getByRole('button', { name: /3,999\.00/ })
    .click();
  await expect(page.getByText(en.t(P.failedPayment))).toBeVisible();
  await expect(review(page)).toHaveCount(0);
  const held = page.getByRole('region', { name: en.t(BILLING_HOME.yourPlan) });
  await expect(held).toContainText(en.t(BILLING_STATE_WORD.trialing));
});

/**
 * As in `more-billing.spec.ts`, the reader is the owner's own session read back as a Sales
 * Manager's: the page reads the standing alone, draws the plans with no price and no act, and
 * names whose act it is (`M12-56`).
 */
test('a member sees the plans and whose act it is, with no price', async ({ page }) => {
  await start(page);
  await page.route('**/auth/session', async (route) => {
    const response = await route.fetch();
    const projection = await response.json();
    const membership =
      projection.membership === null
        ? null
        : { ...projection.membership, roles: ['sales_manager'] };
    await route.fulfill({ response, json: { ...projection, membership } });
  });
  await page.route('**/billing/standing', async (route) => {
    const response = await route.fetch();
    const standing = (await response.json()) as BillingStanding;
    const active: BillingStanding = {
      ...standing,
      state: 'active',
      phase: 'active',
      tier: 'growth',
      cycle: 'monthly',
      collection: 'mandate',
      trialEndsAt: null,
      paidPeriodEnd: at(20),
    };
    await route.fulfill({ response, json: active });
  });
  await openPlans(page);
  await expect(page.getByText(en.t(P.changeThisPlan), { exact: false })).toBeVisible();
  await expect(page.getByRole('radiogroup')).toHaveCount(0);
  await expect(page.getByRole('button', { name: en.t(P.reviewChange) })).toHaveCount(0);
  await expect(page.getByText('₹')).toHaveCount(0);
  await expectNoSeriousViolations(page);
});
