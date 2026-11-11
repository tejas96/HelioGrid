import { createTranslator, handoverWords, projectDetailWords } from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import {
  CUSTOMER,
  firstPersonRow,
  markNotNeededThroughApi,
  ownerWithProject,
  readHandover,
  readProject,
  readyForHandover,
  toastSaying,
  uploadToRowThroughApi,
} from '../support/project';
import { packDay, packWord } from '../support/project-facts';

/**
 * `/projects/<id>/handover` (`SCR-M08-06`): the project manager finishing a job, come to see what
 * still waits and hand over. While a row waits, the page names it — a tap opens the checklist — and
 * keeps *Hand over* off with its reason; a row marked not needed waits no more. The pack's tile says
 * what it will hold, and the ready message shows in the customer's language, to send only once
 * handed over. With every row done or not needed, *Hand over* is the one act: the moment follows,
 * the pack is made a few seconds after by the worker, and the message is the person's to copy —
 * nothing claims it was delivered. The project is started, walked and its rows marked through the
 * api (`support/project.ts`); `projects-[id].spec.ts` drives *Mark won* and *Not needed* themselves.
 */
const en = await createTranslator('en');
const HANDOVER = handoverWords(en.t, packWord);
const DETAIL = projectDetailWords(en.t, packWord, packDay);

/** The row a handed-over project's pack holds: its one file, uploaded before the handover. */
const WARRANTY = 'warranty_documents';

const handOverAct = (page: Page) => page.getByRole('button', { name: HANDOVER.send, exact: true });

/** A project whose first person's row was marked not needed; answers it and the rows still waiting. */
async function openHandover(page: Page) {
  const { projectId } = await ownerWithProject(page, en);
  const marked = firstPersonRow(await readProject(page, projectId));
  await markNotNeededThroughApi(page, projectId, marked, 'Signed on paper');
  const preview = await readHandover(page, projectId);
  await page.goto(`/projects/${projectId}/handover`);
  await expect(page.getByRole('heading', { level: 1, name: HANDOVER.title })).toBeVisible();
  return { projectId, marked, preview };
}

test('the handover names the rows still waiting and keeps Hand over off while any wait', async ({
  page,
}) => {
  const { marked, preview } = await openHandover(page);
  expect(preview.pendingRows).not.toEqual([]);
  expect(preview.pendingRows).not.toContain(marked);

  const checks = page.getByRole('region', { name: HANDOVER.waitingTitle });
  await expect(checks.getByText(HANDOVER.waitingLine)).toBeVisible();
  for (const row of preview.pendingRows) {
    await expect(page.getByRole('button', { name: HANDOVER.row(row), exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: HANDOVER.row(marked), exact: true })).toHaveCount(
    0,
  );
  /* Off, never hidden: it stays where the person looks, its reason the line above. */
  await expect(handOverAct(page)).toHaveAttribute('aria-disabled', 'true');
  /* The pack's tile says what it will hold — or that there is nothing to put in one. */
  await expect(page.getByText(HANDOVER.packTitle, { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      preview.pack.files === 0 ? HANDOVER.packEmpty : HANDOVER.packUnmade(preview.pack.files),
      { exact: true },
    ),
  ).toBeVisible();
  /* The ready message, in the customer's language — sent only once handed over. */
  await expect(page.getByText(HANDOVER.message(preview.message.language))).toBeVisible();
  await expect(page.getByRole('button', { name: HANDOVER.copy, exact: true })).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('a waiting row opens the project’s checklist', async ({ page }) => {
  const { projectId, preview } = await openHandover(page);
  const [first] = preview.pendingRows;
  if (first === undefined) throw new Error('a new project has no row waiting for handover');

  /* The row's open target is a named button under the row: a keyboard user focuses it and presses
     Enter, which a cover over the row never catches (`tests/e2e/CLAUDE.md`, Traps). */
  await page.getByRole('button', { name: HANDOVER.row(first), exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/documents$`));
  await expect(page.getByRole('heading', { level: 1, name: DETAIL.documents })).toBeVisible();
});

test('with every row done or not needed, Hand over hands over: the moment, the pack and the message to send', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const { projectId } = await ownerWithProject(page, en);
  await readyForHandover(page, projectId, [WARRANTY]);
  const project = await uploadToRowThroughApi(page, projectId, WARRANTY);
  const preview = await readHandover(page, projectId);
  expect(preview.pendingRows).toEqual([]);
  expect(preview.pack.files).toBe(1);
  const count = (state: string) =>
    project.documents.filter((document) => document.state === state).length;

  await page.goto(`/projects/${projectId}/handover`);
  const ready = page.getByRole('region', { name: HANDOVER.ready });
  await expect(
    ready.getByText(HANDOVER.readyLine(count('done'), count('not_needed')), { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(HANDOVER.packUnmade(1), { exact: true })).toBeVisible();
  await expectNoSeriousViolations(page);

  await handOverAct(page).click();
  /* The moment replaces the act, and takes the focus. */
  const done = page.getByRole('heading', { level: 1, name: HANDOVER.done });
  await expect(done).toBeVisible();
  await expect(done).toBeFocused();
  await expect(
    page.getByText(HANDOVER.doneLine(CUSTOMER.name, true), { exact: true }),
  ).toBeVisible();
  /* The worker makes the pack a few seconds after: being made, or made — never missing. */
  const making = new RegExp(`^(${HANDOVER.packMaking}|${HANDOVER.packMade(1)})$`);
  await expect(page.getByRole('status').filter({ hasText: making })).toBeVisible();

  /* The message is the person's to send from their own app: copied, and no delivery claimed. */
  await expect(page.getByText(HANDOVER.noDelivery, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: HANDOVER.copy, exact: true }).click();
  await expect(toastSaying(page, HANDOVER.copied)).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(preview.message.text);

  /* While the customer is happy, the referral ask; Not now leaves for the project, handed over. */
  await expect(page.getByText(HANDOVER.referralTitle, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: HANDOVER.referralSkip, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}$`));
  const hero = page.getByRole('region', { name: DETAIL.now, exact: true });
  await expect(hero.getByText(DETAIL.stage('handed_over'), { exact: true })).toBeVisible();
  const handedOn = (await readProject(page, projectId)).enteredOn;
  await expect(hero.getByText(DETAIL.handedOverOn(handedOn), { exact: true })).toBeVisible();
});
