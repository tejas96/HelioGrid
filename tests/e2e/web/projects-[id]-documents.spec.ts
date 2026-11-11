import {
  createTranslator,
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
  firstPersonRow,
  onePagePdf,
  ownerWithProject,
  readProject,
  TO_UTILITY_INSPECTION,
  toastSaying,
  walkThroughApi,
} from '../support/project';
import { packDay, packWord } from '../support/project-facts';

/**
 * `/projects/<id>/documents` (`SCR-M08-03`): the project manager at a desk going through the papers.
 * The title counts what is done of all; the page lists every row the project carries, as the api
 * reads them — each waiting row with *Upload* and a quiet *Not needed*, each spoken with its row, the
 * row handover itself makes marked so — and says when handover opens. *Not needed* keeps a row with
 * its reason; *Needed after all* puts it back to waiting. Where a row's file moves the project to its
 * next stage, the hero names it with its upload, and the file moves it by itself. The project is
 * started, and walked, through the api (`support/project.ts`); `projects-[id].spec.ts` drives
 * *Mark won* itself.
 */
const en = await createTranslator('en');
const DETAIL = projectDetailWords(en.t, packWord, packDay);
const SHEETS = projectSheetWords(en.t, packWord, packDay);
const TOAST = projectToastWords(en.t, packWord, packDay);
const REASON = 'The customer signed on paper';

/** The row whose file moves a project at DISCOM inspection to Commissioned, and the one after. */
const CERTIFICATE = 'commissioning_certificate';
const SUBSIDY = 'incentive_application';

/** One checklist row, by the pack's word for it. */
const rowOf = (page: Page, row: string) =>
  page.getByRole('listitem').filter({ has: page.getByText(DETAIL.row(row), { exact: true }) });
const heroOf = (page: Page) =>
  page.getByRole('region', { name: DETAIL.movesTheStage, exact: true });

async function openChecklist(page: Page, walk: typeof TO_UTILITY_INSPECTION = []): Promise<string> {
  const { projectId } = await ownerWithProject(page, en);
  await walkThroughApi(page, projectId, walk);
  await page.goto(`/projects/${projectId}/documents`);
  await expect(page.getByRole('heading', { level: 1, name: DETAIL.documents })).toBeVisible();
  return projectId;
}

test('the checklist lists every row the project carries, each with its state and its acts', async ({
  page,
}) => {
  const projectId = await openChecklist(page);
  const { documents } = await readProject(page, projectId);
  expect(documents).not.toEqual([]);

  /* The title's line: whose papers, and how many are done of all. */
  await expect(
    page.getByText(DETAIL.docsSummary(CUSTOMER.name, 0, documents.length), { exact: true }),
  ).toBeVisible();
  for (const document of documents) {
    const row = rowOf(page, document.row);
    await expect(row).toBeVisible();
    if (document.madeBy === 'handover') {
      /* The handover pack is made by handover itself: no one uploads it or waives it. */
      await expect(row.getByText(DETAIL.madeAtHandover, { exact: true })).toBeVisible();
      await expect(row.getByRole('button')).toHaveCount(0);
    } else {
      /* Each act says the row it acts on, so a screen reader never hears two alike. */
      await expect(
        row.getByRole('button', { name: DETAIL.uploadRow(document.row), exact: true }),
      ).toBeVisible();
      await expect(
        row.getByRole('button', { name: DETAIL.notNeededRow(document.row), exact: true }),
      ).toBeVisible();
    }
  }
  await expect(page.getByText(DETAIL.docsCaption, { exact: true })).toBeVisible();
  /* At Won no row's file moves the project: the next stage is a tap. */
  await expect(heroOf(page)).toHaveCount(0);
  /* The way back names the project the checklist belongs to. */
  await expect(page.getByRole('button', { name: CUSTOMER.name, exact: true })).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('Not needed keeps the row with its reason, and Needed after all puts it back to waiting', async ({
  page,
}) => {
  const projectId = await openChecklist(page);
  const marked = firstPersonRow(await readProject(page, projectId));
  const row = rowOf(page, marked);

  await row.getByRole('button', { name: DETAIL.notNeededRow(marked), exact: true }).click();
  const sheet = page.getByRole('dialog', { name: SHEETS.notNeeded.title });
  await sheet.getByRole('textbox', { name: SHEETS.notNeeded.reason }).fill(REASON);
  await sheet.getByRole('button', { name: SHEETS.notNeeded.send }).click();
  await expect(sheet).toBeHidden();
  /* Marked, never removed: the row stays on the checklist with why, and waits no more. */
  await expect(row.getByText(DETAIL.notNeeded, { exact: true })).toBeVisible();
  await expect(row.getByText(DETAIL.notNeededBecause(REASON), { exact: true })).toBeVisible();
  await expect(row.getByRole('button', { name: DETAIL.uploadRow(marked) })).toHaveCount(0);

  await row.getByRole('button', { name: DETAIL.reopenRow(marked), exact: true }).click();
  await expect(
    row.getByRole('button', { name: DETAIL.uploadRow(marked), exact: true }),
  ).toBeVisible();
  await expect(
    row.getByRole('button', { name: DETAIL.notNeededRow(marked), exact: true }),
  ).toBeVisible();
  await expect(row.getByText(DETAIL.notNeededBecause(REASON), { exact: true })).toHaveCount(0);
});

test('the hero names the file that moves the stage, and its upload moves the project by itself', async ({
  page,
}) => {
  const projectId = await openChecklist(page, TO_UTILITY_INSPECTION);
  const hero = heroOf(page);
  await expect(hero.getByText(DETAIL.row(CERTIFICATE), { exact: true })).toBeVisible();
  await expect(hero.getByText(DETAIL.movesByItself('commissioned'), { exact: true })).toBeVisible();
  await expectNoSeriousViolations(page);

  /* A photo or a file: the browser's own chooser, and a PDF from the desk. */
  const chooser = page.waitForEvent('filechooser');
  await hero.getByRole('button', { name: DETAIL.uploadRow(CERTIFICATE), exact: true }).click();
  await (await chooser).setFiles({
    name: 'Commissioning.pdf',
    mimeType: 'application/pdf',
    buffer: onePagePdf(),
  });
  await expect(
    toastSaying(page, TOAST.title({ kind: 'documentDone', row: CERTIFICATE })),
  ).toBeVisible();

  /* The row is done, with who uploaded it; the project stands at Commissioned by itself. */
  const row = rowOf(page, CERTIFICATE);
  await expect(row.getByText(DETAIL.done, { exact: true })).toBeVisible();
  const project = await readProject(page, projectId);
  expect(project.stage).toBe('commissioned');
  const certificate = project.documents.find((document) => document.row === CERTIFICATE);
  await expect(
    row.getByText(DETAIL.uploadedBy(OWNER_NAME, certificate?.changedAt ?? ''), { exact: true }),
  ).toBeVisible();
  await expect(row.getByText('Commissioning.pdf', { exact: true })).toBeVisible();
  /* The hero moves on to the next row whose file moves the project. */
  await expect(hero.getByText(DETAIL.row(SUBSIDY), { exact: true })).toBeVisible();
  await expect(
    hero.getByText(DETAIL.movesByItself('incentive_claimed'), { exact: true }),
  ).toBeVisible();
});
