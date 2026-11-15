import {
  createTranslator,
  proposalBuilderLeaveWords,
  proposalBuilderWords,
  proposalCheckWords,
  proposalStepListWords,
  proposalStepNames,
  proposalStepWords,
  proposalSystemStepWords,
  SHELL,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { ownerWithDraft } from '../support/proposal';

/**
 * `/proposals/<id>/build` (`SCR-M06-02`…`SCR-M06-13`): the rep, on a phone and in a hurry, come to
 * set a size and a price and generate. A focus screen — no sidebar, no bottom bar. Any step opens
 * at any time; a field saves when it is left and says so; Generate never dead-ends: it lists what
 * to fix, and each row opens its step.
 */
const en = await createTranslator('en');
const NAMES = proposalStepNames(en.t);
const STEP = proposalStepWords(en.t);
const LIST = proposalStepListWords(en.t, { quick: false });
/** The builder's flow walks every step, so its draft starts with Quick off. */
const ALL_STEPS = false;

/** The frame's words for this draft's customer; the first name is what the lines use. */
function frameWords(customerName: string) {
  const name = customerName.trim().split(/\s+/)[0] ?? customerName;
  return proposalBuilderWords(en.t, { name, fullName: customerName });
}

test('the builder lands as a focus screen on its first step', async ({ page }) => {
  const { proposal } = await ownerWithDraft(page, en, ALL_STEPS);
  const customerName = proposal.document.deal.clientName ?? '';
  await page.goto(`/proposals/${proposal.id}/build`);

  const words = frameWords(customerName);
  await expect(page.getByRole('button', { name: words.close })).toBeVisible();
  await expect(page.getByRole('heading', { name: NAMES.company.heading })).toBeVisible();
  // No app shell around a focus screen: no sidebar and no bottom bar.
  await expect(page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) })).toHaveCount(0);

  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('a step rides the address, so Back walks the steps', async ({ page }) => {
  const { proposal } = await ownerWithDraft(page, en, ALL_STEPS);
  await page.goto(`/proposals/${proposal.id}/build?step=system`);
  await expect(page.getByRole('heading', { name: NAMES.system.heading })).toBeVisible();

  await page.goto(`/proposals/${proposal.id}/build?step=payment`);
  await expect(page.getByRole('heading', { name: NAMES.payment.heading })).toBeVisible();

  await page.goBack();
  await expect(page.getByRole('heading', { name: NAMES.system.heading })).toBeVisible();
});

test('a price typed and left is saved, and the step says so', async ({ page }) => {
  const { proposal } = await ownerWithDraft(page, en, ALL_STEPS);
  const customerName = proposal.document.deal.clientName ?? '';
  await page.goto(`/proposals/${proposal.id}/build?step=system`);
  const system = proposalSystemStepWords(en.t, {
    name: customerName,
    taxName: '',
    taxRateText: '',
    taxRegistered: false,
    supplyPhase: null,
    maintenance: { kind: 'none', years: null },
  });

  const price = page.getByRole('textbox', { name: system.price });
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'PATCH' &&
      response.url().includes(`/proposals/${proposal.id}`),
  );
  await price.fill('190575');
  await price.blur();
  await saved;

  await expect(page.getByText(STEP.saved).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('textbox', { name: system.price })).toHaveValue(/1,?90,?575/);
});

test('Generate never dead-ends: it lists what to fix, and a row opens its step', async ({
  page,
}) => {
  const { proposal } = await ownerWithDraft(page, en, ALL_STEPS);
  const customerName = proposal.document.deal.clientName ?? '';
  await page.goto(`/proposals/${proposal.id}/build?step=bank`);
  const words = frameWords(customerName);

  // A fresh draft holds no components: Generate opens the check, which says so.
  await page
    .getByRole('button', { name: new RegExp(`^(${words.last}|${words.generate})`) })
    .first()
    .click();
  const check = proposalCheckWords(en.t, {
    check: { kind: 'blocked', blocks: 1, warnings: 0, firstStep: NAMES.components.title },
    quick: false,
  });
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText(check.note)).toBeVisible();

  await page.getByRole('dialog').getByRole('button', { name: /./ }).last().click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('with no connection the step keeps what was typed and says it is not saved', async ({
  page,
}) => {
  const { proposal } = await ownerWithDraft(page, en, ALL_STEPS);
  const customerName = proposal.document.deal.clientName ?? '';
  await page.goto(`/proposals/${proposal.id}/build?step=system`);
  const system = proposalSystemStepWords(en.t, {
    name: customerName,
    taxName: '',
    taxRateText: '',
    taxRegistered: false,
    supplyPhase: null,
    maintenance: { kind: 'none', years: null },
  });
  await page.waitForLoadState('networkidle');

  await page.route(`**/proposals/${proposal.id}`, (route) =>
    route.request().method() === 'PATCH' ? route.abort() : route.continue(),
  );
  const price = page.getByRole('textbox', { name: system.price });
  await price.fill('180000');
  await price.blur();

  await expect(page.getByText(STEP.notSaved).first()).toBeVisible();
  await expect(price).toHaveValue(/1,?80,?000/);
});

/*
 * `T-M06-023`: Close asks first while a value is not stored — kept unsaved here, the save refused by
 * the server — and *Keep editing* stays with the value; *Discard and leave* lets it go and opens the
 * lead. A draft with nothing held closes at once.
 */
test('Close asks before leaving a value that did not save, and leaves at once when none is held', async ({
  page,
}) => {
  const { leadId, proposal } = await ownerWithDraft(page, en, ALL_STEPS);
  const customerName = proposal.document.deal.clientName ?? '';
  await page.goto(`/proposals/${proposal.id}/build?step=system`);
  const words = frameWords(customerName);
  const leave = proposalBuilderLeaveWords(en.t);
  const system = proposalSystemStepWords(en.t, {
    name: customerName,
    taxName: '',
    taxRateText: '',
    taxRegistered: false,
    supplyPhase: null,
    maintenance: { kind: 'none', years: null },
  });
  await page.waitForLoadState('networkidle');
  await page.route(`**/proposals/${proposal.id}`, (route) =>
    route.request().method() === 'PATCH'
      ? route.fulfill({ status: 500, body: '{}' })
      : route.continue(),
  );
  const price = page.getByRole('textbox', { name: system.price });
  await price.fill('180000');
  await price.blur();
  await expect(page.getByText(STEP.notSaved).first()).toBeVisible();

  await page.getByRole('button', { name: words.close }).click();
  const ask = page.getByRole('dialog', { name: leave.title });
  await expect(ask).toBeVisible();
  await expect(ask.getByText(leave.body)).toBeVisible();
  await ask.getByRole('button', { name: leave.keep }).click();
  await expect(ask).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/proposals/${proposal.id}/build`));
  await expect(price).toHaveValue(/1,?80,?000/);

  await page.getByRole('button', { name: words.close }).click();
  await page
    .getByRole('dialog', { name: leave.title })
    .getByRole('button', { name: leave.discard })
    .click();
  await expect(page).toHaveURL(new RegExp(`/leads/${leadId}$`));

  await page.unrouteAll();
  await page.goto(`/proposals/${proposal.id}/build?step=system`);
  await expect(page.getByRole('button', { name: words.close })).toBeVisible();
  await page.getByRole('button', { name: words.close }).click();
  await expect(page).toHaveURL(new RegExp(`/leads/${leadId}$`));
  await expect(page.getByRole('dialog', { name: leave.title })).toHaveCount(0);
});

test('every step is offered from the list, in any order', async ({ page }) => {
  const { proposal } = await ownerWithDraft(page, en, ALL_STEPS);
  const customerName = proposal.document.deal.clientName ?? '';
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`/proposals/${proposal.id}/build`);
  const words = frameWords(customerName);

  await page.getByRole('button', { name: words.openSteps(1, 11, NAMES.company.title) }).click();
  await expect(page.getByRole('heading', { name: LIST.title })).toBeVisible();
  await page.getByRole('button', { name: new RegExp(NAMES.terms.heading) }).click();

  await expect(page).toHaveURL(/step=terms/);
  await expect(page.getByRole('heading', { name: NAMES.terms.heading })).toBeVisible();
});
