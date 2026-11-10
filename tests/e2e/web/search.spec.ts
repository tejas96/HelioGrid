import { createTranslator, leadInboxWords, SHELL, searchWords } from '@heliogrid/i18n';
import { expect, type Locator, type Page, type TestInfo, test } from '@playwright/test';
import { API } from '../support/api-log';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * Global Search (`SCR-SHELL-02`, T-SHELL-002): one box in the shell. At the desktop width the
 * sidebar's field opens the palette over the page; below it, the top bar's search opens `/search`.
 * Either way a number or a city finds its records, grouped, each row a link to its record, and a
 * junk lead — out of every queue — is found with its mark and Reopen (`F6-20`, `F6-23`). A new
 * company is empty, so its leads are captured through the api inside the flow, under the owner's
 * own session.
 */
const en = await createTranslator('en');
const WORDS = searchWords(en.t);

/** A lead captured by quick add through the api, as the owner's own device would send it. */
async function captureLead(page: Page, lead: { phoneE164: string; name: string; city: string }) {
  const answer = await page.request.post(`${API}/leads`, {
    data: { ...lead, capturedAt: new Date().toISOString() },
  });
  expect(answer.status()).toBe(201);
  const { lead: saved } = (await answer.json()) as { lead: { id: string } };
  return saved.id;
}

/** Opens the search the shell offers at this width and types into it; answers where results draw. */
async function search(page: Page, testInfo: TestInfo, query: string): Promise<Locator> {
  if (testInfo.project.name === 'desktop') {
    await page.getByRole('searchbox', { name: en.t(SHELL.search) }).fill(query);
    const palette = page.getByRole('dialog', { name: WORDS.title });
    await expect(palette.getByRole('searchbox', { name: WORDS.title })).toBeFocused();
    await expect(palette.getByRole('searchbox', { name: WORDS.title })).toHaveValue(query);
    return palette;
  }
  await page.getByRole('button', { name: en.t(SHELL.search) }).click();
  await expect(page).toHaveURL(/\/search$/);
  const field = page.getByRole('searchbox', { name: WORDS.title });
  await expect(field).toBeFocused();
  await field.fill(query);
  return page.getByRole('main');
}

test.beforeEach(async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
});

test("searching a junk lead's phone shows its junk mark and Reopen", async ({ page }, testInfo) => {
  const mobile = freshMobile();
  const name = 'Suresh Kamble';
  const id = await captureLead(page, { phoneE164: mobile.e164, name, city: 'Sangli' });
  const junked = await page.request.post(`${API}/leads/${id}/junk`, {
    data: { capturedAt: new Date().toISOString() },
  });
  expect(junked.status()).toBe(200);

  /* Junk leaves every queue: the inbox, where an unassigned lead waits, holds it no more. */
  await page.goto('/leads/inbox');
  await expect(
    page.getByRole('heading', { level: 1, name: leadInboxWords(en.t).title }),
  ).toBeVisible();
  await expect(page.getByText(name)).toHaveCount(0);

  const results = await search(page, testInfo, mobile.national);
  const leads = results.getByRole('region', { name: WORDS.group('leads') });
  await expect(leads.getByText(WORDS.state('junk'), { exact: true })).toBeVisible();
  const reopen = leads.getByRole('button', { name: WORDS.reopenNamed(name) });
  await expect(reopen).toBeVisible();
  await expect(leads.getByText(WORDS.numberMatch)).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  /* Reopen lands in the row: the mark and the act leave, and the lead's link keeps the focus. */
  await reopen.click();
  await expect(leads.getByText(WORDS.state('junk'), { exact: true })).toHaveCount(0);
  await expect(reopen).toHaveCount(0);
  const link = leads.getByRole('link', { name: WORDS.open('lead', name) });
  await expect(link).toHaveAttribute('href', `/leads/${id}`);
  await expect(link).toBeFocused();
});

test('a city query returns rows in each matching group, each a link to its record', async ({
  page,
}, testInfo) => {
  const mobile = freshMobile();
  const name = 'Priya Sharma';
  const id = await captureLead(page, { phoneE164: mobile.e164, name, city: 'Nashik' });

  const results = await search(page, testInfo, 'Nashik');
  const leads = results.getByRole('region', { name: WORDS.group('leads') });
  const customers = results.getByRole('region', { name: WORDS.group('customers') });
  const leadLink = leads.getByRole('link', { name: WORDS.open('lead', name) });
  await expect(leadLink).toHaveAttribute('href', `/leads/${id}`);
  /* A customer has no page of its own: its link opens the leads list on its number. */
  await expect(customers.getByRole('link', { name: WORDS.open('customer', name) })).toHaveAttribute(
    'href',
    `/leads?q=${encodeURIComponent(mobile.e164)}`,
  );
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  await leadLink.click();
  await expect(page).toHaveURL(new RegExp(`/leads/${id}$`));
});
