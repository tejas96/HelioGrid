import { createTranslator, SIGN_IN, TEAM, TEAM_EMPTY_CHIP, teamActWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { settledBox } from '../support/layout';
import { TeamListStory } from './MemberList.story';

/**
 * The Team list's body (`SCR-M01-12`) in each state the web draws below the table's width and the
 * phone always draws: the failure with *Try again* (`m-error`), the search with no match, the
 * reader alone, a Status chip with nobody under it, and the named list of cards. The live app shows the failure only on a phone — a web
 * reload without the api stops at the app's own boot — so the web half's is proven here.
 */
const en = await createTranslator('en');
/** A company's name is data, not a word. */
const COMPANY = 'Suryodaya Solar';

test.use({ viewport: { width: 375, height: 800 } });

test('a failed read says so and Try again asks for the list again', async ({ mount }) => {
  let retried = 0;
  const list = await mount(
    <TeamListStory
      company={COMPANY}
      surface="failed"
      onRetry={() => {
        retried += 1;
      }}
    />,
  );
  await expect(list.getByText(en.t(TEAM.loadFailed))).toBeVisible();
  await list.getByRole('button', { name: en.t(SIGN_IN.tryAgain) }).click();
  await expect.poll(() => retried).toBe(1);
});

test('a search with no match names the words and Clear search empties it', async ({ mount }) => {
  let cleared = 0;
  const list = await mount(
    <TeamListStory
      company={COMPANY}
      surface="no-match"
      query="zzz"
      onClearSearch={() => {
        cleared += 1;
      }}
    />,
  );
  await expect(list.getByText(en.t(TEAM.noMatch, { query: 'zzz' }))).toBeVisible();
  await list.getByRole('button', { name: en.t(TEAM.clearSearch) }).click();
  await expect.poll(() => cleared).toBe(1);
});

test('a Status chip with nobody under it says so and Show all goes back to All', async ({
  mount,
}) => {
  let shown = 0;
  const list = await mount(
    <TeamListStory
      company={COMPANY}
      surface="empty-chip"
      status="expired"
      onShowAll={() => {
        shown += 1;
      }}
    />,
  );
  await expect(list.getByText(en.t(TEAM_EMPTY_CHIP.expired))).toBeVisible();
  await list.getByRole('button', { name: en.t(TEAM.showAll) }).click();
  await expect.poll(() => shown).toBe(1);
});

test('the reader alone sees their own card and the teaching words', async ({ mount }) => {
  const list = await mount(<TeamListStory company={COMPANY} surface="teaching" />);
  await expect(list.getByText('Rajesh Patil')).toBeVisible();
  await expect(list.getByText(en.t(TEAM.you), { exact: true }).first()).toBeVisible();
  await expect(list.getByText(en.t(TEAM.alone))).toBeVisible();
  await expect(list.getByText(en.t(TEAM.aloneLine))).toBeVisible();
});

test('the cards sit in a region named for the company, the open invite first', async ({
  mount,
  page,
}) => {
  await mount(<TeamListStory company={COMPANY} surface="rows" />);
  const region = page.getByRole('region', { name: en.t(TEAM.everyone, { company: COMPANY }) });
  await expect(region).toBeVisible();
  await expect(region.getByText(/Anjali Kulkarni|Rajesh Patil/)).toHaveText([
    'Anjali Kulkarni',
    'Rajesh Patil',
  ]);
});

test('while the read is out, the placeholder cards are one named busy region', async ({
  mount,
  page,
}) => {
  await mount(<TeamListStory company={COMPANY} surface="loading" />);
  await expect(page.getByRole('status', { name: en.t(TEAM.loading) })).toBeVisible();
});

test('each card carries its one act, and the only EPC Owner’s own Deactivate is off with its reason (AC-1)', async ({
  mount,
  page,
}) => {
  const acts = teamActWords(en.t, COMPANY);
  await mount(<TeamListStory company={COMPANY} surface="rows" withActs />);

  await expect(page.getByRole('button', { name: acts.act('revoke') })).toBeEnabled();
  const own = page
    .locator('.hg-record-card', { hasText: 'Rajesh Patil' })
    .getByRole('button', { name: acts.act('deactivate') });
  await expect(own).toHaveAttribute('aria-disabled', 'true');
  await expect(own).toHaveAccessibleDescription(acts.onlyOwner);
});

test('an active card opens the person; an invite does not, and a card act runs its act (D242)', async ({
  mount,
  page,
}) => {
  const frame = await mount(<TeamListStory surface="rows" company={COMPANY} withActs withOpen />);
  const targets = page.locator('.hg-record-card-target');
  await expect(targets).toHaveCount(2);
  await expect(targets.nth(0)).toHaveAccessibleName('Rajesh Patil');
  await expect(targets.nth(1)).toHaveAccessibleName('Vikram Deshpande');
  // Vikram's own Deactivate, on a card that opens, runs its act and opens nothing.
  const vikram = page.locator('.hg-record-card', { hasText: 'Vikram Deshpande' });
  await vikram.getByRole('button', { name: teamActWords(en.t, COMPANY).act('deactivate') }).click();
  await expect(frame).toHaveAttribute('data-acted', 'Vikram Deshpande');
  await expect(frame).toHaveAttribute('data-opened', '');
  /* A tap on the role badges opens the person: the row of words lets it through to the card. */
  const badges = await settledBox(
    page.locator('.hg-record-card', { hasText: 'Rajesh Patil' }).locator('.hg-record-card-marks'),
  );
  await page.mouse.click(badges.x + 8, badges.y + 8);
  await expect(frame).toHaveAttribute('data-opened', 'Rajesh Patil');
});

test('each act is heard with its person, and still found by its visible words (D291, AC-28)', async ({
  mount,
  page,
}) => {
  const acts = teamActWords(en.t, COMPANY);
  await mount(<TeamListStory company={COMPANY} surface="rows" withActs />);
  const vikram = page.locator('.hg-record-card', { hasText: 'Vikram Deshpande' });
  await expect(vikram.getByRole('button', { name: acts.act('deactivate') })).toHaveAccessibleName(
    acts.spoken('deactivate', 'Vikram Deshpande'),
  );
  const invite = page.getByRole('button', { name: acts.act('revoke') }).first();
  await expect(invite).toHaveAccessibleName(/.+/u);
  const said = await invite.evaluate((node) => node.getAttribute('aria-label') ?? '');
  expect(said.startsWith(acts.act('revoke'))).toBe(true);
  expect(said.length).toBeGreaterThan(acts.act('revoke').length);
});
