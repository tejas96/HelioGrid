import { createTranslator, leadInboxWords, leadSourceWord } from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { API } from '../support/api-log';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany, OWNER_NAME } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';
import { expectTouchFloor } from '../support/touch-target';

/**
 * `/leads/inbox` (`SCR-M02-02`, T-M02-002): the owner's morning triage. A face gives the newest
 * lead away in one tap and the next rises; the junk act bins the lead in one tap; with nothing
 * waiting, the inbox teaches what will appear and the three ways a lead arrives. A new company is
 * empty, so the leads are captured through the api inside the flow, under the owner's own session.
 */
const en = await createTranslator('en');
const WORDS = leadInboxWords(en.t);

/** A lead captured by quick add through the api, as the owner's own device would send it. */
async function captureLead(page: Page, name: string, city: string): Promise<void> {
  const answer = await page.request.post(`${API}/leads`, {
    data: { phoneE164: freshMobile().e164, name, city, capturedAt: new Date().toISOString() },
  });
  expect(answer.status()).toBe(201);
}

async function openInbox(page: Page) {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
}

test('a face assigns and the junk act bins, one tap each', async ({ page }) => {
  await openInbox(page);
  await captureLead(page, 'Meera Kulkarni', 'Pune');
  await captureLead(page, 'Priya Sharma', 'Nashik');
  await page.goto('/leads/inbox');

  /* Newest first: Priya fills the deck, carrying where she came from. */
  const priya = page.getByRole('heading', { name: 'Priya Sharma' });
  await expect(priya).toBeVisible();
  await expect(page.getByText(leadSourceWord(en.t, 'quick_add')).first()).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  /* One tap on the owner's own face gives her away; once the server confirms, Meera rises. */
  await page.getByRole('button', { name: WORDS.dock.giveTo(OWNER_NAME, 0, 0) }).click();
  await expect(priya).toHaveCount(0);
  const meera = page.getByRole('heading', { name: 'Meera Kulkarni' });
  await expect(meera).toBeVisible();

  /* One tap on junk bins Meera; with nothing left waiting, the inbox teaches — and the keyboard,
     whose button left with the deck, lands on what replaced it. */
  const junk = page.getByRole('button', { name: WORDS.deck.junkThis, exact: true });
  await expectTouchFloor([junk]);
  await junk.click();
  await expect(meera).toHaveCount(0);
  const teaching = page.getByRole('heading', { name: WORDS.teaching.title });
  await expect(teaching).toBeVisible();
  await expect(teaching).toBeFocused();
});

test('an empty inbox says what will appear and how a lead arrives', async ({ page }) => {
  await openInbox(page);
  await page.goto('/leads/inbox');

  await expect(page.getByRole('heading', { name: WORDS.teaching.title })).toBeVisible();
  await expect(page.getByText(WORDS.teaching.body)).toBeVisible();
  for (const way of Object.values(WORDS.teaching.ways)) {
    await expect(page.getByRole('button', { name: way.title })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: WORDS.teaching.add })).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  await page.getByRole('button', { name: WORDS.teaching.add }).click();
  await expect(page).toHaveURL(/\/add-lead$/);
});
