import {
  type AssignRolesRefusal,
  formatPhone,
  IN_PACK,
  ROLE_PRESETS,
  type RolePreset,
  type UiLanguage,
} from '@heliogrid/domain';
import { assignRolesRefusalWords, assignRolesWords, createTranslator } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import { expectNoSidewaysScroll, expectNothingClipped, settledBox } from '../support/layout';
import { resolvedColour, resolvedLength } from '../support/token';
import { AssignRolesAsHeld } from './AssignRoles.story';

/**
 * Assign Roles' waits and answers (`SCR-M01-13`, `T-M01-013b`): the rows' own skeleton under the
 * head the row carried (`m-loading`, `d-loading`), and a save that did not land — the banner over
 * the grant card in the catalog's words, the ticks kept, *Save roles* the retry (`m-error`). An
 * unconfirmed save names no failure: it may have landed (`F8-36`).
 */
const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};
const [, , , SURVEY, DESIGN, , , INSTALL, , FINANCE] = ROLE_PRESETS;
const VIKRAM: readonly RolePreset[] = [SURVEY, DESIGN, INSTALL];

const en = assignRolesWords(READERS.en.t, {
  firstName: 'Vikram',
  companyName: 'Suryodaya Solar',
  locks: {},
});
const refusalIn = (reader: UiLanguage, refusal: AssignRolesRefusal) =>
  assignRolesRefusalWords(READERS[reader].t, refusal, {
    firstName: 'Vikram',
    companyName: 'Suryodaya Solar',
  });
const rowOf = (page: Page, preset: RolePreset) =>
  page.getByRole('checkbox', { name: en.rows[ROLE_PRESETS.indexOf(preset)]?.title ?? '' });

for (const [width, height, form] of [
  [375, 812, 'sheet'],
  [1536, 960, 'panel'],
] as const) {
  test.describe(`at ${width}`, () => {
    test.use({ viewport: { width, height } });

    test(`loading: the head stays, nine option bars, no card and no Save (${form})`, async ({
      mount,
      page,
    }) => {
      await mount(<AssignRolesAsHeld reader="en" held={VIKRAM} loading />);
      const editor = page.getByRole('dialog', { name: 'Vikram Deshpande', exact: true });
      await expect(editor.getByText(formatPhone(IN_PACK.formats, '+919876543210'))).toBeVisible();
      await expect(editor.getByText(en.presets, { exact: true })).toBeVisible();
      await expect(editor.getByRole('status', { name: en.loading })).toBeVisible();
      const bars = editor.locator('.hg-loading-option');
      await expect(bars).toHaveCount(9);
      await expect(bars.first()).toHaveCSS(
        'background-color',
        await resolvedColour(page, '--fill'),
      );
      await expect(bars.first()).toHaveCSS(
        'border-top-left-radius',
        `${await resolvedLength(page, '--r-tile')}px`,
      );
      // The sheet's description wraps to two lines; the wide panel's fits one (`d-loading`).
      await expect(bars.first().locator('.hg-loading-option-line:visible')).toHaveCount(
        form === 'panel' ? 1 : 2,
      );
      const title = await settledBox(bars.first().locator('.hg-loading-option-title > span'));
      const text = await settledBox(bars.first().locator('.hg-loading-option-text'));
      expect(Math.round(((title?.width ?? 0) / (text?.width ?? 1)) * 100)).toBe(
        form === 'panel' ? 35 : 45,
      );
      await expect(editor.getByRole('button', { name: en.save })).toHaveCount(0);
      await expect(editor.getByRole('region', { name: en.gives })).toHaveCount(0);
      await expect(editor.getByRole('checkbox')).toHaveCount(0);
    });

    test(`loading with reduced motion: the bars hold still (${form})`, async ({ mount, page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await mount(<AssignRolesAsHeld reader="en" held={VIKRAM} loading />);
      const mark = page.locator('.hg-loading-option-mark').first();
      const at = () => mark.evaluate((node) => getComputedStyle(node).backgroundPosition);
      const first = await at();
      await page.waitForTimeout(300);
      expect(await at()).toBe(first);
      expect(first).toBe('0px 0px');
    });

    test(`error: a failed save keeps the ticks, the banner says so over the card, Save retries (${form})`, async ({
      mount,
      page,
    }) => {
      const picked = [...VIKRAM, FINANCE];
      const frame = await mount(
        <AssignRolesAsHeld reader="en" held={VIKRAM} refusal={{ kind: 'failed' }} />,
      );
      await rowOf(page, FINANCE).click();
      const words = refusalIn('en', { kind: 'failed' });
      const banner = page.locator('.hg-banner');
      await expect(banner.locator('.hg-banner-title')).toHaveText(words.title ?? '');
      await expect(banner.locator('.hg-banner-body')).toHaveText(words.body);
      const bannerBox = await settledBox(banner);
      const cardBox = await settledBox(page.getByRole('region', { name: en.gives }));
      expect((bannerBox?.y ?? 0) + (bannerBox?.height ?? 0)).toBeLessThanOrEqual(cardBox?.y ?? 0);
      await expect(rowOf(page, FINANCE)).toHaveAttribute('aria-checked', 'true');
      await page.getByRole('button', { name: en.save }).click();
      await expect(frame).toHaveAttribute('data-saved', picked.join(','));
      await expectNoSidewaysScroll(page);
    });

    for (const refusal of [
      { kind: 'gone' },
      { kind: 'last-owner' },
      { kind: 'own-admin' },
    ] as const) {
      test(`${refusal.kind}: the banner says why in the catalog's words (${form})`, async ({
        mount,
        page,
      }) => {
        await mount(<AssignRolesAsHeld reader="en" held={VIKRAM} refusal={refusal} />);
        const words = refusalIn('en', refusal);
        await expect(page.locator('.hg-banner-title')).toHaveText(words.title ?? '');
        await expect(page.locator('.hg-banner-body')).toHaveText(words.body);
      });
    }

    test(`unconfirmed: no answer and no re-read, so the banner has no title and asks to check (${form})`, async ({
      mount,
      page,
    }) => {
      const refusal: AssignRolesRefusal = { kind: 'unconfirmed', failure: 'no_connection' };
      await mount(<AssignRolesAsHeld reader="en" held={VIKRAM} refusal={refusal} />);
      await expect(page.locator('.hg-banner-title')).toHaveCount(0);
      await expect(page.locator('.hg-banner-body')).toHaveText(refusalIn('en', refusal).body);
    });

    for (const reader of ['hi', 'mr'] as const) {
      test(`error (${reader}): the banner and the card fit`, async ({ mount, page }) => {
        await mount(
          <AssignRolesAsHeld reader={reader} held={VIKRAM} refusal={{ kind: 'failed' }} />,
        );
        const words = refusalIn(reader, { kind: 'failed' });
        await expect(page.locator('.hg-banner-title')).toHaveText(words.title ?? '');
        await expectNoSidewaysScroll(page);
        await expectNothingClipped(
          page,
          '.hg-banner-title, .hg-banner-body, .hg-grant-card-sentence',
        );
      });

      test(`loading (${reader}): the bar is the same shape in every language`, async ({
        mount,
        page,
      }) => {
        await mount(<AssignRolesAsHeld reader={reader} held={VIKRAM} loading />);
        await expect(page.locator('.hg-loading-option')).toHaveCount(9);
        await expectNoSidewaysScroll(page);
      });
    }
  });
}
