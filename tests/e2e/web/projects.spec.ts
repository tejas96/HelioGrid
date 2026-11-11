import { createTranslator, projectBoardWords } from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { OWNER_NAME } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
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
 * figure, today, and nothing asks the owner anything yet. Wide, the stages are a rail across the top
 * and the projects OneOhm's table; narrow, one stage pill and a card of rows per stage. The search
 * finds a project by its number, a stage chosen shows only its own, a long stage holds its oldest
 * rows behind *Show more*, and the handed-over stop counts the last 30 days. The leads are won
 * through the api here, as the lead page's sheet sends it; `projects-[id].spec.ts` drives that sheet.
 */
const en = await createTranslator('en');
const BOARD = projectBoardWords(en.t, PACK, 'en');

/** The customer a second project is sold to, kept apart from the first by name. */
const SECOND = { name: 'Meera Kulkarni', city: 'Pune' } as const;

/** A project's open target: a named button a keyboard user focuses, wide and narrow alike. */
const openOf = (page: Page, name: string) =>
  page.getByRole('button', { name: BOARD.open(name), exact: true });

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

/** Wide, the rail of stops; narrow, the stage sheet's options — each a stage with its count. */
const railOf = (page: Page) => page.getByRole('group', { name: BOARD.stagesName, exact: true });

test('a new company’s board has no project yet and teaches that Mark won starts one', async ({
  page,
}) => {
  await ownerWithCompany(page, en);
  await openBoard(page);

  await expect(page.getByText(BOARD.emptyTitle, { exact: true })).toBeVisible();
  await expect(page.getByText(BOARD.emptyBody, { exact: true })).toBeVisible();
  /* Nothing to search yet: the search waits for a board with projects on it. */
  await expect(page.getByRole('searchbox', { name: BOARD.search.placeholder })).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('the won lead’s project stands under Won, today, and nothing needs the owner yet', async ({
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

  /* The title's line and the day's hero say the same: one live project, and all clear. */
  await expect(
    page.getByText(BOARD.summary({ live: 1, todo: 0, waiting: 0, allClear: true }), {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(BOARD.allClearTitle, { exact: true })).toBeVisible();
  await expect(page.getByText(BOARD.allClearBody(1), { exact: true })).toBeVisible();

  if (isWide(page)) {
    /* The rail's Won stop counts it, and its line is the longest stay there. */
    const stop = railOf(page).getByRole('button').filter({ hasText: won });
    await expect(stop).toContainText('1');
    await expect(stop).toContainText(BOARD.stopLine({ longestDays: 0, recent: false }) ?? '');
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
  if (!isWide(page)) {
    /* Narrow, the search waits behind its glyph beside the title. */
    await page.getByRole('button', { name: BOARD.search.open, exact: true }).click();
  }
  const search = page.getByRole('searchbox', { name: BOARD.search.placeholder });
  await expect(search).toBeVisible();

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

test('a stage chosen shows only its own projects, and says when it has none', async ({ page }) => {
  await ownerWithCompany(page, en);
  await boardWithProject(page);
  const ordered = BOARD.stage('material_ordered');

  if (isWide(page)) {
    await railOf(page).getByRole('button').filter({ hasText: ordered }).click();
    await expect(page.getByRole('heading', { level: 2, name: ordered })).toBeVisible();
    await expect(
      page.getByText(BOARD.noneInStage('material_ordered')).filter({ visible: true }),
    ).toBeVisible();
    await expect(openOf(page, CUSTOMER.name)).toHaveCount(0);

    await page.getByRole('button', { name: BOARD.clearStage, exact: true }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: BOARD.allLiveProjects }),
    ).toBeVisible();
  } else {
    /* Narrow, one pill names the stage shown and opens every stage as a sheet. */
    await page.getByRole('button', { name: BOARD.allStages, exact: true }).click();
    const sheet = page.getByRole('dialog', { name: BOARD.showStage });
    await expect(sheet.getByText(BOARD.showStageLine)).toBeVisible();
    await sheet.getByRole('radio', { name: ordered }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole('heading', { level: 3, name: ordered })).toBeVisible();
    await expect(
      page.getByText(BOARD.noneInStage('material_ordered')).filter({ visible: true }),
    ).toBeVisible();
    await expect(openOf(page, CUSTOMER.name)).toHaveCount(0);

    await page.getByRole('button', { name: ordered, exact: true }).click();
    await page
      .getByRole('dialog', { name: BOARD.showStage })
      .getByRole('radio', { name: BOARD.allStages })
      .click();
  }
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

test('a project handed over leaves the live stages, and its stop counts the last 30 days', async ({
  page,
}) => {
  await ownerWithCompany(page, en);
  await markWonThroughApi(page, await captureLead(page));
  const closed = await markWonThroughApi(page, await captureLead(page, SECOND));
  await handOverThroughApi(page, closed.projectId);
  await openBoard(page);
  const handedOver = BOARD.stage('handed_over');
  const recent = BOARD.stopLine({ longestDays: null, recent: true }) ?? '';

  /* Live, only the project still moving. */
  await expect(openOf(page, CUSTOMER.name)).toHaveCount(1);
  await expect(openOf(page, SECOND.name)).toHaveCount(0);

  if (isWide(page)) {
    const stop = railOf(page).getByRole('button').filter({ hasText: handedOver });
    await expect(stop).toContainText('1');
    await expect(stop).toContainText(recent);
    await stop.click();
    await expect(page.getByRole('heading', { level: 2, name: handedOver })).toBeVisible();
  } else {
    await page.getByRole('button', { name: BOARD.allStages, exact: true }).click();
    const option = page
      .getByRole('dialog', { name: BOARD.showStage })
      .getByRole('radio', { name: handedOver });
    await expect(option).toContainText(recent);
    await expect(option).toContainText('1');
    await option.click();
    await expect(page.getByRole('heading', { level: 3, name: handedOver })).toBeVisible();
  }
  /* Chosen, the stop lists the project it counts, and the live one steps aside. */
  await expect(openOf(page, SECOND.name)).toHaveCount(1);
  await expect(openOf(page, CUSTOMER.name)).toHaveCount(0);
  await expectNoSeriousViolations(page);
});
