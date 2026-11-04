import type { BillingHome, BillingUsage, EntitlementBlocked } from '@heliogrid/contracts';
import { billingStripWords, createTranslator, PROFILE_PREFERENCES } from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { at, GROWTH, paidHome } from '../support/billing-home';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `SCR-SHELL-06` on the web: the strip every inside page carries, its trial chip, and the one
 * denial a refused save opens. A fresh company is a real trial; no flow in CI drives a gateway or
 * a clock, so each other state is the company's own home read back in it, and a refusal is the
 * gate's own envelope — the api's refusals are `apps/api/tests/billing/`'s.
 */
const en = await createTranslator('en');
const W = billingStripWords(en.t);
const AMOUNT = '₹3,999.00';
const strip = (page: Page) => page.locator('.hg-billing-strip-slot');

/** The company's own home with a charge that failed `day` days ago. */
function pastDue(home: BillingHome, day: number): BillingHome {
  const paid = paidHome(home);
  return {
    ...paid,
    standing: {
      ...paid.standing,
      state: 'past_due',
      phase: day < 4 ? 'past_due_full_function' : 'past_due_metered_paused',
      stateEnteredAt: at(-day),
      pausesAt: at(4 - day),
      graceEndsAt: at(7 - day),
    },
    due: { sale: GROWTH, failedAt: at(-day), invoiceNumber: '2026-27/000902', payUrl: null },
    cancellable: false,
  };
}

function halted(home: BillingHome): BillingHome {
  const paid = paidHome(home);
  return {
    ...paid,
    standing: { ...paid.standing, state: 'halted', phase: 'halted', stateEnteredAt: at(-3) },
    reactivation: { tier: 'growth', cycle: 'monthly', sale: GROWTH, startsAt: null },
    cancellable: false,
  };
}

function expired(home: BillingHome): BillingHome {
  return {
    ...home,
    standing: { ...home.standing, state: 'expired', phase: 'expired', trialEndsAt: at(-1) },
  };
}

/**
 * Answers `pattern` with the api's own answer reshaped. A reload while the answer is out disposes
 * it; the handler then lets the request go, since the page that asked is gone.
 */
async function reshape<T>(page: Page, pattern: string, shape: (answer: T) => T) {
  await page.route(pattern, async (route) => {
    try {
      const response = await route.fetch();
      await route.fulfill({ response, json: shape((await response.json()) as T) });
    } catch {
      await route.abort().catch(() => undefined);
    }
  });
}

/** Reads the company's own home back through `shape`, until it is changed. */
async function homeAs(page: Page, shape: { current: (home: BillingHome) => BillingHome }) {
  await reshape<BillingHome>(page, '**/billing/home', (home) => shape.current(home));
}

async function signedInOwner(page: Page) {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
}

test('a fresh trial shows the quiet day count, and nothing else', async ({ page }) => {
  await signedInOwner(page);
  await expect(strip(page)).toContainText(W.trialDaysLeft(14));
  await expect(strip(page).getByRole('button')).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('each dunning rung draws its title, rows and act', async ({ page }) => {
  await signedInOwner(page);
  const shape = { current: (home: BillingHome) => home };
  await homeAs(page, shape);
  const rungs: {
    shape: (home: BillingHome) => BillingHome;
    title: string;
    rows: string[];
    act: string;
  }[] = [
    {
      shape: (home) => pastDue(home, 2),
      title: W.graceTitle(2, true),
      rows: [W.everythingIncluded, W.amountDue, W.meteredPause],
      act: W.updateMethod,
    },
    {
      shape: (home) => pastDue(home, 4),
      title: W.graceTitle(4, false),
      rows: [W.paused, W.matrix('past_due_metered_paused').paused, W.until],
      act: `Pay ${AMOUNT} now`,
    },
    {
      shape: (home) => pastDue(home, 6),
      title: W.finalWarning(6),
      rows: [W.paused, W.accountHalts],
      act: `Pay ${AMOUNT} now`,
    },
    {
      shape: (home) => ({ ...halted(home), due: pastDue(home, 7).due }),
      title: W.haltedTitle,
      rows: [W.paused, W.stillWorks, W.matrix('halted').stillWorks, W.howWorkedOut],
      act: `Reactivate with one payment of ${AMOUNT}`,
    },
  ];
  for (const rung of rungs) {
    shape.current = rung.shape;
    await page.reload();
    await expect(strip(page)).toContainText(rung.title);
    for (const row of rung.rows) await expect(strip(page)).toContainText(row);
    await expect(strip(page).getByRole('button', { name: rung.act })).toBeVisible();
  }
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('a cap’s grace and pause strips name the type and the date', async ({ page }) => {
  await signedInOwner(page);
  await homeAs(page, { current: paidHome });
  let step: 'warning' | 'grace' | 'paused' = 'warning';
  const usageOf = () => ({
    step,
    pausesAt: step === 'grace' ? at(3) : null,
    resetsAt: step === 'paused' ? at(12) : null,
  });
  await page.route('**/billing/usage/signals', (route) =>
    route.fulfill({ json: { signals: [{ meter: 'proposals', usage: usageOf() }] } }),
  );
  await reshape<BillingUsage>(page, '**/billing/usage', (usage) => ({
    ...usage,
    proposals: { used: 300, limit: 300, usage: usageOf() },
  }));
  const signalsRead = page.waitForResponse((response) =>
    response.url().endsWith('/billing/usage/signals'),
  );
  await page.reload();
  await signalsRead;
  // 80%: the usage screen warns; the shell draws nothing, and nothing is gated (`M12-34`).
  await expect(strip(page)).toHaveCount(0);

  step = 'grace';
  await page.reload();
  await expect(strip(page)).toContainText(
    W.capGrace('proposals', W.usedInGrace('proposals', '300', '300')),
  );
  await expect(strip(page)).toContainText(W.pauses('proposals'));
  await expect(strip(page).getByRole('button', { name: W.upgradePlan })).toBeVisible();

  step = 'paused';
  await page.reload();
  await expect(strip(page)).toContainText(
    W.capPaused('proposals', W.usedPaused('proposals', '300', '300')),
  );
  await expect(strip(page)).toContainText(W.cycleResets);

  // After the grace a new one is refused with the upgrade-or-next-cycle note.
  const blocked: EntitlementBlocked = {
    reason: 'cap',
    capability: 'sell_and_deliver',
    key: 'proposals_per_cycle',
    resetsAt: at(12),
  };
  await page.route('**/users/me', (route) =>
    route.request().method() === 'PATCH'
      ? route.fulfill({
          status: 403,
          json: {
            error: { code: 'ENTITLEMENT_BLOCKED', message: 'paused', requestId: 't', blocked },
          },
        })
      : route.fallback(),
  );
  await page.goto('/more/profile');
  await page
    .getByRole('radiogroup', { name: en.t(PROFILE_PREFERENCES.measurements) })
    .getByRole('radio', { name: en.t(PROFILE_PREFERENCES.feet) })
    .click();
  const denial = page.getByRole('dialog', { name: W.denied('sell_and_deliver') });
  await expect(denial).toContainText(W.limitOverline('proposals'));
  await expect(denial).toContainText(W.cycleResets);
  await expect(denial.getByRole('button', { name: W.upgradePlan })).toBeVisible();
  // Its act opens the plans, and the denial closes behind it.
  await denial.getByRole('button', { name: W.upgradePlan }).click();
  await expect(page).toHaveURL(/\/more\/billing\/plans$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('a refused save opens the denial with the matrix’s lists and one act', async ({ page }) => {
  await signedInOwner(page);
  await homeAs(page, { current: expired });
  const blocked: EntitlementBlocked = {
    reason: 'billing_state',
    capability: 'create_edit_records',
    phase: 'expired',
    haltsAt: null,
  };
  await page.route('**/users/me', (route) =>
    route.request().method() === 'PATCH'
      ? route.fulfill({
          status: 403,
          json: {
            error: { code: 'ENTITLEMENT_BLOCKED', message: 'paused', requestId: 't', blocked },
          },
        })
      : route.fallback(),
  );
  await page.goto('/more/profile');
  await expect(strip(page)).toContainText(W.matrix('expired').stillWorks);
  // The control is never off beforehand: the refusal comes at the attempt.
  const feet = page
    .getByRole('radiogroup', { name: en.t(PROFILE_PREFERENCES.measurements) })
    .getByRole('radio', { name: en.t(PROFILE_PREFERENCES.feet) });
  await expect(feet).toBeEnabled();
  await feet.click();
  const denial = page.getByRole('dialog', { name: W.denied('create_edit_records') });
  await expect(denial).toBeVisible();
  await expect(denial).toContainText(W.overline('expired'));
  await expect(denial).toContainText(W.matrix('expired').paused);
  await expectNoSeriousViolations(page);

  // Its act routes to Plan Selection, and Back returns to the page it was pressed on.
  await denial.getByRole('button', { name: W.pickPlan }).click();
  await expect(page).toHaveURL(/\/more\/billing\/plans$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/more\/profile$/);
});

test('the strip holds at 375 with its act on its own line', async ({ page }) => {
  await signedInOwner(page);
  await homeAs(page, { current: (home) => pastDue(home, 4) });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  await expect(strip(page).getByRole('button', { name: `Pay ${AMOUNT} now` })).toBeVisible();
  await expectNoSidewaysScroll(page);
});
