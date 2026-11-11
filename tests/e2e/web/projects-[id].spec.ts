import type { NextStep } from '@heliogrid/domain';
import {
  createTranslator,
  leadHeroWords,
  markWonWords,
  projectDetailWords,
  projectSheetWords,
  projectToastWords,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { OWNER_NAME } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import {
  CUSTOMER,
  captureLead,
  firstPersonRow,
  isWide,
  openProjectPage,
  ownerWithCompany,
  projectHeroOf,
  readProject,
  type StartedProject,
  toastSaying,
} from '../support/project';
import { packDay, packWord } from '../support/project-facts';

/**
 * `/projects/<id>` (`SCR-M08-02`): the project manager or the owner, come to move the job on or say
 * why a paper does not apply. A project starts only from *Mark won* on its lead, so the first flow
 * drives that sheet from the lead page to the project at Won; the others start theirs through the
 * api (`support/project.ts`), as the sheet sends it. The title carries the manager and the install
 * promise and, beside it, the ⋯ of acts on the whole project; the hero names the stage and the one
 * next act; a forward move leaves its toast with *Undo*; each checklist row's act is spoken with its
 * row, and *Not needed* asks why. The acts that take a sheet of their own — *Dispatched*, a wait, a
 * cancel — and a move another person made first are `projects-[id]-acts.spec.ts`'s.
 */
const en = await createTranslator('en');
const DETAIL = projectDetailWords(en.t, packWord, packDay);
const SHEETS = projectSheetWords(en.t, packWord, packDay);
const TOAST = projectToastWords(en.t, packWord, packDay);
const WON = markWonWords(en.t, CUSTOMER.name);
/** The lead page's record menu — a fresh quick-add lead's, as `leads-[id].spec.ts` reads it. */
const RECORD = leadHeroWords(en.t, {
  stage: 'new',
  segment: 'residential',
  source: 'quick_add',
  cameFrom: null,
  state: null,
  wakeDay: null,
  triesWithoutAnswer: null,
  ownerName: null,
}).recordActs;

/** What a project at Won asks next, and what it asks once at Material ordered. */
const MOVE: NextStep = { kind: 'move', to: 'material_ordered' };
const DISPATCH: NextStep = { kind: 'dispatch' };
const REASON = 'Signed on paper at the site visit';
/** The owner's first name, as the manager's pill under the title says it. */
const OWNER_FIRST = OWNER_NAME.split(' ')[0] ?? OWNER_NAME;

const heroOf = (page: Page) => projectHeroOf(page, DETAIL.now);
const openProject = (page: Page) => openProjectPage(page, en);

/** The 15th of a month from this one on the device's own calendar, and that day as stored. */
function fifteenth(monthsAhead: number): { day: Date; stored: string } {
  const now = new Date();
  const day = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 15);
  const month = String(day.getMonth() + 1).padStart(2, '0');
  return { day, stored: `${day.getFullYear()}-${month}-15` };
}

test('Mark won on the lead starts its project and opens it at Won', async ({ page }) => {
  await ownerWithCompany(page, en);
  const leadId = await captureLead(page);
  await page.goto(`/leads/${leadId}`);
  await expect(page.getByRole('heading', { name: CUSTOMER.name }).first()).toBeVisible();

  /* The lead's ⋯ is the page's, in its way-back row, on every width. */
  await page.getByRole('button', { name: RECORD.label, exact: true }).click();
  await page.getByRole('menuitem', { name: RECORD.markWon, exact: true }).click();
  const sheet = page.getByRole('dialog', { name: WON.title });
  await expect(sheet.getByText(WON.who, { exact: true })).toBeVisible();
  await expect(sheet.getByText(WON.line)).toBeVisible();
  /* A new company's one project manager is its owner, picked for them. */
  await expect(sheet.getByText(WON.managerOnly)).toBeVisible();

  /* A won deal is worth something: nothing is refused as it is typed, and said under the field. */
  const value = sheet.getByRole('textbox', { name: WON.finalValue });
  await value.fill('0');
  await expect(sheet.getByText(WON.valueNeeded)).toBeVisible();
  await value.fill('350000');
  await expect(sheet.getByText(WON.valueNeeded)).toHaveCount(0);

  /* No day behind today is offered as the install date. */
  await sheet.getByRole('button', { name: WON.date.selectDate }).click();
  const calendar = page.getByRole('dialog', { name: WON.installDate });
  await calendar.getByRole('button', { name: WON.date.previousMonth }).click();
  await expect(
    calendar.getByRole('gridcell', { name: packDay(fifteenth(-1).day), exact: true }),
  ).toBeDisabled();
  await calendar.getByRole('button', { name: WON.date.nextMonth }).click();
  await calendar.getByRole('button', { name: WON.date.nextMonth }).click();
  const install = fifteenth(1);
  await calendar.getByRole('gridcell', { name: packDay(install.day), exact: true }).click();
  await expect(calendar).toBeHidden();

  const answered = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().endsWith(`/leads/${leadId}/won`),
  );
  await sheet.getByRole('button', { name: WON.send }).click();
  const answer = await answered;
  expect(answer.status()).toBe(201);
  const { projectId, number } = (await answer.json()) as StartedProject;
  await expect(sheet.getByText(WON.started(number))).toBeVisible();
  await sheet.getByRole('button', { name: WON.openProject }).click();

  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}$`));
  await expect(page.getByRole('heading', { level: 1, name: CUSTOMER.name })).toBeVisible();
  const hero = heroOf(page);
  await expect(hero.getByText(DETAIL.stage('won'), { exact: true })).toBeVisible();
  await expect(hero.getByText(DETAIL.nextTitle(MOVE, null), { exact: true })).toBeVisible();
  /* What the sheet sent sits under the title: the manager it picked, beside their face, and the
     day chosen. */
  await expect(page.getByText(DETAIL.manager(OWNER_FIRST))).toBeVisible();
  await expect(page.getByText(DETAIL.installBy(install.stored), { exact: true })).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('the hero’s one act moves the project on, and the toast’s Undo takes it back', async ({
  page,
}) => {
  await openProject(page);
  const hero = heroOf(page);
  await expect(hero.getByText(DETAIL.nextTitle(MOVE, null), { exact: true })).toBeVisible();
  await expectNoSeriousViolations(page);

  await hero.getByRole('button', { name: DETAIL.nextAct(MOVE), exact: true }).click();
  const moved = toastSaying(
    page,
    TOAST.title({ kind: 'moved', stage: 'material_ordered', undoable: true }),
  );
  await expect(moved).toBeVisible();
  await expect(hero.getByText(DETAIL.stage('material_ordered'), { exact: true })).toBeVisible();
  await expect(hero.getByText(DETAIL.nextTitle(DISPATCH, null), { exact: true })).toBeVisible();

  await moved.getByRole('button', { name: TOAST.undo, exact: true }).click();
  await expect(toastSaying(page, TOAST.title({ kind: 'undone' }))).toBeVisible();
  await expect(hero.getByText(DETAIL.stage('won'), { exact: true })).toBeVisible();
  await expect(hero.getByText(DETAIL.nextTitle(MOVE, null), { exact: true })).toBeVisible();
});

test('Not needed is spoken with its row, asks why, and the row keeps its reason', async ({
  page,
}) => {
  const { projectId } = await openProject(page);
  const project = await readProject(page, projectId);
  const row = firstPersonRow(project);
  const documents = page.getByRole('region', { name: DETAIL.documents, exact: true });
  const line = documents
    .getByRole('listitem')
    .filter({ has: page.getByText(DETAIL.row(row), { exact: true }) });
  /* Each waiting row's acts say which row they act on, so no two sound alike. */
  await expect(
    line.getByRole('button', { name: DETAIL.uploadRow(row), exact: true }),
  ).toBeVisible();
  await line.getByRole('button', { name: DETAIL.notNeededRow(row), exact: true }).click();

  const sheet = page.getByRole('dialog', { name: SHEETS.notNeeded.title });
  await expect(sheet.getByText(SHEETS.notNeeded.line(row))).toBeVisible();
  const send = sheet.getByRole('button', { name: SHEETS.notNeeded.send });
  /* No reason, no send: a row is marked only with why. */
  await expect(send).toBeDisabled();
  await sheet.getByRole('textbox', { name: SHEETS.notNeeded.reason }).fill(REASON);
  await send.click();
  await expect(toastSaying(page, TOAST.title({ kind: 'notNeeded', row }))).toBeVisible();
  await expect(sheet).toBeHidden();

  const kept = DETAIL.notNeededBecause(REASON);
  if (isWide(page)) {
    /* Wide, the page holds every row: this one marked, with why and its way back. */
    await expect(line.getByText(DETAIL.notNeeded, { exact: true })).toBeVisible();
    await expect(line.getByText(kept, { exact: true })).toBeVisible();
    await expect(
      line.getByRole('button', { name: DETAIL.reopenRow(row), exact: true }),
    ).toBeVisible();
    return;
  }
  /* Narrow, the page holds the rows still waiting: this one waits no more. */
  await expect(line).toHaveCount(0);
  await documents
    .getByRole('button', { name: DETAIL.seeAllDocuments(project.documents.length) })
    .click();
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/documents$`));
  const all = page
    .getByRole('listitem')
    .filter({ has: page.getByText(DETAIL.row(row), { exact: true }) });
  await expect(all.getByText(kept, { exact: true })).toBeVisible();
});

test('the ⋯ beside the title holds the project’s other acts, with no Move back at the first stage', async ({
  page,
}) => {
  await openProject(page);
  /* The hero holds the next act alone; the acts on the whole project sit beside the title. */
  await expect(heroOf(page).getByRole('button', { name: DETAIL.menu })).toHaveCount(0);
  await page.getByRole('button', { name: DETAIL.menu, exact: true }).click();
  const menu = page.getByRole('menu', { name: DETAIL.menu });
  for (const act of [DETAIL.changeDate, DETAIL.changeManager, DETAIL.changeAccess, DETAIL.cancel]) {
    await expect(menu.getByRole('menuitem', { name: act, exact: true })).toBeVisible();
  }
  await expect(menu.getByRole('menuitem', { name: DETAIL.moveBack })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});

test('a project opened from a stale link says it is not the reader’s to see', async ({ page }) => {
  await ownerWithCompany(page, en);
  await page.goto(`/projects/${crypto.randomUUID()}`);
  await expect(page.getByText(DETAIL.goneTitle, { exact: true })).toBeVisible();
  await expect(page.getByText(DETAIL.goneBody, { exact: true })).toBeVisible();
  await expectNoSeriousViolations(page);
});
