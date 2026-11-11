import { IDEMPOTENCY_KEY_HEADER, type KnownActivity, type LeadDetail } from '@heliogrid/contracts';
import {
  assignPickerWords,
  createTranslator,
  crmVocabularyWords,
  leadDetailPageWords,
  leadDockWords,
  leadHeroWords,
  leadSectionsWords,
  leadTimelineEntryWords,
  qualifyCardWords,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { API } from '../support/api-log';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany, OWNER_NAME } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { markWonThroughApi } from '../support/project';
import { packWord } from '../support/project-facts';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/leads/<id>` (`SCR-M02-04`, T-M02-004): a rep on a call meets the header's facts, the five
 * actions with Call first, the six sections with the timeline, and the qualifying questions inline —
 * one tap saves an answer, with no form and no submit. The owner chip opens the inbox's own assign
 * picker with each person's counts as the api states them. A new company is empty, so the lead is
 * captured through the api inside the flow, under the owner's own session.
 */
const en = await createTranslator('en');
const VOCABULARY = crmVocabularyWords(en.t);
const DOCK = leadDockWords(en.t);
const SECTIONS = leadSectionsWords(en.t);
const QUALIFY = qualifyCardWords(en.t);
const PAGE = leadDetailPageWords(en.t);

const NAME = 'Priya Sharma';
const CITY = 'Nashik';

/** A lead captured by quick add through the api, as the owner's own device sends it. */
async function captureLead(page: Page): Promise<{ id: string; national: string }> {
  const mobile = freshMobile();
  const answer = await page.request.post(`${API}/leads`, {
    data: {
      phoneE164: mobile.e164,
      name: NAME,
      city: CITY,
      segment: 'residential',
      capturedAt: new Date().toISOString(),
    },
    headers: { [IDEMPOTENCY_KEY_HEADER]: crypto.randomUUID() },
  });
  expect(answer.status()).toBe(201);
  const lead = (await answer.json()) as LeadDetail;
  return { id: lead.lead.id, national: mobile.national };
}

async function openLead(page: Page): Promise<{ id: string; national: string }> {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  const lead = await captureLead(page);
  await page.goto(`/leads/${lead.id}`);
  await expect(page.getByRole('heading', { name: NAME })).toBeVisible();
  return lead;
}

/** The hero's words for a fresh quick-add lead: stage `new`, no owner yet, nothing parked. */
function heroWords() {
  return leadHeroWords(en.t, {
    stage: 'new',
    segment: 'residential',
    source: 'quick_add',
    cameFrom: null,
    state: null,
    wakeDay: null,
    triesWithoutAnswer: null,
    ownerName: null,
  });
}

/** The first entry a quick add writes, in the timeline's words. */
function createdLine(): string {
  const created: KnownActivity = {
    id: 'entry',
    leadId: 'lead',
    actor: { kind: 'person', id: null, name: OWNER_NAME },
    capturedAt: new Date(0).toISOString(),
    appliedAt: new Date(0).toISOString(),
    kind: 'lead_created',
    body: { source: 'quick_add', segment: 'residential' },
  };
  const formats = { day: String, time: String, money: String, word: packWord };
  return leadTimelineEntryWords(en.t, formats, { known: true, activity: created }).summary;
}

/** A national number as the page may group it: its digits in order, spaces allowed between. */
function digitsOf(national: string): RegExp {
  return new RegExp(national.split('').join('\\s?'));
}

test('lead detail shows the header facts, the timeline, the six sections and the five actions', async ({
  page,
}) => {
  const lead = await openLead(page);
  const hero = heroWords();

  /* The header: name, the number in mono, city, the value's named gap, the stage and the owner. */
  await expect(page.getByText(digitsOf(lead.national)).first()).toBeVisible();
  await expect(page.getByText(CITY).first()).toBeVisible();
  await expect(page.getByText(hero.noValue)).toBeVisible();
  await expect(page.getByText(VOCABULARY.stage.new, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: hero.ownerSpoken })).toBeVisible();

  /* The five actions, Call first: a dial link, and Create design off with its reason. */
  const call = page.getByRole('link', { name: DOCK.call });
  await expect(call).toHaveAttribute('href', /^tel:\+91/);
  for (const act of [DOCK.message, DOCK.log, DOCK.visit]) {
    await expect(page.getByRole('button', { name: act.label }).first()).toBeEnabled();
  }
  await expect(page.getByRole('button', { name: DOCK.design.label }).first()).toHaveAttribute(
    'aria-disabled',
    'true',
  );

  /* The six sections as tabs, the timeline open on the entry the capture wrote. */
  for (const tab of Object.values(SECTIONS.tabs)) {
    await expect(page.getByRole('tab', { name: tab })).toBeVisible();
  }
  await expect(page.getByRole('tab', { name: SECTIONS.tabs.timeline })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByText(createdLine())).toBeVisible();

  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('lead detail opens the same assign picker with the same counts', async ({ page }) => {
  await openLead(page);
  await page.getByRole('button', { name: heroWords().ownerSpoken }).click();
  const words = assignPickerWords(en.t, { name: NAME });
  const sheet = page.getByRole('dialog', { name: words.title });
  await expect(sheet.getByText(words.subtitle)).toBeVisible();

  /* The people and their counts as the api states them — the inbox reads the same route. */
  const answer = await page.request.get(`${API}/lead-assignees`);
  expect(answer.status()).toBe(200);
  const { items } = (await answer.json()) as {
    items: { name: string; openCount: number; overdueCount: number }[];
  };
  for (const person of items) {
    const row = sheet.getByRole('button', { name: person.name });
    await expect(row).toContainText(words.open(person.openCount));
    await expect(row).toContainText(words.overdue(person.overdueCount));
  }
  await expectNoSeriousViolations(page);
});

/** At phone width the qualify card opens folded: its head opens the six questions in place. */
async function openQualify(page: Page) {
  if (test.info().project.name !== 'phone') return;
  await page.getByRole('button', { name: QUALIFY.title }).click();
}

test('answering a qualifying question saves it with no submit', async ({ page }) => {
  const lead = await openLead(page);
  await openQualify(page);
  const roof = page.getByRole('radiogroup', { name: QUALIFY.question.roofOwnership });
  const owned = roof.getByRole('radio', { name: QUALIFY.choice('roofOwnership', 'own') });
  await expect(owned).not.toBeChecked();

  /* One tap is the whole act: the answer leaves alone and the Saved mark follows it. */
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'PATCH' && response.url().endsWith(`/leads/${lead.id}`),
  );
  await owned.click();
  expect((await saved).status()).toBe(200);
  await expect(page.getByText(QUALIFY.saved)).toBeVisible();

  /* A fresh read keeps it: nothing waited on a submit. */
  await page.reload();
  await openQualify(page);
  await expect(
    page
      .getByRole('radiogroup', { name: QUALIFY.question.roofOwnership })
      .getByRole('radio', { name: QUALIFY.choice('roofOwnership', 'own') }),
  ).toBeChecked();
});

test('a won lead’s hero names its project in place of the value, and opens it', async ({
  page,
}) => {
  const lead = await openLead(page);
  const hero = heroWords();
  const { projectId, number } = await markWonThroughApi(page, lead.id);
  await page.reload();

  /* Won, the deal lives on as its project: the hero says so where the value stood. */
  const panel = page.locator('.hg-hero');
  await expect(panel.getByText(hero.projectLabel, { exact: true })).toBeVisible();
  await expect(panel.getByText(hero.noValue)).toHaveCount(0);
  await panel.getByRole('button', { name: hero.openProject(number), exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}$`));
  await expect(page.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
});

test('a lead opened from a stale link lands on the honest landing in the lead’s own words', async ({
  page,
}) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  /* No notice brought the person here, so the landing speaks of the lead alone. */
  await page.goto(`/leads/${crypto.randomUUID()}`);
  await expect(page.getByText(PAGE.goneTitle)).toBeVisible();
  await expect(page.getByText(PAGE.goneMessage)).toBeVisible();
  await expect(page.getByRole('button', { name: PAGE.backToList })).toBeVisible();
  await expectNoSeriousViolations(page);
});
