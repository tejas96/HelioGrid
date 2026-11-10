import { ROLE_PRESETS } from '@heliogrid/domain';
import { catalogImportNotes, createTranslator, leadImportWords } from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { answerTheImport, csvOf, type SheetRow } from '../support/lead-import-job';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/leads/import` (`SCR-M02-05`, T-M02-005): the owner brings an old spreadsheet in once. Each column
 * carries the field its header guesses, and nothing is imported yet; the preview states the rows and
 * the duplicates by phone before anything runs, with *Skip* the default; the run goes on when the
 * owner leaves and comes back, and its report lists every row turned away with its reason and the
 * count that landed. CI's web lane runs no object store and no worker, so the server's side answers
 * in the page (`support/lead-import-job.ts`).
 */
const en = await createTranslator('en');
const WORDS = leadImportWords(en.t);
const HINDI = leadImportWords((await createTranslator('hi')).t);
const NOTES = catalogImportNotes(en.t);
const [, , SALES_EXECUTIVE] = ROLE_PRESETS;

/** 400 rows: 90 numbers the company already has, one with no number, one whose number does not read. */
const ROWS: SheetRow[] = Array.from({ length: 400 }, (_, at) => ({
  name: `Customer ${at + 1}`,
  phone:
    at === 398 ? '' : at === 399 ? '98220 1456' : `98${String(22_000_000 + at).padStart(8, '0')}`,
  city: at % 2 === 0 ? 'Pune' : 'Nashik',
  type: at % 3 === 0 ? 'Business' : 'Home',
  bill: String(2000 + at * 10),
  known: at < 90,
  problem: at === 398 ? 'missing_number' : at === 399 ? 'unreadable_number' : null,
}));

async function openTheImport(page: Page) {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/leads/import');
  await expect(page.getByText(WORDS.choose)).toBeVisible();
}

test('an owner maps a file, sees the counts before anything runs, and reads every rejected row with the count that landed', async ({
  page,
}) => {
  await openTheImport(page);
  await expect(page.getByText(WORDS.untouched)).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  const server = await answerTheImport(page, ROWS);
  await page.locator('.hg-dropzone input[type="file"]').setInputFiles({
    name: 'Old leads 2024.csv',
    mimeType: 'text/csv',
    buffer: csvOf(ROWS),
  });
  await expect(page).toHaveURL(/\/leads\/import\?job=/);
  /* Read, the file step names its next step; nothing has run. */
  await expect(page.getByText(WORDS.nextColumns)).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: WORDS.continue }).click();

  /* Map columns: each column wears the field its header names — the Hindi one too — and nothing is in. */
  const asField = (header: string) =>
    page.getByRole('combobox', { name: WORDS.importColumnAs(header) });
  await expect(asField('ग्राहक का नाम')).toContainText(WORDS.fields.name);
  await expect(asField('Mobile No.')).toContainText(WORDS.fields.phone);
  await expect(asField('Town')).toContainText(WORDS.fields.city);
  await expect(asField('Category')).toContainText(WORDS.fields.segment);
  await expect(asField('Remarks')).toContainText(WORDS.chooseField);
  await expect(page.getByText(WORDS.nextCounts)).toBeVisible();
  await page.getByRole('button', { name: WORDS.continue }).click();

  /* Preview: both counts before anything runs; Skip is the choice until the owner says otherwise. */
  await expect(page.getByText(WORDS.counts(400, 90))).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('radio', { name: WORDS.choices.skip.title })).toBeChecked();
  await expect(page.getByRole('radio', { name: WORDS.choices.log_enquiry.title })).toBeVisible();
  await expect(page.getByText(WORDS.fates.already_here).first()).toBeVisible();
  await expect(page.getByText(WORDS.nothingYet)).toBeVisible();
  expect(server.runs).toEqual([]);
  await expectNoSidewaysScroll(page);
  await page.getByRole('button', { name: WORDS.importLeads(308) }).click();
  await expect.poll(() => server.runs).toEqual([{ duplicateChoice: 'skip' }]);

  /* Leave mid-run and come back: the import is where it got to — its progress, then its report. */
  await expect(page.getByText(WORDS.keepsGoing)).toBeVisible();
  await page.getByRole('button', { name: WORDS.backToLeads }).click();
  await expect(page).toHaveURL(/\/leads$/);
  await page.goBack();
  await expect(page.getByText(WORDS.ofRows(400))).toBeVisible();
  server.finish();
  await expect(page.getByRole('heading', { name: WORDS.landed(308) })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByRole('heading', { name: WORDS.landed(308) })).toBeFocused();
  await expect(page.getByText(WORDS.rejectedHeading(2)).first()).toBeVisible();
  await expect(page.getByText(WORDS.problems.missing_number).first()).toBeVisible();
  await expect(page.getByText(WORDS.problems.unreadable_number).first()).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('the wizard speaks the language its person reads', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  /* The language arrives with the session, after the first paint in English: every word the wizard
     built from that paint must follow it. */
  await page.route('**/auth/session', async (route) => {
    const answer = await route.fetch();
    const session = await answer.json();
    await route.fulfill({
      response: answer,
      json: { ...session, actor: { ...session.actor, interfaceLanguage: 'hi' } },
    });
  });
  await page.goto('/leads/import');
  await expect(page.getByText(HINDI.choose)).toBeVisible();
  await expect(page.getByRole('heading', { name: HINDI.title })).toBeVisible();
  /* All four steps are named on the first, none drawn over another. */
  const track = page.getByLabel(HINDI.stepsLabel, { exact: true });
  for (const step of HINDI.steps) {
    await expect(track.getByText(step, { exact: true })).toBeVisible();
  }
  await expect(page.getByText(HINDI.untouched)).toBeVisible();
  await expect(page.getByRole('button', { name: HINDI.continue, exact: true })).toBeVisible();
  await expect(page.getByText(WORDS.choose)).toHaveCount(0);
  await expectNoSidewaysScroll(page);
});

test('a file over the limit is refused before anything is sent', async ({ page }) => {
  await openTheImport(page);
  const declared: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/files') {
      declared.push(request.url());
    }
  });
  await page.locator('.hg-dropzone input[type="file"]').setInputFiles({
    name: 'Old leads too big.csv',
    mimeType: 'text/csv',
    buffer: Buffer.alloc(2_000_001, 'a'),
  });
  const refusal = NOTES.upload({ state: 'refused', refusal: 'too-large' }, 2) ?? '';
  await expect(page.getByText(refusal)).toBeVisible();
  expect(declared).toEqual([]);
});

test('a person who may not import is told why and never meets the wizard', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.route('**/auth/session', async (route) => {
    const answer = await route.fetch();
    const session = await answer.json();
    session.membership.roles = [SALES_EXECUTIVE];
    await route.fulfill({ response: answer, json: session });
  });
  await page.goto('/leads/import');
  await expect(page.getByText(WORDS.notAllowed.title)).toBeVisible();
  await expect(page.getByText(WORDS.choose)).toHaveCount(0);
  await expectNoSeriousViolations(page);
});
