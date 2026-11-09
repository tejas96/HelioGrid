import {
  CATALOG_EDITOR,
  catalogPriceEditorWords,
  catalogReleaseWords,
  createTranslator,
  releaseChangeWord,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import { expectNoSidewaysScroll } from '../support/layout';
import { PriceEditorAsRead, ReleaseAsRead } from './CatalogEditors.story';

/**
 * The Items panel's two sheets (`SCR-M01-15`): the price editor — no tier line under a field or a
 * toggle (owner ruling), and *Prefer* and *Hide* as its toggles (direction A), where the phone's
 * rows hold none — and a release's before-and-after.
 */
const { t } = await createTranslator('en');
const WIDTHS = [{ width: 375 }, { width: 1536 }] as const;
const at = (page: Page, width: number) => page.setViewportSize({ width, height: 900 });

test('the price editor names no tier', async ({ mount, page }) => {
  const words = catalogPriceEditorWords(t, '5%');
  for (const { width } of WIDTHS) {
    await at(page, width);
    const frame = await mount(<PriceEditorAsRead reader="en" />);
    await expect(page.getByText(t(CATALOG_EDITOR.platformItem))).toBeVisible();
    /* No tier line in the sheet (owner ruling): *Default* under a button and *Your override* under
       a price told an owner nothing; the button's own look says on or off. */
    await expect(page.getByText(t(CATALOG_EDITOR.defaultSource), { exact: true })).toHaveCount(0);
    await expect(page.getByText(t(CATALOG_EDITOR.yourOverride), { exact: true })).toHaveCount(0);
    await expect(page.getByText(words.edited)).toBeVisible();
    await expect(page.getByText(words.taxStays ?? '')).toBeVisible();
    await expect(page.getByText(words.priceHint)).toBeVisible();
    /* *Prefer* and *Hide* are the sheet's two glass toggles (direction A), each spoken whole and
       pressed while on: the list's narrow rows carry none, so this is where an item is hidden. */
    const hide = page.getByRole('button', { name: words.hideFromPickers });
    await expect(hide).toHaveAttribute('aria-pressed', 'false');
    await hide.click();
    await expect(frame).toHaveAttribute('data-hidden', 'true');
    await expect(hide).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: words.preferredInPickers })).toBeVisible();
    await expectNoSidewaysScroll(page);
    await frame.unmount();
  }
});

test("a release's before-and-after", async ({ mount, page }) => {
  const words = catalogReleaseWords(t);
  for (const { width } of WIDTHS) {
    await at(page, width);
    let frame = await mount(<ReleaseAsRead reader="en" mode="publish" />);
    await expect(page.getByRole('textbox', { name: words.releaseName })).toHaveValue(
      'September price update',
    );
    await expect(page.getByText(releaseChangeWord(t, 'added'), { exact: true })).toBeVisible();
    await expect(page.getByText(releaseChangeWord(t, 'archived'), { exact: true })).toHaveCount(0);
    /* A price given for the first time is an addition, with no before. */
    await expect(page.getByText(words.newValue, { exact: true })).toHaveCount(2);
    await expect(page.getByText(t(CATALOG_EDITOR.no), { exact: true })).toBeVisible();
    await frame.unmount();

    frame = await mount(<ReleaseAsRead reader="en" mode="contents" />);
    await expect(page.getByText(words.inForce)).toBeVisible();
    await expect(page.getByText(words.earlier)).toBeVisible();
    await page.getByRole('button', { name: /r2026-06/ }).click();
    await expect(frame).toHaveAttribute('data-opened', 'r6');
    await expectNoSidewaysScroll(page);
    await frame.unmount();
  }
});
