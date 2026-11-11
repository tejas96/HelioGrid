import { BLOCKER_REASONS_BY_PARTY, type NextStep } from '@heliogrid/domain';
import {
  createTranslator,
  projectDetailWords,
  projectSheetWords,
  projectToastWords,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { OWNER_NAME } from '../support/door';
import {
  actThroughApi,
  CUSTOMER,
  openProjectPage,
  projectHeroOf,
  readProject,
  toastSaying,
} from '../support/project';
import { packDay, packWord } from '../support/project-facts';

/**
 * `/projects/<id>`'s acts that take a sheet of their own (`SCR-M08-02`): *Dispatched* names the day
 * the material left and its crew — none while the team has no installer — and leads on to the
 * install steps; a wait on the customer is said, reminded in their words and closed; a cancel asks
 * its reason, *Something else* its note, and nothing is deleted; and a move another person made
 * first is named with who made it. Each project starts at Won through the api
 * (`support/project.ts`); `projects-[id].spec.ts` holds the page itself and *Mark won*.
 */
const en = await createTranslator('en');
const DETAIL = projectDetailWords(en.t, packWord, packDay);
const SHEETS = projectSheetWords(en.t, packWord, packDay);
const TOAST = projectToastWords(en.t, packWord, packDay);

/** What a project at Won asks next, what it asks at Material ordered, and once Dispatched. */
const MOVE: NextStep = { kind: 'move', to: 'material_ordered' };
const DISPATCH: NextStep = { kind: 'dispatch' };
const FIRST_TICK: NextStep = { kind: 'steps', to: 'installation', ticked: 0, total: 0 };

const heroOf = (page: Page) => projectHeroOf(page, DETAIL.now);
const openProject = (page: Page) => openProjectPage(page, en);

test('Dispatched names the day the material left, goes with no crew while the team has none, and leads to the steps', async ({
  page,
}) => {
  const { projectId } = await openProject(page);
  const hero = heroOf(page);
  await hero.getByRole('button', { name: DETAIL.nextAct(MOVE), exact: true }).click();
  await hero.getByRole('button', { name: DETAIL.nextAct(DISPATCH), exact: true }).click();

  const sheet = page.getByRole('dialog', { name: SHEETS.dispatch.title });
  await expect(sheet.getByText(SHEETS.lead(CUSTOMER.name, CUSTOMER.city))).toBeVisible();
  /* No one is on the installation team yet: the sheet says where to get one, and the move goes. */
  await expect(sheet.getByText(SHEETS.dispatch.none)).toBeVisible();
  await expect(sheet.getByRole('button', { name: SHEETS.dispatch.addCrew })).toBeVisible();
  const { today } = await readProject(page, projectId);
  await expect(sheet.getByText(SHEETS.dispatch.leftOn, { exact: true })).toBeVisible();
  await expect(sheet.getByRole('button', { name: packDay(today), exact: true })).toBeVisible();
  /* No wait is open: the help says only where the crew sees the job. */
  await expect(sheet.getByText(SHEETS.dispatch.help(null))).toBeVisible();

  await sheet.getByRole('button', { name: SHEETS.dispatch.send }).click();
  await expect(sheet).toBeHidden();
  await expect(
    toastSaying(page, TOAST.title({ kind: 'moved', stage: 'dispatched', undoable: true })),
  ).toBeVisible();
  await expect(hero.getByText(DETAIL.stage('dispatched'), { exact: true })).toBeVisible();
  await expect(hero.getByText(DETAIL.nextTitle(FIRST_TICK, null), { exact: true })).toBeVisible();

  /* The crew starts on site: the hero's act opens the install steps on their own page. */
  await hero.getByRole('button', { name: DETAIL.nextAct(FIRST_TICK), exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/steps$`));
  await expect(page.getByRole('heading', { level: 1, name: DETAIL.steps })).toBeVisible();
});

test('cancel asks its reason — Something else its note — and the project closes, nothing deleted', async ({
  page,
}) => {
  await openProject(page);
  await page.getByRole('button', { name: DETAIL.menu, exact: true }).click();
  await page.getByRole('menuitem', { name: DETAIL.cancel, exact: true }).click();

  const sheet = page.getByRole('dialog', { name: SHEETS.cancel.title });
  await expect(sheet.getByText(SHEETS.cancel.line(CUSTOMER.name))).toBeVisible();
  const send = sheet.getByRole('button', { name: SHEETS.cancel.send, exact: true });
  /* No reason, no cancel. */
  await expect(send).toBeDisabled();
  await sheet.getByRole('radio', { name: SHEETS.cancel.reasonWord('something_else') }).click();
  /* Something else names no reason of its own: it asks what happened. */
  await send.click();
  await expect(sheet.getByText(SHEETS.cancel.noteNeeded)).toBeVisible();
  const note = 'The roof is being rebuilt next year';
  await sheet.getByRole('textbox', { name: SHEETS.cancel.note }).fill(note);
  await send.click();

  await expect(sheet).toBeHidden();
  await expect(toastSaying(page, TOAST.title({ kind: 'cancelled' }))).toBeVisible();
  const hero = heroOf(page);
  await expect(hero.getByText(DETAIL.stage('cancelled'), { exact: true })).toBeVisible();
  await expect(
    hero.getByText(DETAIL.cancelledLine('something_else'), { exact: true }),
  ).toBeVisible();
  await expect(hero.getByText(note, { exact: true })).toBeVisible();
  /* A closed project takes no more acts. */
  await expect(page.getByRole('button', { name: DETAIL.menu, exact: true })).toHaveCount(0);
});

test('a wait on the customer is said, reminded in their words, and closed', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const { projectId } = await openProject(page);
  const { today } = await readProject(page, projectId);
  const reason = BLOCKER_REASONS_BY_PARTY.customer[0];
  if (reason === undefined) throw new Error('the customer can hold a project up on nothing');

  await page.getByRole('button', { name: DETAIL.noWaitTitle, exact: true }).click();
  const sheet = page.getByRole('dialog', { name: SHEETS.wait.title });
  const save = sheet.getByRole('button', { name: SHEETS.wait.send });
  await expect(save).toBeDisabled();
  await sheet.getByRole('radio', { name: SHEETS.wait.party('customer') }).click();
  await sheet
    .getByRole('radiogroup', { name: SHEETS.wait.why })
    .getByRole('radio', { name: SHEETS.wait.reason(reason) })
    .click();
  /* What the customer will read of it, the team's note never among it. */
  await expect(
    sheet.getByText(SHEETS.wait.customerSeesLine('customer', reason, today), { exact: true }),
  ).toBeVisible();
  await save.click();
  await expect(sheet).toBeHidden();
  await expect(
    toastSaying(page, TOAST.title({ kind: 'waitSaved', party: 'customer', date: today })),
  ).toBeVisible();
  await expect(page.getByText(DETAIL.waitTitle('customer'), { exact: true })).toBeVisible();
  await expect(page.getByText(DETAIL.waitLine(reason, today), { exact: true })).toBeVisible();

  /* Remind hands the person a kind line to send themselves: copied, never claimed delivered. */
  await page.getByRole('button', { name: DETAIL.remind, exact: true }).click();
  await expect(toastSaying(page, TOAST.title({ kind: 'copied' }))).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(CUSTOMER.name);

  await page.getByRole('button', { name: DETAIL.waitOver, exact: true }).click();
  await expect(toastSaying(page, TOAST.title({ kind: 'waitEnded' }))).toBeVisible();
  await expect(page.getByRole('button', { name: DETAIL.noWaitTitle, exact: true })).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('a move another person made first is named with who made it, and nothing moves twice', async ({
  page,
}) => {
  const { projectId } = await openProject(page);
  const hero = heroOf(page);
  await expect(hero.getByText(DETAIL.nextTitle(MOVE, null), { exact: true })).toBeVisible();
  /* Someone else moves it while this page still shows Won. */
  await actThroughApi(page, projectId, 'move', { to: 'material_ordered' });

  await hero.getByRole('button', { name: DETAIL.nextAct(MOVE), exact: true }).click();
  const said = DETAIL.said('already_moved', false, {
    by: OWNER_NAME,
    stage: 'material_ordered',
  });
  await expect(page.getByText(said ?? '', { exact: true })).toBeVisible();
  /* The page reads the project again: it stands where the other move took it. */
  await expect(hero.getByText(DETAIL.stage('material_ordered'), { exact: true })).toBeVisible();
  expect((await readProject(page, projectId)).stage).toBe('material_ordered');
});
