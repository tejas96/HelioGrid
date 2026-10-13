import { SETTINGS_GROUPS, SETTINGS_ROWS, settingsRowsFor } from '@heliogrid/domain';
import { createTranslator, settingsWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSidewaysScroll, expectNothingClipped, expectSharedEdge } from '../support/layout';
import { resolvedLength } from '../support/token';
import { expectTouchFloor } from '../support/touch-target';
import { SettingsListAsHeld } from './SettingsList.story';

/**
 * The settings list behind More at the board's two widths (`SCR-SHELL-01`, *More: the settings
 * list*): the owner's twelve rows in six groups, one column at 375 and three columns of whole
 * groups at 1536; the technician's one row; every row a 56-tall tile that reports which screen it
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
const PICTURES = 'test-results-ct/settings-list';

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

test.describe('at 1536', () => {
  test.use({ viewport: { width: 1536, height: 960 } });

  test('the groups sit in three columns of whole groups, the same rows at the same height', async ({
    mount,
    page,
  }) => {
    const list = await mount(<SettingsListAsHeld reader="en" held={['epc_owner']} />);
    const columns = list.locator('.hg-settings-column');
    await expect(columns).toHaveCount(3);
    const groupsIn = (n: number) => columns.nth(n).locator('.hg-block');
    await expect(columns.nth(0).locator('.hg-settings-person')).toHaveCount(1);
    await expect(groupsIn(0)).toHaveCount(1);
    await expect(groupsIn(1)).toHaveCount(3);
    await expect(groupsIn(2)).toHaveCount(1);
    const you = columns.nth(0).locator('.hg-settings-person');
    const [team] = await groupsIn(0).all();
    const [company] = await groupsIn(1).all();
    const [money] = await groupsIn(2).all();
    if (!team || !company || !money) throw new Error('a column has no group');
    await expectSharedEdge([you, team], 'left');
    // The second group stands right under the first: one section gap, never a row track's height.
    const gap = await resolvedLength(page, '--sp-6');
    const youBox = await you.boundingBox();
    const teamBox = await team.boundingBox();
    expect(teamBox?.y).toBeLessThanOrEqual((youBox?.y ?? 0) + (youBox?.height ?? 0) + gap + 1);
    const left = await you.boundingBox();
    const middle = await company.boundingBox();
    const right = await money.boundingBox();
    expect((left?.x ?? 0) + (left?.width ?? 0)).toBeLessThan(middle?.x ?? 0);
    expect((middle?.x ?? 0) + (middle?.width ?? 0)).toBeLessThan(right?.x ?? 0);
    const rows = await list.getByRole('button').all();
    expect(rows).toHaveLength(OWNER_ROWS.length);
    for (const row of rows.slice(1)) {
      const box = await row.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(ROW);
    }
    await expectNoSidewaysScroll(page);
    await page.screenshot({ path: `${PICTURES}/more-owner-1536.png`, fullPage: true });
  });
});
