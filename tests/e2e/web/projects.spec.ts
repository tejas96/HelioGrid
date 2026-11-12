import { createTranslator, projectBoardTopWords, projectBoardWords } from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { OWNER_NAME } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { dueNow, packMoney, readPayments } from '../support/payments';
import {
  CUSTOMER,
  captureLead,
  handOverThroughApi,
  isWide,
  markWonThroughApi,
  ownerWithCompany,
  readProject,
  type StartedProject,
} from '../support/project';
import { PACK } from '../support/project-facts';

/**
 * `/projects` (`SCR-M08-01`): the project manager or the owner between calls, come to see what needs
 * them and where every job stands. A new company has no project, so the board teaches the one way a
 * project starts — a lead marked won. Once one is won, its project stands under Won with its days
 * figure, today, and nothing asks the owner anything yet. The list top every list page shares heads
 * it — the summary, the search with the order and the manager filter, a chip per stage with a
 * project — over OneOhm's table wide and a card per project narrow. The search finds a project by
 * its number, a stage chip shows only its own, a long stage holds its oldest rows behind *Show
 * more*, and the handed-over chip counts the last 30 days. The leads are won
 * through the api here, as the lead page's sheet sends it; `projects-[id].spec.ts` drives that sheet.
 */
const en = await createTranslator('en');
const BOARD = projectBoardWords(en.t, PACK, 'en');
const TOP = projectBoardTopWords(en.t);

/** The customer a second project is sold to, kept apart from the first by name. */
const SECOND = { name: 'Meera Kulkarni', city: 'Pune' } as const;

/**
 * A project's open target in the list of live projects — the table wide, the stage cards narrow —
 * a named button a keyboard user focuses. A won project's first part falls due at once, so it also
 * stands under *To do*; this is its row in the list.
 */
const openOf = (page: Page, name: string) =>
  (isWide(page)
    ? page.getByRole('table')
    : page.getByRole('region', { name: BOARD.allProjects, exact: true })
  ).getByRole('button', { name: BOARD.open(name), exact: true });

async function openBoard(page: Page): Promise<void> {
  await page.goto('/projects');
  await expect(page.getByRole('heading', { level: 1, name: BOARD.title })).toBeVisible();
}

/** A new company with its customer's lead won: the board's first project. */
async function boardWithProject(page: Page): Promise<StartedProject> {
  const started = await markWonThroughApi(page, await captureLead(page));
  await openBoard(page);
  return started;
}

/** The stage chips under the search, wide and narrow alike — each a stage with its count. */
const chipOf = (page: Page, stage: string) =>
  page
    .getByRole('tablist', { name: TOP.stages, exact: true })
    .getByRole('tab')
    .filter({ hasText: stage });

/** The board's search field, named for what it does. */
const searchOf = (page: Page) => page.getByRole('searchbox', { name: BOARD.search.open });

test('a new company’s board has no project yet and teaches that Mark won starts one', async ({
  page,
}) => {
  await ownerWithCompany(page, en);
  await openBoard(page);

  await expect(page.getByText(BOARD.emptyTitle, { exact: true })).toBeVisible();
  await expect(page.getByText(BOARD.emptyBody, { exact: true })).toBeVisible();
  /* Nothing to search yet: the search waits for a board with projects on it. */
  await expect(searchOf(page)).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('the won lead’s project stands under Won, today, and its first part is due under To do', async ({
  page,
}) => {
  await ownerWithCompany(page, en);
  const { projectId } = await boardWithProject(page);
  const project = await readProject(page, projectId);
  const won = BOARD.stage('won');
  const today = BOARD.days(0);
  const facts = {
    stage: 'won',
    place: CUSTOMER.city,
    steps: { ticked: 0, total: project.steps.length },
    expectedInstallOn: project.expectedInstallOn,
  };

  /* The summary counts one live project; its first part fell due at Won, so it asks for money. */
  const summary = page.getByRole('region', { name: TOP.name, exact: true });
  await expect(summary.getByText(TOP.liveSpoken(1), { exact: true })).toBeAttached();
  await expect(summary.getByText(BOARD.allClearTitle, { exact: true })).toHaveCount(0);
  const { part } = dueNow(await readPayments(page, projectId));
  const toDo = page.getByRole('region', { name: BOARD.toDoHeading, exact: true });
  await expect(
    toDo.getByText(
      BOARD.todoLine('money_due', {
        ...facts,
        earlyProofTo: null,
        missingProofRow: null,
        money: { part: part.label, amount: packMoney(part.outstanding) },
      }),
      { exact: true },
    ),
  ).toBeVisible();
  /* The Won chip counts it; a stage with no project draws no chip. */
  await expect(chipOf(page, won)).toContainText('1');
  await expect(chipOf(page, BOARD.stage('material_ordered'))).toHaveCount(0);

  if (isWide(page)) {
    /* A line of OneOhm's table: its stage, the days it stood there and the install it promises. */
    const line = page.getByRole('row').filter({ hasText: CUSTOMER.name });
    await expect(line.getByRole('cell', { name: won, exact: true })).toBeVisible();
    await expect(line.getByText(today, { exact: true })).toBeVisible();
    await expect(line.getByText(BOARD.installCell(facts) ?? '', { exact: true })).toBeVisible();
    await expect(line.getByRole('img', { name: OWNER_NAME })).toBeVisible();
  } else {
    /* The project stands in its stage's card, with its place and install, days and manager. */
    const group = page.getByRole('region', { name: won, exact: true });
    const row = group.getByRole('listitem').filter({ hasText: CUSTOMER.name });
    await expect(row.getByText(BOARD.cardLine(facts) ?? '', { exact: true })).toBeVisible();
    await expect(row.getByText(today, { exact: true })).toBeVisible();
    await expect(row.getByRole('img', { name: OWNER_NAME })).toBeVisible();
  }
  await expect(page.getByText(BOARD.emptyTitle, { exact: true })).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('a project’s row opens its page', async ({ page }) => {
  await ownerWithCompany(page, en);
  const { projectId } = await boardWithProject(page);

  /* The row's open target is a named button under the row: a keyboard user focuses it and presses
     Enter, which a cover over the row never catches (`tests/e2e/CLAUDE.md`, Traps). */
  await openOf(page, CUSTOMER.name).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}$`));
  await expect(page.getByRole('heading', { level: 1, name: CUSTOMER.name })).toBeVisible();
});

test('the search finds a project by its number, and says so when it finds none', async ({
  page,
}) => {
  await ownerWithCompany(page, en);
  const { number } = await boardWithProject(page);
  /* The search stands under the summary in both rooms, its hint naming what it finds. */
  const search = searchOf(page);
  await expect(search).toBeVisible();
  await expect(search).toHaveAttribute('placeholder', BOARD.search.placeholder);

  await search.fill(number);
  await expect(openOf(page, CUSTOMER.name)).toHaveCount(1);

  const missed = 'Nobody by this name';
  await search.fill(missed);
  /* Both rooms draw the line; only the one the board's width shows is seen. */
  const noMatch = page
    .getByText(BOARD.search.noMatch(missed), { exact: true })
    .filter({ visible: true });
  await expect(noMatch).toBeVisible();
  await expect(openOf(page, CUSTOMER.name)).toHaveCount(0);

  /* The clear under the line empties the search, and the project is back. */
  await page
    .locator('.hg-project-board-no-match')
    .filter({ visible: true })
    .getByRole('button', { name: BOARD.search.clear, exact: true })
    .click();
  await expect(search).toHaveValue('');
  await expect(noMatch).toHaveCount(0);
  await expect(openOf(page, CUSTOMER.name)).toHaveCount(1);
});

test('a stage chip shows only its own projects, and All brings every stage back', async ({
  page,
}) => {
  await ownerWithCompany(page, en);
  await markWonThroughApi(page, await captureLead(page));
  const closed = await markWonThroughApi(page, await captureLead(page, SECOND));
  await handOverThroughApi(page, closed.projectId);
  await openBoard(page);
  const won = BOARD.stage('won');

  await chipOf(page, won).click();
  await expect(chipOf(page, won)).toHaveAttribute('aria-selected', 'true');
  await expect(
    page.getByRole('heading', { level: isWide(page) ? 2 : 3, name: won }).filter({ visible: true }),
  ).toBeVisible();
  await expect(openOf(page, CUSTOMER.name)).toHaveCount(1);

  await chipOf(page, TOP.all).first().click();
  await expect(chipOf(page, won)).toHaveAttribute('aria-selected', 'false');
  await expect(openOf(page, CUSTOMER.name)).toHaveCount(1);
});

test('a stage’s card holds its newest rows behind Show more', async ({ page }) => {
  test.skip(
    isWide(page),
    'wide, the table holds fourteen rows before Show more — past the ten live projects a new company’s plan allows',
  );
  await ownerWithCompany(page, en);
  const names = ['Arjun', 'Bhavna', 'Chetan', 'Divya', 'Eshan'].map((first) => `${first} Joshi`);
  for (const name of names) {
    await markWonThroughApi(page, await captureLead(page, { name, city: CUSTOMER.city }));
  }
  await openBoard(page);

  const group = page.getByRole('region', { name: BOARD.stage('won'), exact: true });
  const rows = group.getByRole('listitem').filter({ hasText: 'Joshi' });
  await expect(rows).toHaveCount(4);
  await group.getByRole('button', { name: BOARD.showMore(1), exact: true }).click();
  await expect(rows).toHaveCount(names.length);
  /* The press leaves with its button: focus lands on the first row it let in. */
  const opens = new RegExp(`^(${names.map((name) => BOARD.open(name)).join('|')})$`);
  await expect(group.getByRole('button', { name: opens }).nth(4)).toBeFocused();
});

test('a project handed over leaves the live stages, and its chip counts the last 30 days', async ({
  page,
}) => {
  await ownerWithCompany(page, en);
  await markWonThroughApi(page, await captureLead(page));
  const closed = await markWonThroughApi(page, await captureLead(page, SECOND));
  await handOverThroughApi(page, closed.projectId);
  await openBoard(page);
  const handedOver = BOARD.stage('handed_over');

  /* Live, only the project still moving. */
  await expect(openOf(page, CUSTOMER.name)).toHaveCount(1);
  await expect(openOf(page, SECOND.name)).toHaveCount(0);

  /* The handed-over chip counts the project handed over in the last 30 days. */
  const chip = chipOf(page, handedOver);
  await expect(chip).toContainText('1');
  await chip.click();
  await expect(
    page
      .getByRole('heading', { level: isWide(page) ? 2 : 3, name: handedOver })
      .filter({ visible: true }),
  ).toBeVisible();
  /* Chosen, the chip lists the project it counts, and the live one steps aside. */
  await expect(openOf(page, SECOND.name)).toHaveCount(1);
  await expect(openOf(page, CUSTOMER.name)).toHaveCount(0);
  await expectNoSeriousViolations(page);
});
