import {
  type BillingUsage,
  type BillingUsageEvents,
  type BillingUsageSignals,
  billingUsageEventsSchema,
  billingUsageSchema,
  billingUsageSignalsSchema,
} from '@heliogrid/contracts';
import { createTranslator, settingsRowName, usagePageWords, usageViewWords } from '@heliogrid/i18n';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { at } from '../support/billing-home';
import { createCompany, OWNER_NAME } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/usage` (`SCR-M12-04`): the Owner reads this cycle's meters against the company's limits,
 * what needs them, and one meter's events; anyone else sees which meter is at its cap and whose
 * screen this is, with no figure (`M12-56`). A fresh company is a real trial; no flow in CI can
 * drive a paid cycle, so a paid cycle is the company's own usage read back in that state — every
 * faked body is checked against its contract first.
 */
const en = await createTranslator('en');
const VIEW = usageViewWords(en.t, 'en');
const PAGE = usagePageWords(en.t);
const TITLE = settingsRowName(en.t, 'usage');
const CLEAR = { step: 'clear', pausesAt: null, resetsAt: null } as const;

async function openUsage(page: Page) {
  await page.goto('/more/usage');
  await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible();
}

/** A state chip by its word; the chip draws its tone's mark before the word (`StatusMark`). */
function chipIn(region: Locator | Page, word: string): Locator {
  return region.locator('.hg-status-chip').filter({ hasText: word });
}

/** The company's own usage read back as Pro, monthly — 320 of its 400 voice minutes used. */
function proAt80(real: BillingUsage): BillingUsage {
  return billingUsageSchema.parse({
    ...real,
    standing: {
      ...real.standing,
      state: 'active',
      phase: 'active',
      tier: 'pro',
      cycle: 'monthly',
      collection: 'mandate',
      trialEndsAt: null,
      pausesAt: null,
      graceEndsAt: null,
      paidPeriodEnd: at(20),
    },
    proposals: { ...real.proposals, limit: 1500, usage: CLEAR },
    activeProjects: { ...real.activeProjects, limit: 'unlimited', usage: CLEAR },
    voice: {
      usedMinutes: 320,
      limit: 400,
      rate: '6.00',
      soFar: null,
      usage: { step: 'warning', pausesAt: null, resetsAt: null },
    },
    storage: { ...real.storage, limitGb: 250, usage: CLEAR },
    extraCharges: null,
  });
}

async function startAsOwner(page: Page) {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
}

test('the default trial page draws both cards and the OTP meter, not billed', async ({ page }) => {
  await startAsOwner(page);
  await openUsage(page);
  await expect(page.getByRole('region', { name: VIEW.limits })).toBeVisible();
  await expect(page.getByRole('region', { name: VIEW.included })).toBeVisible();
  await expect(page.getByText(VIEW.otpCodes).first()).toBeVisible();
  await expect(chipIn(page, VIEW.notBilled).first()).toBeVisible();
  await expect(page.getByRole('button', { name: VIEW.pickAPlan })).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expect(page).toHaveTitle(/\S/);
  await expectNoSeriousViolations(page);
});

test('a meter at 80% shows in Needs you', async ({ page }) => {
  await startAsOwner(page);
  await page.route('**/billing/usage', async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, json: proAt80((await response.json()) as BillingUsage) });
  });
  await openUsage(page);
  const needs = page.getByRole('region', { name: VIEW.needsYou });
  await expect(needs).toBeVisible();
  await expect(needs).toContainText(VIEW.view.limits.voiceMinutes);
  await expect(chipIn(needs, VIEW.percentUsed(80))).toBeVisible();
  // A bundle at 80% bills on past its end: nothing on the page says a pause.
  await expect(chipIn(page, VIEW.chips.paused)).toHaveCount(0);
  await expect(chipIn(page, VIEW.chips.nearing).first()).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('the figures wait in place while the usage loads, then arrive', async ({ page }) => {
  await startAsOwner(page);
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/billing/usage', async (route) => {
    await held;
    await route.continue();
  });
  await page.goto('/more/usage');
  const included = page.getByRole('region', { name: VIEW.included });
  await expect(included).toBeVisible();
  // Loading keeps the list's own facts — the cards and OTP's chip — and no source line.
  await expect(chipIn(included, VIEW.notBilled)).toBeVisible();
  await expect(page.getByText(VIEW.view.actualUsage)).toHaveCount(0);
  release();
  await expect(page.getByText(VIEW.view.actualUsage).first()).toBeVisible();
});

test('a failed read says so and Try again reads it again', async ({ page }) => {
  await startAsOwner(page);
  let failing = true;
  await page.route('**/billing/usage', (route) => (failing ? route.abort() : route.continue()));
  await openUsage(page);
  const retry = page.getByRole('button', { name: PAGE.tryAgain });
  await expect(page.getByText(PAGE.errorTitle)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('region', { name: VIEW.limits })).toHaveCount(0);
  // Error closes the meter cards and keeps the way to a bigger plan (decision 15).
  await expect(page.getByRole('button', { name: VIEW.biggerPlans })).toBeVisible();
  failing = false;
  await retry.click();
  await expect(page.getByRole('region', { name: VIEW.limits })).toBeVisible();
  await expect(page.getByText(VIEW.view.actualUsage).first()).toBeVisible();
});

test('the voice ledger opens from its named opener, says when it holds no call, and closes back', async ({
  page,
}) => {
  await startAsOwner(page);
  await page.route('**/billing/usage/events*', async (route) => {
    const response = await route.fetch();
    const real = (await response.json()) as BillingUsageEvents;
    const none: BillingUsageEvents = billingUsageEventsSchema.parse({
      ...real,
      items: [],
      totalCount: 0,
    });
    await route.fulfill({ response, json: none });
  });
  await openUsage(page);
  const opener = page.getByRole('button', { name: PAGE.eventsOf(VIEW.view.limits.voiceMinutes) });
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText(VIEW.noCalls.title)).toBeVisible();
  await expect(page.getByText(VIEW.noCalls.body)).toBeVisible();
  await page.getByRole('button', { name: PAGE.close }).click();
  await expect(page.getByText(VIEW.noCalls.title)).toHaveCount(0);
  await expect(opener).toBeFocused();
});

/**
 * As in `more-billing.spec.ts`, the reader is the owner's own session read back as a Sales
 * Manager's, and the signals read back with proposals paused: the page asks the signals alone,
 * which carry no figure (`M12-56`).
 */
test('a person who is not the Owner sees the chip and whose screen it is, with no figure', async ({
  page,
}) => {
  await startAsOwner(page);
  await page.route('**/auth/session', async (route) => {
    const response = await route.fetch();
    const projection = await response.json();
    const membership =
      projection.membership === null
        ? null
        : { ...projection.membership, roles: ['sales_manager'] };
    await route.fulfill({ response, json: { ...projection, membership } });
  });
  const paused: BillingUsageSignals = billingUsageSignalsSchema.parse({
    signals: [{ meter: 'proposals', usage: { step: 'paused', pausesAt: null, resetsAt: at(10) } }],
  });
  await page.route('**/billing/usage/signals', (route) => route.fulfill({ json: paused }));

  await openUsage(page);
  const needs = page.getByRole('region', { name: VIEW.needsYou });
  await expect(needs).toContainText(VIEW.proposals);
  await expect(chipIn(needs, VIEW.paused)).toBeVisible();
  const scope = VIEW.scope({ owners: [{ name: OWNER_NAME }], more: 0 });
  await expect(page.getByText(scope ?? '')).toBeVisible();
  await expect(page.getByRole('region', { name: VIEW.limits })).toHaveCount(0);
  await expect(page.getByRole('region', { name: VIEW.included })).toHaveCount(0);
  await expect(page.getByText(/₹/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: VIEW.biggerPlans })).toHaveCount(0);
  await expectNoSeriousViolations(page);
});
