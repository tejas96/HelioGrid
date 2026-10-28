import type { UiLanguage } from '@heliogrid/domain';
import {
  CATALOG_EDITOR,
  CATALOG_SETTINGS,
  catalogEditFailed,
  catalogItemsWords,
  catalogPriceEditorWords,
  catalogReleaseWords,
  catalogViewOnly,
  createTranslator,
  releaseChangeWord,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll, expectNothingClipped, settledBox } from '../support/layout';
import { animationsSettled } from '../support/motion';
import { MIN_TOUCH_TARGET } from '../support/touch-target';
import { PriceEditorAsRead, ReleaseAsRead } from './CatalogEditors.story';
import { CatalogItemsAsRead } from './CatalogItems.story';

/**
 * Catalog settings' Items panel (`SCR-M01-15`): the strip, the search and its kinds, and one
 * resolved list — the one-line table at 1536, the phone's cards at 375 — with each board frame,
 * the price editor's tiers and a release's before-and-after.
 */
const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};
const SCHEMES = ['ALMM', 'DCR'];
const ADANI = 'Adani Solar AS-7-545';
const GROWATT = 'Growatt MIN 5000TL-X';
const listWords = (
  reader: UiLanguage,
  facts: Partial<Parameters<typeof catalogItemsWords>[2]> = {},
) =>
  catalogItemsWords(READERS[reader].t, SCHEMES, {
    count: 342,
    matched: null,
    archived: false,
    fresh: false,
    preferredFirst: true,
    ...facts,
  });
const { t } = READERS.en;
const en = listWords('en');
const WIDTHS = [
  { width: 375, wide: false },
  { width: 1536, wide: true },
] as const;

const at = (page: Page, width: number) => page.setViewportSize({ width, height: 900 });

test('every items frame at 375 and 1536', async ({ mount, page }) => {
  for (const { width, wide } of WIDTHS) {
    await at(page, width);

    /* normal: every row, the release strip, the pager or the summary, the archived caption. */
    let frame = await mount(<CatalogItemsAsRead reader="en" frame="normal" />);
    await expect(page.getByText(ADANI, { exact: true })).toBeVisible();
    await expect(page.getByText('r2026-08')).toBeVisible();
    await expect(page.getByRole('button', { name: t(CATALOG_SETTINGS.publish) })).toBeVisible();
    await expect(page.getByText(t(CATALOG_SETTINGS.archivedCaption, { count: 23 }))).toBeVisible();
    if (wide) {
      await expect(page.getByText(en.compliance, { exact: true })).toBeVisible();
      await expect(page.getByText(en.pageRange(1, 20, 342))).toBeVisible();
      await expect(page.getByText(en.summary)).toHaveCount(0);
      const star = page.getByRole('button', {
        name: t(CATALOG_SETTINGS.stopPreferringNamed, { name: ADANI }),
      });
      const box = await settledBox(star);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      await page.getByRole('button', { name: en.sortNamed(en.sorts.preferred) }).click();
      await expect(page.getByRole('menuitemradio', { name: en.sorts.price })).toBeVisible();
      await page.keyboard.press('Escape');
    } else {
      await expect(page.getByText(en.summary)).toBeVisible();
      await expect(
        page.getByRole('button', {
          name: t(CATALOG_SETTINGS.stopPreferringNamed, { name: ADANI }),
        }),
      ).toBeVisible();
    }
    /* The row opens by its whole sentence — a real button for the keyboard in both forms. */
    await page.getByRole('button', { name: new RegExp(`^${ADANI},`) }).focus();
    await page.keyboard.press('Enter');
    await expect(frame).toHaveAttribute('data-opened', 'adani');
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);

    /* hidden-from-pickers: the mark in words, and the act that un-hides it, pressed. */
    await expect(page.getByText(en.hiddenFromPickers)).toBeVisible();
    /* Both forms speak the act with the item's name; the pill is also a pressed toggle. */
    const show = page.getByRole('button', {
      name: t(CATALOG_SETTINGS.showNamed, { name: GROWATT }),
    });
    if (!wide) await expect(show).toHaveAttribute('aria-pressed', 'true');
    await show.click();
    await expect(frame).toHaveAttribute('data-acted', 'hide:growatt');
    await frame.unmount();

    /* search-filtered: the summary counts the matches at 375; 1536 draws none. */
    frame = await mount(<CatalogItemsAsRead reader="en" frame="search" />);
    const matched = listWords('en', { matched: 1 });
    await expect(page.getByRole('searchbox', { name: en.searchLabel })).toHaveValue('545');
    await expect(page.getByText(matched.summary)).toHaveCount(wide ? 0 : 1);
    await frame.unmount();

    /* archived-filter: muted rows, one act — Restore. */
    frame = await mount(<CatalogItemsAsRead reader="en" frame="archived" />);
    await expect(page.locator('[data-muted="true"]').first()).toBeVisible();
    await page.getByRole('button', { name: en.restore }).click();
    await expect(frame).toHaveAttribute('data-acted', 'restore:rs335');
    await expect(page.locator('.hg-cat-acts, .hg-tile-actions')).toHaveCount(0);
    await frame.unmount();

    /* no manage grant: one view-only line, no Publish, no row act, no row click. */
    frame = await mount(<CatalogItemsAsRead reader="en" frame="view-only" />);
    await expect(page.getByText(catalogViewOnly(t, ['Rajesh']))).toBeVisible();
    await expect(page.getByRole('button', { name: t(CATALOG_SETTINGS.publish) })).toHaveCount(0);
    await expect(page.locator('.hg-cat-acts, .hg-tile-actions')).toHaveCount(0);
    await expect(page.getByRole('button', { name: new RegExp(`^${ADANI},`) })).toHaveCount(0);
    await frame.unmount();

    /* empty-teaching: the card above a full list. */
    frame = await mount(<CatalogItemsAsRead reader="en" frame="teaching" />);
    await expect(page.getByText(en.makeItYours)).toBeVisible();
    await expect(page.getByText(t(CATALOG_SETTINGS.teaching, { count: 339 }))).toBeVisible();
    await expect(page.getByText(t(CATALOG_SETTINGS.noRelease))).toBeVisible();
    await frame.unmount();

    /* loading keeps every fixed word: the search box and its filters stay live. */
    frame = await mount(<CatalogItemsAsRead reader="en" frame="loading" />);
    await expect(page.getByPlaceholder(en.search)).toBeVisible();
    await expect(page.getByRole('status', { name: en.loadingRelease })).toBeVisible();
    await expect(page.getByRole('status', { name: en.loadingKinds })).toBeVisible();
    await expect(page.getByRole('status', { name: en.loadingList, exact: true })).toBeVisible();
    await expect(page.getByText(ADANI)).toHaveCount(0);
    await frame.unmount();

    /* load error: the page says nothing changed and offers Try again — nothing else is drawn. */
    frame = await mount(<CatalogItemsAsRead reader="en" frame="error" />);
    await expect(page.getByText(en.loadFailed)).toBeVisible();
    await expect(page.getByText(en.loadFailedBody)).toBeVisible();
    await expect(page.getByPlaceholder(en.search)).toHaveCount(0);
    await page.getByRole('button', { name: en.tryAgain }).click();
    await expect(frame).toHaveAttribute('data-retried', 'true');
    await frame.unmount();

    /* a failed row edit: what did not save and what is still true, with Retry in place. */
    frame = await mount(<CatalogItemsAsRead reader="en" frame="edit-failed" />);
    await expect(page.getByText(catalogEditFailed(t, 'shown'))).toBeVisible();
    await page.getByRole('button', { name: en.tryAgain }).click();
    await expect(frame).toHaveAttribute('data-acted', 'retry');
    await expect(page.getByText(GROWATT, { exact: true })).toBeVisible();
    await frame.unmount();
  }
});

test('Hindi and Marathi at 375 and 1536', async ({ mount, page }) => {
  for (const reader of ['hi', 'mr'] as const) {
    const words = listWords(reader);
    for (const { width } of WIDTHS) {
      await at(page, width);
      const frame = await mount(<CatalogItemsAsRead reader={reader} frame="normal" />);
      await expect(page.getByText(ADANI, { exact: true })).toBeVisible();
      await expect(page.getByText(words.hiddenFromPickers)).toBeVisible();
      await expect(page.getByPlaceholder(words.search)).toBeVisible();
      await expectNoSidewaysScroll(page);
      await expectNothingClipped(page, '.hg-button, .hg-tile-action-pill, .hg-cat-strip-words');
      await frame.unmount();
    }
  }
});

test('reduced motion shows the end state', async ({ mount, page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const { width } of WIDTHS) {
    await at(page, width);
    const frame = await mount(<CatalogItemsAsRead reader="en" frame="normal" />);
    await page.getByRole('button', { name: en.filters }).first().click();
    await animationsSettled(page);
    const panel = page.getByRole('dialog');
    await expect(panel).toBeInViewport();
    await expect(panel.getByText(en.filterPanel.source)).toBeVisible();
    await frame.unmount();
  }
});

test('draws Add an item only when it is offered', async ({ mount, page }) => {
  for (const { width, wide } of WIDTHS) {
    await at(page, width);
    let frame = await mount(<CatalogItemsAsRead reader="en" frame="normal" />);
    const add = page.getByRole('button', { name: en.addItem });
    const importing = page.getByRole('button', { name: en.importFile });
    await expect(add).toBeVisible();
    const [addBox, importBox] = [await settledBox(add), await settledBox(importing)];
    /* 1536 heads the controls: the import, then the add; 375 closes the list: the add first. */
    if (wide) expect(addBox?.x ?? 0).toBeGreaterThan(importBox?.x ?? 0);
    else expect(addBox?.x ?? 0).toBeLessThan(importBox?.x ?? 0);
    expect(addBox?.height ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    await add.click();
    await expect(page.locator('[data-acted="add"]')).toHaveCount(1);
    await frame.unmount();
    frame = await mount(<CatalogItemsAsRead reader="en" frame="view-only" />);
    await expect(page.getByText(ADANI, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: en.addItem })).toHaveCount(0);
    await frame.unmount();
  }
});

test('tints the added row at both widths', async ({ mount, page }) => {
  for (const { width } of WIDTHS) {
    await at(page, width);
    const frame = await mount(<CatalogItemsAsRead reader="en" frame="added" />);
    const tinted = page.locator('[data-highlighted="true"]');
    await expect(tinted.first()).toContainText('Rayzon Solar RS-550');
    await expect(tinted.filter({ hasText: ADANI })).toHaveCount(0);
    const [added, other] = await Promise.all([
      tinted.first().evaluate((node) => getComputedStyle(node).backgroundColor),
      page
        .locator('.hg-dt-row, .hg-dt-card')
        .filter({ hasText: GROWATT })
        .first()
        .evaluate((node) => getComputedStyle(node).backgroundColor),
    ]);
    expect(added).not.toBe(other);
    await frame.unmount();
  }
});

test('a pack with no schemes draws no compliance column', async ({ mount, page }) => {
  for (const { width } of WIDTHS) {
    await at(page, width);
    const frame = await mount(<CatalogItemsAsRead reader="en" frame="no-schemes" />);
    const words = catalogItemsWords(t, [], {
      count: 339,
      matched: null,
      archived: false,
      fresh: true,
      preferredFirst: true,
    });
    await expect(page.getByText(ADANI, { exact: true })).toBeVisible();
    await expect(page.getByText(en.compliance, { exact: true })).toHaveCount(0);
    await expect(page.getByText('ALMM', { exact: true })).toHaveCount(0);
    await expect(page.getByText(en.noSchemeFlag)).toHaveCount(0);
    await page.getByRole('button', { name: words.filters }).first().click();
    await expect(page.getByRole('dialog').getByText(words.filterPanel.scheme)).toHaveCount(0);
    await frame.unmount();
  }
});

test('the price editor names each tier', async ({ mount, page }) => {
  const words = catalogPriceEditorWords(t, '5%');
  for (const { width } of WIDTHS) {
    await at(page, width);
    const frame = await mount(<PriceEditorAsRead reader="en" />);
    await expect(page.getByText(t(CATALOG_EDITOR.platformItem))).toBeVisible();
    await expect(page.getByText(words.yourOverride)).toBeVisible();
    await expect(page.getByText(words.defaultSource)).toHaveCount(2);
    await expect(page.getByText(words.edited)).toBeVisible();
    await expect(page.getByText(words.taxStays ?? '')).toBeVisible();
    await expect(page.getByText(words.priceHint)).toBeVisible();
    /* The switch's input is the accessible node; its drawn track takes the press. */
    await page.getByRole('switch', { name: words.hideFromPickers }).locator('..').click();
    await expect(frame).toHaveAttribute('data-hidden', 'true');
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
