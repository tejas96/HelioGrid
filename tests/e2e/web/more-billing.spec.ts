import type { BillingHome, BillingStanding } from '@heliogrid/contracts';
import { type BillingState, billingNeedOf } from '@heliogrid/domain';
import {
  billingCancelWords,
  billingScopeWords,
  billingViewWords,
  createTranslator,
  PRICING,
  SHELL,
  settingsRowName,
} from '@heliogrid/i18n';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { at, GROWTH, GROWTH_SHOWN, paidHome } from '../support/billing-home';
import { createCompany, OWNER_NAME } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/billing` (`SCR-M12-02`, AC-4): the Owner sees each of the six states' surfaces and its one
 * act; anyone else sees the state and whose act it is, with no amount. A fresh company is a real
 * trial; no flow in CI can drive a gateway (it runs no worker and no gateway), so each paid state
 * is the company's own home read back in that state — the api's answers for each state are
 * `apps/api/tests/billing/billing-home.test.ts`'s.
 */
const en = await createTranslator('en');
const VIEW = billingViewWords(en.t);
const TITLE = settingsRowName(en.t, 'billing');
/** The company's own home, read back in `state` — the trial is the company's real one. */
function homeIn(state: BillingState, home: BillingHome, payUrl: string): BillingHome {
  if (state === 'trialing') return home;
  const paid = paidHome(home);
  const dead = { method: { ...paid.method, standing: 'ended' as const, manageUrl: null } };
  const reactivation = {
    tier: 'growth' as const,
    cycle: 'monthly' as const,
    sale: GROWTH,
    startsAt: null,
  };
  switch (state) {
    case 'active':
      return paid;
    case 'past_due':
      return {
        ...paid,
        standing: {
          ...paid.standing,
          state,
          phase: 'past_due_metered_paused',
          pausesAt: at(-1),
          graceEndsAt: at(3),
          stateEnteredAt: at(-4),
        },
        due: { sale: GROWTH, failedAt: at(-4), invoiceNumber: '2026-27/000902', payUrl },
        cancellable: false,
      };
    case 'halted':
      return {
        ...paid,
        ...dead,
        standing: { ...paid.standing, state, phase: 'halted', stateEnteredAt: at(-3) },
        reactivation,
        cancellable: false,
      };
    case 'expired':
      return {
        ...home,
        standing: { ...home.standing, state, phase: 'expired', trialEndsAt: at(-1) },
      };
    case 'cancelled':
      return {
        ...paid,
        ...dead,
        standing: { ...paid.standing, state },
        reactivation,
        cancellable: false,
      };
  }
}

/** The need's one act, as the page names it; `null` where nothing needs the Owner. */
function actOf(home: BillingHome): string | null {
  switch (billingNeedOf(home, Date.now())) {
    case 'pay':
    case 'renewal':
      return VIEW.pay;
    case 'refund':
      return VIEW.askRefund;
    case 'way_back':
    case 'running':
      return VIEW.reactivate;
    case 'pick_plan':
      return VIEW.pickPlan;
    case 'scheduled_change':
      return VIEW.scheduledChange.keepInstead('growth');
    case 'none':
      return null;
  }
}

async function openBilling(page: Page) {
  await page.goto('/more/billing');
  await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible();
}

const SIX_STATES: readonly BillingState[] = [
  'trialing',
  'active',
  'past_due',
  'halted',
  'expired',
  'cancelled',
];

/**
 * A state chip by its word. The chip draws its tone's glyph before the word (`StatusMark`, a
 * mark beside the label, never colour alone), so its text is never the word alone.
 */
function chipIn(region: Locator, word: string): Locator {
  return region.locator('.hg-status-chip').filter({ hasText: word });
}

test('the owner sees every billing surface and its act in each of the six states', async ({
  page,
}) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  let state: BillingState = 'trialing';
  const shown: Partial<Record<BillingState, BillingHome>> = {};
  const payUrl = new URL('/gateway-page', page.url()).toString();
  await page.route('**/billing/home', async (route) => {
    const response = await route.fetch();
    const home = homeIn(state, (await response.json()) as BillingHome, payUrl);
    shown[state] = home;
    await route.fulfill({ response, json: home });
  });

  for (state of SIX_STATES) {
    await openBilling(page);
    const plan = page.getByRole('region', { name: VIEW.yourPlan });
    await expect(plan).toBeVisible();
    await expect(chipIn(plan, VIEW.stateWord(state)).first()).toBeVisible();
    await expect(page.getByRole('region', { name: VIEW.paymentMethod })).toBeVisible();
    await expect(page.getByRole('region', { name: VIEW.invoices })).toBeVisible();

    const home = shown[state];
    if (home === undefined) throw new Error(`no home read in ${state}`);
    const act = actOf(home);
    if (act === null) {
      await expect(page.getByRole('region', { name: VIEW.needsYou })).toHaveCount(0);
    } else {
      await expect(page.getByRole('button', { name: act, exact: true })).toBeVisible();
    }
    const cancel = page.getByRole('button', { name: VIEW.cancelSubscription, exact: true });
    await expect(cancel).toHaveCount(home.cancellable ? 1 : 0);

    if (state === 'trialing') {
      await expectNoSidewaysScroll(page);
      await expect(page).toHaveTitle(/\S/);
      await expectNoSeriousViolations(page);
    }
    if (state === 'active') {
      await cancel.click();
      const ask = page.getByRole('dialog', { name: billingCancelWords(en.t).title });
      await expect(ask.getByRole('button', { name: billingCancelWords(en.t).skip })).toBeVisible();
      await ask.getByRole('button', { name: en.t(SHELL.close) }).click();
      await expect(ask).toHaveCount(0);
    }
    if (state === 'past_due') {
      await expect(page.getByRole('region', { name: VIEW.needsYou })).toContainText(GROWTH_SHOWN);
      const gateway = page.context().waitForEvent('page');
      await page.getByRole('button', { name: VIEW.pay, exact: true }).click();
      expect((await gateway).url()).toBe(payUrl);
    }
  }

  state = 'trialing';
  await openBilling(page);
  await page.getByRole('button', { name: VIEW.changePlan }).click();
  await expect(page).toHaveURL(/\/more\/billing\/plans$/);
  await expect(page.getByRole('heading', { level: 1, name: en.t(PRICING.plans) })).toBeVisible();
});

/**
 * Frame 16: a downgrade waiting for the paid period's end is the need — `Moving to Starter`, its
 * date and `Keep Growth instead`, which withdraws it and leaves the plan as it was (`M12-49`).
 */
test('a scheduled downgrade is kept away with one press, and nothing else changes', async ({
  page,
}) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  let scheduled = true;
  await page.route('**/billing/home', async (route) => {
    const response = await route.fetch();
    const paid = paidHome((await response.json()) as BillingHome);
    const scheduledChange = scheduled
      ? {
          kind: 'downgrade' as const,
          tier: 'starter' as const,
          cycle: 'monthly' as const,
          effectiveAt: at(20),
          afterwards: { list: '1999.00', taxRateBasisPoints: null, tax: null, total: '1999.00' },
        }
      : null;
    await route.fulfill({ response, json: { ...paid, scheduledChange } });
  });
  await page.route('**/billing/plan-change/withdraw', async (route) => {
    scheduled = false;
    await route.fulfill({ json: { withdrawn: true } });
  });
  await openBilling(page);
  const needs = page.getByRole('region', { name: VIEW.needsYou });
  await expect(needs).toContainText(VIEW.scheduledChange.movingTo('starter'));
  await expect(needs).toContainText(VIEW.scheduledChange.scheduled);
  const keep = page.getByRole('button', { name: VIEW.scheduledChange.keepInstead('growth') });
  await keep.click();
  await expect(page.getByRole('region', { name: VIEW.needsYou })).toHaveCount(0);
  await expect(page.getByRole('region', { name: VIEW.yourPlan })).toBeVisible();
});

/**
 * As in `more-payment-terms.spec.ts`, the reader is the owner's own session read back as a Sales
 * Manager's, its standing read back as a failed payment's: the page asks the standing alone, which
 * carries no amount (`M12-56`, D1).
 */
test('a member sees the state and whose act it is, with no amount', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
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
    const pastDue: BillingStanding = {
      ...standing,
      state: 'past_due',
      phase: 'past_due_metered_paused',
      tier: 'growth',
      cycle: 'monthly',
      collection: 'mandate',
      trialEndsAt: null,
      pausesAt: at(-1),
      graceEndsAt: at(3),
      paidPeriodEnd: at(20),
    };
    await route.fulfill({ response, json: pastDue });
  });

  await openBilling(page);

  const needs = page.getByRole('region', { name: VIEW.needsOwner });
  await expect(needs).toBeVisible();
  await expect(chipIn(needs, VIEW.stateWord('past_due'))).toBeVisible();
  const scope = billingScopeWords(en.t, { owners: [{ name: OWNER_NAME }], more: 0 });
  await expect(page.getByText(scope ?? '')).toBeVisible();
  await expect(page.getByRole('button', { name: VIEW.pay, exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: VIEW.paymentMethod })).toHaveCount(0);
  await expect(page.getByRole('region', { name: VIEW.invoices })).toHaveCount(0);
  await expect(page.getByText(/₹/)).toHaveCount(0);

  // On the company's own trial nothing needs the owner, and the page still names whose act it is.
  await page.unroute('**/billing/standing');
  await page.reload();
  await expect(page.getByRole('region', { name: VIEW.needsOwner })).toHaveCount(0);
  await expect(page.getByText(scope ?? '')).toBeVisible();
  await expect(page.getByText(/₹/)).toHaveCount(0);
  await expectNoSeriousViolations(page);
});
