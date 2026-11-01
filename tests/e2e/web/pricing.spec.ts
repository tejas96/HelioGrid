import { formatMoney, IN_FORMATS, IN_PRICE_BOOK } from '@heliogrid/domain';
import { createTranslator, PRICING, SIGN_IN } from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';

const en = await createTranslator('en');
const PRICING_READ = '**/pricing/IN';

/** A price the India book lists, as the page prints it: the book's paise in whole rupees. */
function listed(tier: 'starter' | 'growth', cycle: 'monthly' | 'yearly'): string {
  const row = IN_PRICE_BOOK.tiers[tier];
  if (row === null || row.price.kind !== 'listed') throw new Error(`${tier} lists no price`);
  return formatMoney(IN_FORMATS, row.price.perCycle[cycle] / 100);
}

async function answered(page: Page, status: number, body: unknown): Promise<void> {
  await page.route(PRICING_READ, (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }),
  );
}

const refusal = (code: string) => ({ error: { code, message: code, requestId: 'e2e' } });

/*
 * `SCR-M12-01` — the public pricing page: the claim, the four plans with the India book's prices,
 * the cycle, the comparison, `Compared with` and the one trial act; and, where there are no prices
 * to read, the loading, the market with no book and the failed read, each without the trial act.
 */
test('renders normal and yearly from the India price list, signed out', async ({ page }, info) => {
  await page.goto('/pricing');

  await expect(page.getByRole('heading', { level: 1, name: en.t(PRICING.title) })).toBeVisible();
  await expect(page.getByText(en.t(PRICING.claim))).toBeVisible();
  await expect(page.getByText(listed('starter', 'monthly'), { exact: true })).toBeVisible();
  for (const name of ['Starter', 'Growth', 'Pro', 'Enterprise']) {
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByRole('button', { name: en.t(PRICING.talkToSales) })).toBeVisible();
  await expect(page.getByRole('button', { name: en.t(PRICING.startTrial) })).toBeVisible();
  await expect(page.getByText(en.t(PRICING.comparedWith)).first()).toBeVisible();
  await expect(page.getByText(/Prices exclude/)).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  await page.getByRole('tab', { name: en.t(PRICING.yearly) }).click();
  await expect(page.getByText(listed('starter', 'yearly'), { exact: true })).toBeVisible();

  if (info.project.name === 'phone') {
    await page.getByRole('button', { name: en.t(PRICING.compare) }).click();
    await expect(page.getByRole('tablist', { name: en.t(PRICING.against) })).toBeVisible();
  } else {
    await expect(page.getByText(en.t(PRICING.allPlans, { count: '4' })).first()).toBeAttached();
  }

  await page
    .getByRole('button', { name: en.t(PRICING.startTrial) })
    .first()
    .click();
  await expect(page).toHaveURL(/\/company-signup$/);
});

test('reads loading while the price list is out, with no trial act', async ({ page }) => {
  await page.route(PRICING_READ, () => undefined);
  await page.goto('/pricing');

  await expect(page.getByRole('status', { name: en.t(PRICING.loading) })).toBeVisible();
  await expect(page.getByText(en.t(PRICING.claim))).toBeVisible();
  await expect(page.getByRole('button', { name: en.t(PRICING.startTrial) })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: en.t(PRICING.monthly) })).toHaveCount(0);
});

test('says no prices are published for a market with no book, with no trial act', async ({
  page,
}) => {
  await answered(page, 404, refusal('NOT_FOUND'));
  await page.goto('/pricing');

  await expect(page.getByText(en.t(PRICING.emptyTitle))).toBeVisible();
  await expect(page.getByRole('button', { name: en.t(PRICING.startTrial) })).toHaveCount(0);
  await expect(page.getByText(en.t(PRICING.comparedWith))).toHaveCount(0);
  await expectNoSeriousViolations(page);
});

test('says the price list failed, and Try again reads it again', async ({ page }) => {
  await answered(page, 500, refusal('INTERNAL'));
  await page.goto('/pricing');

  await expect(page.getByText(en.t(PRICING.errorTitle))).toBeVisible();
  await expect(page.getByRole('button', { name: en.t(PRICING.startTrial) })).toHaveCount(0);
  await expectNoSeriousViolations(page);

  await page.unroute(PRICING_READ);
  await page.getByRole('button', { name: en.t(PRICING.retry) }).click();
  await expect(page.getByText(listed('starter', 'monthly'), { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: en.t(PRICING.plans) })).toBeFocused();
});

test('names a draft rate as not published, and says prices exclude GST once registered', async ({
  page,
}, info) => {
  await page.route(PRICING_READ, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    for (const plan of body.plans) {
      if (plan.voiceMinuteRate.kind === 'published') plan.voiceMinuteRate = { kind: 'unpublished' };
    }
    await route.fulfill({ response, json: { ...body, taxExcluded: true } });
  });
  await page.goto('/pricing');

  await expect(
    page.getByText(en.t(PRICING.pricesExclude, { scheme: 'GST' })).first(),
  ).toBeVisible();
  if (info.project.name === 'phone') {
    await page
      .getByRole('button', { name: en.t(PRICING.allLimits) })
      .nth(1)
      .click();
  } else {
    await page.getByRole('tab', { name: en.t(PRICING.setCharges) }).click();
  }
  await expect(page.getByText(en.t(PRICING.notPublished)).first()).toBeVisible();
});

test('Sign in leads to the door', async ({ page }) => {
  await page.goto('/pricing');
  await page.getByRole('button', { name: en.t(PRICING.signIn) }).click();
  await expect(page.getByRole('heading', { name: en.t(SIGN_IN.signIn) })).toBeVisible();
});
