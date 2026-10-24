import type { UiLanguage } from '@heliogrid/domain';
import {
  catalogAttributionWords,
  catalogRatesWords,
  catalogVersionWords,
  createTranslator,
  LANGUAGE_META,
  PRICE_BOOK,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll, expectNothingClipped } from '../support/layout';
import {
  CatalogAttributionAsRead,
  CatalogRateEditAsRead,
  CatalogRatesAsRead,
  CatalogVersionAsRead,
} from './CatalogRates.story';

/**
 * Catalog settings' Rates panel (`SCR-M01-15`, `M01-48`): the price book in force, grouped by how
 * each rate is charged at 375 and one searchable table at 1536; the versions by year, a past one
 * read-only, and the new one with its per-language names (`F3-10`).
 */
const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};
const { t } = READERS.en;
const rates = (reader: UiLanguage) => catalogRatesWords(READERS[reader].t);
const versions = (reader: UiLanguage) => catalogVersionWords(READERS[reader].t);
const en = rates('en');
const ENGINEERING = 'Engineering and drawings';
const SURVEY = 'Site survey visit';
const WIDTHS = [
  { width: 375, wide: false },
  { width: 1536, wide: true },
] as const;

const at = (page: Page, width: number) => page.setViewportSize({ width, height: 900 });

test('every rates frame at 375 and 1536', async ({ mount, page }) => {
  for (const { width, wide } of WIDTHS) {
    await at(page, width);
    /* A chip's fill fades on press; the contrast check reads the settled frame, not the fade. */
    await page.emulateMedia({ reducedMotion: 'reduce' });

    /* The version in force: groups at 375, one table at 1536 with its search and charge chips. */
    let frame = await mount(<CatalogRatesAsRead reader="en" frame="rates" />);
    await expect(page.getByText(t(PRICE_BOOK.version, { number: 7 }))).toBeVisible();
    await expect(page.getByText(ENGINEERING, { exact: true })).toBeVisible();
    if (wide) {
      await expect(page.getByText(en.charged, { exact: true })).toBeVisible();
      await page.getByRole('searchbox', { name: en.searchRates }).fill('survey');
      await expect(page.getByText(SURVEY, { exact: true })).toBeVisible();
      await expect(page.getByText(ENGINEERING, { exact: true })).toHaveCount(0);
      await page.getByRole('searchbox', { name: en.searchRates }).fill('');
      await page.getByRole('button', { name: en.bases.per_kw, exact: true }).click();
      await expect(page.getByText(SURVEY, { exact: true })).toHaveCount(0);
      await expect(page.getByText('Elevated structure surcharge', { exact: true })).toBeVisible();
    } else {
      await expect(page.getByRole('region', { name: en.bases.per_job })).toBeVisible();
      await expect(page.getByRole('region', { name: en.bases.per_metre })).toBeVisible();
      await expect(page.getByRole('searchbox', { name: en.searchRates })).toHaveCount(0);
    }
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);
    await frame.unmount();

    /* Before the first version: the empty teaching and its first act. */
    frame = await mount(<CatalogRatesAsRead reader="en" frame="empty" />);
    await expect(page.getByText(en.noRates)).toBeVisible();
    await expect(page.getByText(en.noRatesBody)).toBeVisible();
    await page.getByRole('button', { name: en.addFirstRate }).click();
    await expect(frame).toHaveAttribute('data-added', 'true');
    await frame.unmount();

    frame = await mount(<CatalogRatesAsRead reader="en" frame="loading" />);
    await expect(page.getByRole('status', { name: en.loading })).toBeVisible();
    await frame.unmount();

    frame = await mount(<CatalogRatesAsRead reader="en" frame="error" />);
    await expect(page.getByText(en.loadFailed)).toBeVisible();
    await expect(page.getByRole('button', { name: en.tryAgain })).toBeVisible();
    await frame.unmount();

    /* The versions by year: the one in force says so in words, a past one shows its margin. */
    const words = versions('en');
    frame = await mount(<CatalogVersionAsRead reader="en" mode="list" />);
    await expect(page.getByText('2025', { exact: true })).toBeVisible();
    await expect(page.getByText(words.inForce)).toHaveCount(1);
    await expect(page.getByText('16.5%', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Default margin raised/ }).click();
    await expect(frame).toHaveAttribute('data-opened', 'v5');
    await frame.unmount();

    /* A past version: never greyed; its margin and count as tiles. *Read-only* is said once, by
       the surface's head that holds this body — never twice. */
    frame = await mount(<CatalogVersionAsRead reader="en" mode="read" />);
    await expect(page.getByText(words.readOnly)).toHaveCount(0);
    await expect(page.getByText(words.defaultMargin, { exact: true })).toBeVisible();
    await expect(page.getByText('11', { exact: true })).toBeVisible();
    await expect(page.getByText(ENGINEERING, { exact: true })).toHaveCSS('opacity', '1');
    await frame.unmount();

    /* The new version: margin, note, Add a rate, and the board's list (P48 holds its shape). */
    frame = await mount(<CatalogVersionAsRead reader="en" mode="edit" />);
    await expect(page.getByRole('textbox', { name: words.defaultMargin })).toBeVisible();
    await expect(page.getByLabel(words.whatChanged)).toBeVisible();
    await expect(page.getByText(words.changed, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: words.addRate })).toBeVisible();
    await expectNoSidewaysScroll(page);
    await frame.unmount();
  }
});

test('Hindi and Marathi at 375 and 1536', async ({ mount, page }) => {
  for (const reader of ['hi', 'mr'] as const) {
    const words = rates(reader);
    for (const { width } of WIDTHS) {
      await at(page, width);
      let frame = await mount(<CatalogRatesAsRead reader={reader} frame="rates" />);
      await expect(page.getByText(words.bases.per_job).first()).toBeVisible();
      await expectNoSidewaysScroll(page);
      await expectNothingClipped(page, '.hg-button, .hg-cat-strip-words');
      await frame.unmount();

      frame = await mount(<CatalogVersionAsRead reader={reader} mode="edit" />);
      await expect(page.getByText(versions(reader).addRate)).toBeVisible();
      await expectNoSidewaysScroll(page);
      await expectNothingClipped(page, '.hg-button');
      await frame.unmount();
    }
  }
});

test('the rate sheet names a missing language', async ({ mount, page }) => {
  for (const { width } of WIDTHS) {
    await at(page, width);
    const frame = await mount(<CatalogRateEditAsRead reader="en" />);
    const hindi = LANGUAGE_META.hi.endonym;
    await expect(page.getByText(t(PRICE_BOOK.missingName, { language: hindi }))).toBeVisible();
    /* The English name stands in as the placeholder while the Hindi one is empty. */
    const name = page.getByRole('textbox', { name: t(PRICE_BOOK.rateNameIn, { language: hindi }) });
    await expect(name).toHaveValue('');
    await expect(name).toHaveAttribute('placeholder', ENGINEERING);
    /* Written in Hindi, Hindi is no longer missing. */
    await name.fill('इंजीनियरिंग और ड्रॉइंग');
    await expect(page.getByText(t(PRICE_BOOK.missingName, { language: hindi }))).toHaveCount(0);
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);
    await frame.unmount();
  }
});

test("the version editor is the board's list at 375 and 1536", async ({ mount, page }) => {
  const words = versions('en');
  for (const { width } of WIDTHS) {
    await at(page, width);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const frame = await mount(<CatalogVersionAsRead reader="en" mode="edit" />);
    /* Grouped by how each rate is charged, as s-version-new and d-version-new draw it. */
    for (const basis of ['per_job', 'per_kw', 'per_visit', 'per_metre'] as const) {
      await expect(page.getByRole('region', { name: words.bases[basis] })).toBeVisible();
    }
    /* A name is words that open the rate sheet, never a field; one money box per rate. */
    await expect(page.getByRole('textbox', { name: /^Rate name/u })).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: /^Amount, /u })).toHaveCount(11);
    await expect(page.getByRole('combobox')).toHaveCount(0);
    /* The moved amount is struck beside Changed; an unmoved one carries neither. */
    await expect(page.locator('.hg-cat-version-struck')).toHaveCount(1);
    await page.getByRole('button', { name: ENGINEERING, exact: true }).click();
    await expect(frame).toHaveAttribute('data-opened', 'engineering');
    await page.getByRole('button', { name: words.addRate }).click();
    await expect(frame).toHaveAttribute('data-opened', 'new');
    await expectNoSidewaysScroll(page);
    await expectNothingClipped(page, '.hg-button');
    await expectNoSeriousViolations(page);
    await frame.unmount();
  }
});

test('the attribution table at 375', async ({ mount, page }) => {
  await at(page, 375);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const reader of ['en', 'hi'] as const) {
    const { t: say } = READERS[reader];
    const words = catalogAttributionWords(say, { changed: 6, total: 342 }, String);
    const frame = await mount(<CatalogAttributionAsRead reader={reader} />);
    await expect(page.getByText(words.caption)).toBeVisible();
    await expect(page.getByText('Adani Solar AS-7-545', { exact: true })).toBeVisible();
    /* The gaps are named, never blank: no price, and no market tax rate. */
    await expect(page.getByText(words.noPrice).first()).toBeVisible();
    await expect(page.getByText(words.noMarketRate).first()).toBeVisible();
    await expect(page.getByText(words.yourOverride).first()).toBeVisible();
    await expectNoSidewaysScroll(page);
    await expectNothingClipped(page, '.hg-button');
    await expectNoSeriousViolations(page);
    await page.getByRole('button', { name: words.more }).click();
    await expect(frame).toHaveAttribute('data-more', 'true');
    await frame.unmount();
  }
});
