import { IN_FORMATS } from '@heliogrid/domain';
import {
  createTranslator,
  dedupeSheetWords,
  leadsListWords,
  QUICK_ADD,
  SHELL,
  verbLabel,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/add-lead` (`SCR-M02-01`, `M02-01`, `M02-06`…`M02-09`): the add action opens quick add in one
 * tap over the leads page; four fields, only the phone needed; the number checked as it is typed;
 * a number already here meets the duplicate sheet with exactly three choices, and closing it
 * creates nothing.
 */
const en = await createTranslator('en');
const NEW_LEAD = en.t(QUICK_ADD.title);
const PHONE = en.t(QUICK_ADD.phone);
const SAVE = en.t(QUICK_ADD.save);
const ADD_LEAD = leadsListWords(en.t, {
  pack: IN_FORMATS,
  language: 'en',
  now: Date.now(),
}).addLead;
/* The sheet's choices for a record the owner may open; their titles name no fact of the record. */
const SHEET = dedupeSheetWords(en.t, {
  phone: '',
  inScope: true,
  recordName: null,
  ownerName: null,
  stage: 'new',
  lastContactElapsedMs: null,
});

async function signedInOwner(page: Page) {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
}

const captureOf = (page: Page) => page.getByRole('dialog', { name: NEW_LEAD });

/** Opens quick add at its address, types a customer's number and saves it: the lead exists. */
async function saveLead(page: Page, national: string) {
  await page.goto('/add-lead');
  const capture = captureOf(page);
  await capture.getByRole('textbox', { name: PHONE }).fill(national);
  await expect(capture.getByText(en.t(QUICK_ADD.newNumber))).toBeVisible();
  await capture.getByRole('button', { name: SAVE }).click();
  await expect(page.getByText(en.t(QUICK_ADD.saved))).toBeVisible();
}

test('quick add shows four fields and saves with the phone alone', async ({ page }) => {
  await signedInOwner(page);
  await page.goto('/add-lead');

  const capture = captureOf(page);
  await expect(capture).toBeVisible();
  /* Exactly four fields: the phone, name, city and the type — and nothing else asks for an answer. */
  await expect(capture.getByRole('textbox')).toHaveCount(3);
  await expect(capture.getByRole('textbox', { name: PHONE })).toBeVisible();
  await expect(capture.getByRole('textbox', { name: en.t(QUICK_ADD.name) })).toBeVisible();
  await expect(capture.getByRole('textbox', { name: en.t(QUICK_ADD.city) })).toBeVisible();
  await expect(capture.getByRole('radiogroup', { name: en.t(QUICK_ADD.type) })).toBeVisible();
  await expect(capture.locator('[required], [aria-required="true"]')).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  /* Save with nothing typed is refused at the phone, and nothing is sent. */
  await capture.getByRole('button', { name: SAVE }).click();
  await expect(capture.getByText(en.t(QUICK_ADD.missing))).toBeVisible();
  await expect(capture.getByRole('textbox', { name: PHONE })).toBeFocused();

  const created = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().endsWith('/leads'),
  );
  await capture.getByRole('textbox', { name: PHONE }).fill(freshMobile().national);
  await capture.getByRole('button', { name: SAVE }).click();
  expect((await created).status()).toBe(201);

  await expect(capture).toBeHidden();
  await expect(page.getByText(en.t(QUICK_ADD.saved))).toBeVisible();
  await expect(page.getByRole('button', { name: en.t(QUICK_ADD.open), exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/leads$/);

  /* The page the capture closed onto adds the next lead: a fresh capture opens and saves too. */
  await page.getByRole('button', { name: ADD_LEAD, exact: true }).click();
  await expect(page).toHaveURL(/\/add-lead$/);
  await expect(capture).toBeVisible();
  const phone = capture.getByRole('textbox', { name: PHONE });
  await expect(phone).toHaveValue('');
  const second = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().endsWith('/leads'),
  );
  await phone.fill(freshMobile().national);
  await capture.getByRole('button', { name: SAVE }).click();
  expect((await second).status()).toBe(201);
  await expect(capture).toBeHidden();
  await expect(page.getByText(en.t(QUICK_ADD.saved)).last()).toBeVisible();
  await expect(page).toHaveURL(/\/leads$/);
});

test('the add action opens quick add in one tap and checks the number as it is typed', async ({
  page,
}) => {
  await signedInOwner(page);

  await page.getByRole('button', { name: verbLabel(en.t, 'add_lead') }).click();
  await expect(page).toHaveURL(/\/add-lead$/);
  const capture = captureOf(page);
  const phone = capture.getByRole('textbox', { name: PHONE });
  await expect(phone).toBeFocused();

  /* A part of a number is not checked; the whole one is, with a quiet line while it asks. */
  const asked = page.waitForRequest((request) => request.url().includes('/customers/match'));
  const national = freshMobile().national;
  await phone.pressSequentially(national.slice(0, 6));
  await expect(capture.getByText(en.t(QUICK_ADD.checking))).toHaveCount(0);
  await phone.pressSequentially(national.slice(6));
  await asked;
  await expect(capture.getByText(en.t(QUICK_ADD.newNumber))).toBeVisible();

  /* The check never blocks Save: closing creates nothing and the page behind is the leads page. */
  await capture
    .getByRole('button', { name: en.t(SHELL.close) })
    .first()
    .click();
  await expect(capture).toBeHidden();
  await expect(page).toHaveURL(/\/leads$/);
});

test('a number already here meets the duplicate sheet with exactly three choices', async ({
  page,
}) => {
  await signedInOwner(page);
  const national = freshMobile().national;
  await saveLead(page, national);

  await page.goto('/add-lead');
  const capture = captureOf(page);
  await capture.getByRole('textbox', { name: en.t(QUICK_ADD.name) }).fill('Priya Sharma');
  await capture.getByRole('textbox', { name: PHONE }).fill(national);

  const sheet = page.getByRole('dialog', { name: SHEET.heading });
  await expect(sheet).toBeVisible();
  const choices = [SHEET.openExisting, SHEET.logEnquiry, SHEET.keepBoth];
  for (const choice of choices) {
    await expect(sheet.getByRole('button', { name: choice.title })).toContainText(choice.line);
  }
  await expect(sheet.getByRole('button').filter({ hasText: /\S/ })).toHaveCount(choices.length);
  await expect(sheet.getByText(SHEET.nothingCreated)).toBeVisible();
  await expectNoSeriousViolations(page);

  /* Closing it creates nothing, and the capture is back with what was typed. */
  let sent = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST') sent += 1;
  });
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(capture.getByRole('textbox', { name: en.t(QUICK_ADD.name) })).toHaveValue(
    'Priya Sharma',
  );
  await expect(capture.getByText(en.t(QUICK_ADD.known))).toBeVisible();
  expect(sent).toBe(0);
});
