import type { NextStep } from '@heliogrid/domain';
import {
  createTranslator,
  destinationLabel,
  installerJobWords,
  projectDetailWords,
  projectSheetWords,
  projectToastWords,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { OWNER_NAME } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { pngOf } from '../support/png';
import {
  CUSTOMER,
  ownerWithCompany,
  ownerWithProject,
  readProject,
  toastSaying,
  walkThroughApi,
} from '../support/project';
import { packDay, packWord } from '../support/project-facts';

/**
 * `/projects/<id>/steps` (`SCR-M08-04`): the project manager checking the crew's progress, or a crew
 * member at a laptop — they came to tick a step, add its photo or read how to get in. Opened from the
 * hero's act once the material left; the way back names the project. Who is on the crew, how to get
 * in with its edit, then each install step as a large tick with its photo act on the next one. The
 * first tick moves the project to Installation by itself (ruling 1); *Done by someone else?* names
 * who did the work. The project is started and dispatched through the api (`support/project.ts`);
 * `projects-[id].spec.ts` drives *Dispatched* and the hero's way here.
 */
const en = await createTranslator('en');
const DETAIL = projectDetailWords(en.t, packWord, packDay);
const SHEETS = projectSheetWords(en.t, packWord, packDay);
const TOAST = projectToastWords(en.t, packWord, packDay);
const JOB = installerJobWords(en.t, packWord);

const stepsOf = (page: Page) => page.getByRole('region', { name: JOB.steps, exact: true });

/** A new company's project, dispatched with no crew: the steps are the crew's next. */
async function openSteps(page: Page): Promise<{ projectId: string; steps: readonly string[] }> {
  const { projectId } = await ownerWithProject(page, en);
  const project = await walkThroughApi(page, projectId, ['material_ordered', 'dispatched']);
  await page.goto(`/projects/${projectId}/steps`);
  await expect(page.getByRole('heading', { level: 1, name: DETAIL.steps })).toBeVisible();
  return { projectId, steps: project.steps.map((step) => step.step) };
}

test('the steps page shows the crew, how to get in and every install step to tick', async ({
  page,
}) => {
  const { steps } = await openSteps(page);
  const [first] = steps;
  if (first === undefined) throw new Error('a project carries no install step');

  /* The way back: the board, then the project by its customer's name, then where the person is. */
  const trail = page.getByRole('navigation', { name: destinationLabel(en.t, 'projects') });
  await expect(trail.getByRole('button', { name: CUSTOMER.name, exact: true })).toBeVisible();
  await expect(
    page.getByText(DETAIL.stepsSummary(CUSTOMER.name, 0, steps.length), { exact: true }),
  ).toBeVisible();
  /* No crew was picked at Dispatched — the team has no installer yet — and no way in is written. */
  const crew = page.getByRole('region', { name: DETAIL.crew, exact: true });
  await expect(crew.getByText(DETAIL.noCrew, { exact: true })).toBeVisible();
  const access = page.getByRole('region', { name: DETAIL.accessNote, exact: true });
  await expect(access.getByText(DETAIL.noAccessNote, { exact: true })).toBeVisible();

  const list = stepsOf(page);
  await expect(list.getByText(JOB.stepsCount(0, steps.length), { exact: true })).toBeVisible();
  for (const step of steps) {
    await expect(
      list.getByRole('checkbox', { name: JOB.step(step), exact: true }),
    ).not.toBeChecked();
  }
  /* Only the next step offers its photo, spoken with its step. */
  await expect(
    list.getByRole('button', { name: JOB.photoStep(JOB.step(first)), exact: true }),
  ).toBeVisible();
  const anyPhoto = new RegExp(`^${JOB.photoStep('')}`);
  await expect(list.getByRole('button', { name: anyPhoto })).toHaveCount(1);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('the first tick, done by someone else, moves the project to Installation by itself', async ({
  page,
}) => {
  const { projectId, steps } = await openSteps(page);
  const [first, second] = steps;
  if (first === undefined || second === undefined) throw new Error('a project carries one step');
  const list = stepsOf(page);
  const worker = 'Ravi Kumar';

  /* The person ticking was not the one on the roof: the name rides on the ticks that follow. */
  await list.getByRole('button', { name: JOB.doneBy, exact: true }).click();
  await list.getByRole('textbox', { name: JOB.doneBy, exact: true }).fill(worker);
  await list.getByRole('checkbox', { name: JOB.step(first), exact: true }).click();
  /* The tick's news is the move it made: the project went to Installation by itself. */
  await expect(
    toastSaying(page, TOAST.title({ kind: 'moved', stage: 'installation', undoable: false })),
  ).toBeVisible();
  await expect(list.getByRole('checkbox', { name: JOB.step(first), exact: true })).toBeChecked();
  await expect(list.getByText(JOB.doneByWho(worker), { exact: true })).toBeVisible();
  await expect(
    page.getByText(DETAIL.stepsSummary(CUSTOMER.name, 1, steps.length), { exact: true }),
  ).toBeVisible();
  /* The photo act moves on to the next step, and a tick that moves nothing says the step. */
  await expect(
    list.getByRole('button', { name: JOB.photoStep(JOB.step(second)), exact: true }),
  ).toBeVisible();
  await list.getByRole('checkbox', { name: JOB.step(second), exact: true }).click();
  await expect(toastSaying(page, TOAST.title({ kind: 'stepTicked', step: second }))).toBeVisible();
  await expect(
    page.getByText(DETAIL.stepsSummary(CUSTOMER.name, 2, steps.length), { exact: true }),
  ).toBeVisible();

  const project = await readProject(page, projectId);
  expect(project.stage).toBe('installation');
  expect(project.steps[0]?.tickedBy?.name).toBe(OWNER_NAME);

  /* Back on the project, the hero stands at Installation and counts the ticks. */
  await page.getByRole('button', { name: CUSTOMER.name, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}$`));
  const hero = page.getByRole('region', { name: DETAIL.now, exact: true });
  await expect(hero.getByText(DETAIL.stage('installation'), { exact: true })).toBeVisible();
  const ticks: NextStep = {
    kind: 'steps',
    to: 'electrical_metering',
    ticked: 2,
    total: steps.length,
  };
  await expect(hero.getByText(DETAIL.nextTitle(ticks, null), { exact: true })).toBeVisible();
  await expect(
    hero.getByRole('button', { name: DETAIL.nextAct(ticks), exact: true }),
  ).toBeVisible();
});

test('a step’s photo goes on the project from the browser’s own chooser', async ({ page }) => {
  const { projectId, steps } = await openSteps(page);
  const [first] = steps;
  if (first === undefined) throw new Error('a project carries no install step');

  const chooser = page.waitForEvent('filechooser');
  await stepsOf(page)
    .getByRole('button', { name: JOB.photoStep(JOB.step(first)), exact: true })
    .click();
  await (await chooser).setFiles({
    name: 'roof.png',
    mimeType: 'image/png',
    buffer: pngOf(64, 64),
  });
  await expect(toastSaying(page, TOAST.title({ kind: 'saved' }))).toBeVisible();
  const project = await readProject(page, projectId);
  expect(project.steps[0]?.files).toHaveLength(1);
});

test('how to get in is written once, for the crew to read', async ({ page }) => {
  await openSteps(page);
  const access = page.getByRole('region', { name: DETAIL.accessNote, exact: true });
  await access.getByRole('button', { name: DETAIL.changeAccess, exact: true }).click();

  const sheet = page.getByRole('dialog', { name: SHEETS.access.title });
  await expect(sheet.getByText(SHEETS.access.line)).toBeVisible();
  const note = 'Key with the watchman; the ladder is behind the water tank';
  await sheet.getByRole('textbox', { name: SHEETS.access.title }).fill(note);
  await sheet.getByRole('button', { name: SHEETS.access.send, exact: true }).click();
  await expect(sheet).toBeHidden();
  await expect(toastSaying(page, TOAST.title({ kind: 'saved' }))).toBeVisible();
  await expect(access.getByText(note, { exact: true })).toBeVisible();
  await expect(access.getByText(DETAIL.noAccessNote, { exact: true })).toHaveCount(0);
});

test('steps opened from a stale link say the project is not the reader’s to see', async ({
  page,
}) => {
  await ownerWithCompany(page, en);
  await page.goto(`/projects/${crypto.randomUUID()}/steps`);
  await expect(page.getByText(DETAIL.goneTitle, { exact: true })).toBeVisible();
  await expect(page.getByText(DETAIL.goneBody, { exact: true })).toBeVisible();
  await expectNoSeriousViolations(page);
});
