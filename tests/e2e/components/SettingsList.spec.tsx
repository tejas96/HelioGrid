import { join } from 'node:path';
import { SETTINGS_GROUPS, SETTINGS_ROWS, settingsRowsFor } from '@heliogrid/domain';
import { createTranslator, settingsWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSidewaysScroll, expectNothingClipped, expectSharedEdge } from '../support/layout';
import { resolvedColour } from '../support/token';
import { expectTouchFloor } from '../support/touch-target';
import { SettingsListAsHeld } from './SettingsList.story';

/**
 * The settings list behind More at the board's two widths (`SCR-SHELL-01`, *More: the settings
 * list*): the owner's twelve rows in six groups in one column; at 1536 the `side` form a settings
 * page stands beside; the technician's one row; every row a 56-tall tile that reports which screen it
 * opens; in Hindi and Marathi every word the catalog's and nothing clipped. Each frame's picture
 * is saved beside the suite's results for the board comparison.
 */
const en = await createTranslator('en');
const WORDS = settingsWords(en.t);
const OWNER = settingsRowsFor(['epc_owner']);
const OWNER_ROWS = OWNER.flatMap((group) => group.rows);
/** The groups drawn as an overline heading: every one but the person's own, which is their tile. */
const HEADED = SETTINGS_GROUPS.filter((group) => group !== 'you');
const PERSON = 'Rajesh Patil';

/** The record's measured tile (list 5, N2). */
const ROW = 56;
/** In the repo's git-ignored `.qa/`, never in Playwright's output folder, which every run empties. */
const PICTURES = join(import.meta.dirname, '../../../.qa/components/settings-list');

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the owner meets the title, six groups and twelve rows in one column, each a tile', async ({
    mount,
    page,
  }) => {
    const list = await mount(<SettingsListAsHeld reader="en" held={['epc_owner']} />);
    await expect(list.getByRole('heading', { level: 1, name: WORDS.title })).toBeVisible();
    for (const group of HEADED)
      await expect(list.getByText(WORDS.groups[group], { exact: true })).toBeVisible();
    await expect(list.getByText(WORDS.groups.you, { exact: true })).toHaveCount(0);
    const person = list.locator('.hg-settings-person');
    await expect(person).toContainText(PERSON);
    await expect(person).toContainText(WORDS.rows.profile);
    expect((await person.boundingBox())?.height).toBeGreaterThanOrEqual(96);
    const rows = list.getByRole('button');
    await expect(rows).toHaveCount(OWNER_ROWS.length);
    await expect(list.locator('.hg-settings-row-name')).toHaveText(
      OWNER_ROWS.map((row) => WORDS.rows[row]),
    );
    const tiles = await list.locator('.hg-settings-tile').all();
    await expectSharedEdge([person, ...tiles], 'left');
    await expectSharedEdge([person, ...tiles], 'right');
    const all = await rows.all();
    for (const row of all.slice(1)) {
      const box = await row.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(ROW);
    }
    await expect(list.locator('.hg-settings-row-icon')).toHaveCount(OWNER_ROWS.length - 1);
    await expectTouchFloor(all);
    await expectNoSidewaysScroll(page);
    await page.screenshot({ path: `${PICTURES}/more-owner-375.png`, fullPage: true });
  });

  test('a field technician meets one group and one row', async ({ mount, page }) => {
    const list = await mount(<SettingsListAsHeld reader="en" held={['field_technician']} />);
    await expect(list.getByRole('button')).toHaveCount(1);
    await expect(list.locator('.hg-settings-person')).toContainText(PERSON);
    await expect(list.locator('.hg-settings-row-name')).toHaveText([WORDS.rows.profile]);
    await expect(list.locator('.hg-block')).toHaveCount(0);
    await expect(list.getByText(WORDS.groups.money, { exact: true })).toHaveCount(0);
    await page.screenshot({ path: `${PICTURES}/more-technician-375.png`, fullPage: true });
  });

  test('a name with no space to break at stays inside the tile at the web’s narrowed width', async ({
    mount,
  }) => {
    // 375 less the web's 72 rail and 2 × 16 page padding: the tile is 263 wide inside the shell.
    const list = await mount(
      <div style={{ width: 263 }}>
        <SettingsListAsHeld reader="en" held={['epc_owner']} name="Owner 9112345678" />
      </div>,
    );
    const name = list.locator('.hg-settings-person-words h3');
    const inkRight = await name.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect().right;
    });
    const box = await name.boundingBox();
    expect(inkRight).toBeLessThanOrEqual((box?.x ?? 0) + (box?.width ?? 0) + 1);
    await expect(name).toHaveText('Owner 9112345678');
  });

  test('a pressed row reports the screen it opens', async ({ mount }) => {
    const list = await mount(<SettingsListAsHeld reader="en" held={['epc_owner']} />);
    await list.getByRole('button', { name: WORDS.rows.payment_terms }).click();
    await expect(list).toHaveAttribute('data-opened', 'payment_terms');
  });

  test.describe('in Hindi and Marathi', () => {
    for (const reader of ['hi', 'mr'] as const) {
      test(`every word is the catalog's and nothing is clipped — ${reader}`, async ({
        mount,
        page,
      }) => {
        const words = settingsWords((await createTranslator(reader)).t);
        const list = await mount(<SettingsListAsHeld reader={reader} held={['epc_owner']} />);
        await expect(list.getByRole('heading', { level: 1, name: words.title })).toBeVisible();
        for (const group of HEADED)
          await expect(list.getByText(words.groups[group], { exact: true })).toBeVisible();
        await expect(list.locator('.hg-settings-row-name')).toHaveText(
          SETTINGS_ROWS.map((row) => words.rows[row]),
        );
        await expectNothingClipped(page, '.hg-settings-row-name');
        await expectNoSidewaysScroll(page);
      });
    }
  });
});

test.describe('the side form, beside a settings page at 1536', () => {
  test.use({ viewport: { width: 1536, height: 960 } });

  test('a 248 column named for the list: the person’s row first, each group an overline over its rows, the page in view marked', async ({
    mount,
    page,
  }) => {
    const list = await mount(
      <SettingsListAsHeld reader="en" held={['epc_owner']} form="side" current="company_profile" />,
    );
    const nav = list.getByRole('navigation', { name: WORDS.title });
    expect((await nav.boundingBox())?.width).toBe(248);
    const rows = nav.getByRole('button');
    await expect(rows).toHaveText(OWNER_ROWS.map((row) => WORDS.rows[row]));
    for (const group of HEADED)
      await expect(nav.getByText(WORDS.groups[group], { exact: true })).toBeVisible();
    await expect(nav.getByText(WORDS.groups.you, { exact: true })).toHaveCount(0);
    const here = nav.getByRole('button', { name: WORDS.rows.company_profile });
    await expect(here).toHaveAttribute('aria-current', 'page');
    await expect(here).toHaveCSS('background-color', await resolvedColour(page, '--accent-subtle'));
    await expect(nav.locator('[aria-current]')).toHaveCount(1);
    await expect(nav.locator('.hg-settings-person, .hg-settings-tile')).toHaveCount(0);
    await expectTouchFloor(await rows.all());
    await rows.nth(1).click();
    await expect(list).toHaveAttribute('data-opened', OWNER_ROWS[1] ?? '');
    await page.screenshot({ path: `${PICTURES}/side-owner-1536.png`, fullPage: true });
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`every word is the catalog's and nothing is clipped — ${reader}`, async ({
      mount,
      page,
    }) => {
      const words = settingsWords((await createTranslator(reader)).t);
      const list = await mount(
        <SettingsListAsHeld reader={reader} held={['epc_owner']} form="side" current="team" />,
      );
      const nav = list.getByRole('navigation', { name: words.title });
      await expect(nav.getByRole('button')).toHaveText(OWNER_ROWS.map((row) => words.rows[row]));
      await expectNothingClipped(page, '.hg-settings-side');
      await page.screenshot({ path: `${PICTURES}/side-owner-1536-${reader}.png`, fullPage: true });
    });
  }
});
