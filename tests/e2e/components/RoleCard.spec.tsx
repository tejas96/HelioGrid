import { join } from 'node:path';
import { type RoleCardNames, type RolePreset, roleCard } from '@heliogrid/domain';
import { createTranslator, PROFILE_PREFERENCES, roleCardWords, SHELL } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSidewaysScroll, expectNothingClipped } from '../support/layout';
import { animationsSettled } from '../support/motion';
import { resolvedColour } from '../support/token';
import { RoleCardAsHeld, RoleCardOpenedFromARow } from './RoleCard.story';

/**
 * The role card's reopened life (`SCR-M01-10`, `m-reopened` and `d-reopened`): a sheet titled
 * *Your role* at 375, the 480 right panel at 1536; the presets and who set them, what the person
 * can and cannot do, and who adds a teammate. While the owners read is out the head draws and the
 * rows wait as lines; a failed read is the error card. Each frame's picture is saved beside the
 * suite's results for the board comparison.
 */
const en = await createTranslator('en');
const BOARD: RoleCardNames = {
  companyName: 'Suryodaya Solar',
  setterName: 'Rajesh Kulkarni',
  owners: { names: ['Rajesh Kulkarni'], more: 0 },
};
const wordsFor = (roles: readonly RolePreset[], names: RoleCardNames = BOARD) =>
  roleCardWords(en.t, roleCard(roles), names);
const SALES = wordsFor(['sales_executive']);
const TEXT =
  '.hg-sheet-title, .hg-detail-panel-title, .hg-role-card-presets, .hg-role-card-credit, .hg-role-card-overline, .hg-role-card-phrase, .hg-scope-note';
const PICTURES = join(import.meta.dirname, '../../../.qa/components/role-card');

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('m-reopened: a sheet titled Your role, the board six and six, the owner note', async ({
    mount,
    page,
  }) => {
    await mount(<RoleCardAsHeld reader="en" names={BOARD} />);
    const sheet = page.getByRole('dialog', { name: SALES.surfaceTitle });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('button', { name: en.t(SHELL.close) })).toBeVisible();
    await expect(sheet.locator('.hg-role-card-presets')).toHaveText(SALES.presets);
    await expect(sheet.locator('.hg-role-card-credit')).toHaveText(SALES.credit ?? '');
    const sections = sheet.locator('.hg-role-card-section');
    await expect(sections.nth(0).locator('.hg-role-card-phrase')).toHaveText(
      SALES.grants.map((line) => line.text),
    );
    await expect(sections.nth(1).locator('.hg-role-card-phrase')).toHaveText(
      SALES.limits.map((line) => line.text),
    );
    await expect(sheet.getByRole('region', { name: SALES.region })).toHaveAttribute(
      'tabindex',
      '0',
    );
    await expect(sheet.getByRole('note')).toContainText(SALES.note?.title ?? '');
    await expect(sheet.locator('.hg-role-card-note')).toHaveCSS(
      'background-color',
      await resolvedColour(page, '--info-bg'),
    );
    await expect(sections.nth(0).locator('.hg-shell-glyph').first()).toHaveCSS(
      'color',
      await resolvedColour(page, '--success-text'),
    );
    await animationsSettled(page);
    await page.screenshot({ path: `${PICTURES}/m-reopened.png` });
  });

  test('m-loading: the head draws, the rows wait as lines in one busy region', async ({
    mount,
    page,
  }) => {
    await mount(<RoleCardAsHeld reader="en" names={BOARD} surface="loading" />);
    const sheet = page.getByRole('dialog');
    await expect(sheet.locator('.hg-role-card-presets')).toHaveText(SALES.presets);
    const waiting = sheet.getByRole('status', { name: SALES.loading });
    await expect(waiting).toHaveAttribute('aria-busy', 'true');
    await expect(waiting.getByRole('status')).toHaveCount(0);
    await expect(waiting.locator('.hg-loading-line')).toHaveCount(
      SALES.grants.length + SALES.limits.length + 3,
    );
    await expect(sheet.locator('.hg-role-card-phrase')).toHaveCount(0);
    await page.screenshot({ path: `${PICTURES}/m-loading.png` });
  });

  test('m-error: the error card names the setter, and Try again reloads', async ({
    mount,
    page,
  }) => {
    const card = await mount(<RoleCardAsHeld reader="en" names={BOARD} surface="error" />);
    const sheet = page.getByRole('dialog');
    await expect(sheet).toContainText(SALES.error.title);
    await expect(sheet).toContainText(SALES.error.body);
    await expect(sheet.locator('.hg-role-card-presets')).toHaveCount(0);
    await page.screenshot({ path: `${PICTURES}/m-error.png` });
    await sheet.getByRole('button', { name: SALES.error.retry }).click();
    await expect(card).toHaveAttribute('data-retried', 'true');
    await expect(sheet.locator('.hg-role-card-presets')).toBeFocused();
  });

  test('the close closes it', async ({ mount, page }) => {
    const card = await mount(<RoleCardAsHeld reader="en" names={BOARD} />);
    await page.getByRole('button', { name: en.t(SHELL.close) }).click();
    await expect(card).toHaveAttribute('data-closed', 'true');
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`in ${reader}, stacked presets: the head stays while the rows scroll to the note, nothing clips`, async ({
      mount,
      page,
    }) => {
      await mount(
        <RoleCardAsHeld
          reader={reader}
          roles={['sales_executive', 'design_engineer']}
          names={BOARD}
        />,
      );
      await animationsSettled(page);
      const sheet = page.getByRole('dialog');
      const region = sheet.getByRole('region');
      expect(await region.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
      const head = await sheet.locator('.hg-role-card-presets').boundingBox();
      await region.evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
      expect(await sheet.locator('.hg-role-card-presets').boundingBox()).toEqual(head);
      await expect(sheet.getByRole('note')).toBeInViewport();
      await region.evaluate((node) => node.scrollTo({ top: 0 }));
      await expectNothingClipped(page, TEXT);
      await expectNoSidewaysScroll(page);
      await page.screenshot({ path: `${PICTURES}/m-reopened-${reader}.png` });
    });
  }
});

test.describe('at 1536', () => {
  test.use({ viewport: { width: 1536, height: 1000 } });

  test('d-reopened: the 480 right panel, one column, the panel scrolls', async ({
    mount,
    page,
  }) => {
    await mount(<RoleCardAsHeld reader="en" names={BOARD} />);
    const panel = page.getByRole('dialog', { name: SALES.surfaceTitle });
    await animationsSettled(page);
    const box = await panel.boundingBox();
    expect(box?.width).toBe(480);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBe(1536);
    await expect(panel.getByRole('region')).toHaveCount(0);
    const [grants, limits] = await Promise.all(
      [0, 1].map((n) => panel.locator('.hg-role-card-section').nth(n).boundingBox()),
    );
    expect(limits?.y ?? 0).toBeGreaterThan((grants?.y ?? 0) + (grants?.height ?? 0));
    await page.screenshot({ path: `${PICTURES}/d-reopened.png` });
  });

  test('an Owner: no limits and no note; the founder: no credit line', async ({ mount, page }) => {
    const names = { ...BOARD, setterName: null };
    await mount(<RoleCardAsHeld reader="en" roles={['epc_owner']} names={names} />);
    const panel = page.getByRole('dialog');
    await expect(panel.locator('.hg-role-card-section')).toHaveCount(1);
    await expect(panel.getByRole('note')).toHaveCount(0);
    await expect(panel.locator('.hg-role-card-credit')).toHaveCount(0);
  });

  test('two and three owners read as the note names them', async ({ mount, page }) => {
    const names = { ...BOARD, owners: { names: ['Rajesh Kulkarni', 'Meera Shah'], more: 1 } };
    await mount(<RoleCardAsHeld reader="en" names={names} />);
    await expect(page.getByRole('note')).toContainText(
      wordsFor(['sales_executive'], names).note?.title ?? '',
    );
  });

  test('reduced motion stills the loading lines', async ({ mount, page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mount(<RoleCardAsHeld reader="en" names={BOARD} surface="loading" />);
    const bar = page.locator('.hg-loading-line-bar').first();
    const first = await bar.evaluate((node) => getComputedStyle(node).backgroundPosition);
    await page.waitForTimeout(300);
    expect(await bar.evaluate((node) => getComputedStyle(node).backgroundPosition)).toBe(first);
  });
});

test('focus stays where the person put it while the host draws again, and closing returns it to the row', async ({
  mount,
  page,
}) => {
  await mount(<RoleCardOpenedFromARow names={BOARD} />);
  const row = page.getByRole('button', { name: en.t(PROFILE_PREFERENCES.yourRole) });
  await row.click();
  const dialog = page.getByRole('dialog', { name: SALES.surfaceTitle });
  await expect(dialog).toBeVisible();
  await animationsSettled(page);
  const close = dialog.getByRole('button', { name: en.t(SHELL.close) });
  await close.focus();
  await page.waitForTimeout(200);
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(row).toBeFocused();
});
