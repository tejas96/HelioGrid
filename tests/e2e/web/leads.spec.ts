import type { LeadDetail } from '@heliogrid/contracts';
import { formatMoney, IN_FORMATS } from '@heliogrid/domain';
import {
  createTranslator,
  destinationLabel,
  leadsListTopWords,
  leadsListWords,
  QUICK_ADD,
  SIDEBAR,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { API } from '../support/api-log';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll, settledBox } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';
import { expectTouchFloor } from '../support/touch-target';

/**
 * `/leads` (`SCR-M02-03`, T-M02-003): the monthly bill sorts as data in the tenant's currency and
 * reads in its grouping (`M02-40`) — by the table's column wide, by the sort sheet narrow; the
 * summary's dormant figure narrows the list while the list top stays, and *Clear filters* brings
 * every lead back (`M02-52`). A new company is empty, so the leads are
 * captured and billed through the api inside the flow, under the owner's own session.
 */
const en = await createTranslator('en');
const WORDS = leadsListWords(en.t, { pack: IN_FORMATS, language: 'en', now: Date.now() });
const TOP = leadsListTopWords(en.t, { pack: IN_FORMATS, language: 'en', now: Date.now() });

/** The table and its sortable bill stand from the desktop's width; below it, the phone's rows. */
const TABLE_FROM = 968;
const LEADS = destinationLabel(en.t, 'leads');

/** A lead captured by quick add through the api, with its bill typed from the call when given. */
async function captureLead(page: Page, name: string, bill: string | null): Promise<void> {
  const captured = await page.request.post(`${API}/leads`, {
    data: {
      phoneE164: freshMobile().e164,
      name,
      city: 'Pune',
      capturedAt: new Date().toISOString(),
    },
  });
  expect(captured.status()).toBe(201);
  if (bill === null) return;
  const { lead } = (await captured.json()) as LeadDetail;
  const billed = await page.request.patch(`${API}/leads/${lead.id}`, {
    data: { monthlyBill: bill, capturedAt: new Date().toISOString() },
  });
  expect(billed.status()).toBe(200);
}

/** The names as the list draws them, top to bottom. */
async function namesInOrder(page: Page, names: readonly string[]): Promise<string[]> {
  const placed = await Promise.all(
    names.map(async (name) => ({
      name,
      top: (await settledBox(page.getByText(name, { exact: true }))).y,
    })),
  );
  return placed.sort((a, b) => a.top - b.top).map((one) => one.name);
}

async function openLeads(page: Page) {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
}

test("the leads list sorts by the monthly bill and shows it in the tenant's grouping", async ({
  page,
}) => {
  await openLeads(page);
  await captureLead(page, 'Lakh Bill', '185000');
  await captureLead(page, 'Small Bill', '4200');
  await captureLead(page, 'No Bill', null);
  await page.goto('/leads');

  await expect(page.getByRole('heading', { level: 1, name: WORDS.title })).toBeVisible();
  /* The bill in the tenant's currency and its grouping — lakh, never thousands. */
  await expect(page.getByText(formatMoney(IN_FORMATS, 185000), { exact: true })).toBeVisible();
  const wide = (page.viewportSize()?.width ?? 0) >= TABLE_FROM;
  /* The table names a bill never asked; a card leaves it out. */
  await expect(page.getByText(WORDS.row.noBill)).toHaveCount(wide ? 1 : 0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
  /* Leads has landed: no part of the shell calls it coming. */
  await expect(page.getByRole('button', { name: LEADS, exact: true }).first()).toBeVisible();
  await expect(
    page.locator(`[aria-label="${en.t(SIDEBAR.soonNamed, { label: LEADS })}"]`),
  ).toHaveCount(0);

  const names = ['Lakh Bill', 'Small Bill', 'No Bill'] as const;
  /* The stage chips sit in one row that scrolls, each a full touch target. */
  const chips = page.getByRole('tablist', { name: TOP.stages, exact: true }).getByRole('tab');
  await expectTouchFloor(await chips.all());
  if (wide) {
    const bill = page.getByRole('columnheader', { name: new RegExp(WORDS.columns.bill) });
    await bill.getByRole('button').click();
    await expect(bill).toHaveAttribute('aria-sort', 'ascending');
    await expect
      .poll(() => namesInOrder(page, names))
      .toEqual(['Small Bill', 'Lakh Bill', 'No Bill']);
    await bill.getByRole('button').click();
    await expect(bill).toHaveAttribute('aria-sort', 'descending');
  } else {
    /* Narrow, the sort glyph opens the orders as a sheet; a tap sorts and closes it. */
    await page.getByRole('button', { name: TOP.sortNamed(TOP.newest), exact: true }).click();
    const sheet = page.getByRole('dialog', { name: TOP.sortTitle });
    await sheet.getByRole('radio', { name: TOP.billLargest }).click();
    await expect(sheet).toBeHidden();
    await expect(
      page.getByRole('button', { name: TOP.sortNamed(TOP.billLargest), exact: true }),
    ).toBeVisible();
  }
  /* Largest first, and a lead whose bill was never asked sorts last. */
  await expect
    .poll(() => namesInOrder(page, names))
    .toEqual(['Lakh Bill', 'Small Bill', 'No Bill']);
});

test('the dormant figure narrows the list, keeps the list top, and Clear filters brings every lead back', async ({
  page,
}) => {
  await openLeads(page);
  await captureLead(page, 'Active Lead', null);
  await page.goto('/leads');
  await expect(page.getByText('Active Lead', { exact: true })).toBeVisible();

  /* No lead has been quiet thirty days in a new company: the filter asks for the dormant and finds none. */
  const asked = page.waitForRequest((request) => /\/leads\?.*state=dormant/.test(request.url()));
  const dormant = page.getByRole('button', { name: TOP.dormantSpoken(0), exact: true });
  await dormant.click();
  await asked;
  await expect(page.getByRole('heading', { name: WORDS.noMatch.title })).toBeVisible();
  await expect(page.getByText('Active Lead', { exact: true })).toHaveCount(0);
  await expect(dormant).toBeVisible();
  await expectNoSeriousViolations(page);

  /* The primary pill's glyph takes the pill's own ink, never a dark mark on the ocean fill. */
  const clear = page.getByRole('button', { name: WORDS.noMatch.clear });
  const [words, glyph] = await clear.evaluate((button) => [
    getComputedStyle(button).color,
    getComputedStyle(button.querySelector('svg') ?? button).color,
  ]);
  expect(glyph).toBe(words);
  await clear.click();
  await expect(page.getByText('Active Lead', { exact: true })).toBeVisible();
});

test('opening quick add from the list leaves the page where it stood', async ({ page }) => {
  await openLeads(page);
  await captureLead(page, 'Steady Page', null);
  await page.goto('/leads');
  await expect(page.getByText('Steady Page', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: WORDS.addLead, exact: true }).click();
  const capture = page.getByRole('dialog', { name: en.t(QUICK_ADD.title) });
  await expect(capture.getByRole('textbox', { name: en.t(QUICK_ADD.phone) })).toBeFocused();
  /* The panel's lock holds the page still: nothing slid sideways under it, the shell at its edge. */
  await expectNoSidewaysScroll(page);
  expect(
    await page.evaluate(() => [document.body.scrollLeft, document.documentElement.scrollLeft]),
  ).toEqual([0, 0]);
  expect((await settledBox(page.locator('.hg-app-shell'))).x).toBe(0);
});
