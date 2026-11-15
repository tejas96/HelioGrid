import { createTranslator, proposalReaderWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { SNAPSHOT } from '../support/proposal-document-sample';
import { pageWordsOf } from '../support/proposal-document-words';
import { expectTouchFloor } from '../support/touch-target';
import { ReaderAsDrawn } from './ProposalAfterShipped.story';

/**
 * The document read in the app (`SCR-M06-17`, `M06-50`): every page of the version, the pill that
 * says which page is in view, and the acts — a dock on a phone, a row and the thumbnails at width.
 */
const en = await createTranslator('en');
const words = proposalReaderWords(en.t, 'Anil', 'residential');
const titles = pageWordsOf(en.t, SNAPSHOT).titles;
const pages = SNAPSHOT.pages;
const [first, , third] = pages;

test('at 375 the pages run one under the other, the pill names the first, and the dock acts', async ({
  mount,
  page,
}) => {
  if (first === undefined) throw new Error('the sample prints pages');
  await page.setViewportSize({ width: 375, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const frame = await mount(<ReaderAsDrawn room="narrow" />);
  await expect(page.locator('.hg-reader-pages > li')).toHaveCount(pages.length);
  await expect(page.getByRole('status')).toHaveText(words.pagePill(1, pages.length, titles[first]));
  const share = page.getByRole('button', { name: words.share });
  const pdf = page.getByRole('button', { name: words.pdf });
  const again = page.getByRole('button', { name: words.newVersion });
  await expectTouchFloor([share, pdf, again]);
  await pdf.click();
  await expect(frame).toHaveAttribute('data-act', 'pdf');
  await again.click();
  await expect(frame).toHaveAttribute('data-act', 'new_version');
  await share.click();
  await expect(frame).toHaveAttribute('data-act', 'share');
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('at 1536 a thumbnail goes to its page and is marked the one in view', async ({
  mount,
  page,
}) => {
  if (third === undefined) throw new Error('the sample prints at least three pages');
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(<ReaderAsDrawn room="wide" />);
  await expect(page.getByRole('region', { name: words.documentName })).toBeVisible();
  const thumbs = page.getByRole('navigation', { name: words.pagesName });
  await expect(thumbs.getByRole('button')).toHaveCount(pages.length);
  const thumb = thumbs.getByRole('button', { name: words.goToPage(3, titles[third]) });
  await thumb.click();
  await expect(thumb).toHaveAttribute('aria-pressed', 'true');
  // Where the thumbnails name the page in view, the pill is the phone's alone.
  await expect(page.getByRole('status')).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('a reader who may not act gets the PDF alone', async ({ mount, page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await mount(<ReaderAsDrawn room="narrow" mayAct={false} />);
  await expect(page.getByRole('button', { name: words.pdf })).toBeVisible();
  await expect(page.getByRole('button', { name: words.share })).toHaveCount(0);
  await expect(page.getByRole('button', { name: words.newVersion })).toHaveCount(0);
});

test('the wait is named, and a failed read says what happened and asks again', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const loading = await mount(<ReaderAsDrawn room="narrow" frame="loading" />);
  await expect(page.getByRole('status', { name: words.opening })).toBeVisible();
  await loading.unmount();
  const frame = await mount(<ReaderAsDrawn room="narrow" frame="failed" />);
  await expect(page.getByText(words.failedTitle)).toBeVisible();
  await page.getByRole('button', { name: words.retry }).click();
  await expect(frame).toHaveAttribute('data-act', 'retry');
});
