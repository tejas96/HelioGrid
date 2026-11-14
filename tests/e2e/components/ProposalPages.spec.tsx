import { PROPOSAL_VALIDITY_DAYS } from '@heliogrid/domain';
import { createTranslator, documentDefaults } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator, Page } from '@playwright/test';
import { settledBox } from '../support/layout';
import { PAYABLE, printed } from '../support/proposal-document-figures';
import { CUSTOMER, NUMBER, SNAPSHOT, versionOf } from '../support/proposal-document-sample';
import { pageWordsOf } from '../support/proposal-document-words';
import { TWO_SHEET_TERMS } from '../support/proposal-long-terms';
import { fillOf, resolvedColour } from '../support/token';
import { CoverBeforePrice } from './ProposalCover.story';
import { PageAsPrinted } from './ProposalPages.story';

/**
 * The proposal document's pages (`M06-51`): each drawn at its A4 design size from the blocks' paper
 * reading and scaled whole to the width it is given. Paper is light in every scheme; a page counts
 * itself among the pages that print; a fact that is absent leaves its part out.
 */
const en = await createTranslator('en');
const words = pageWordsOf(en.t, SNAPSHOT);
/** The platform's default terms, whose validity the server states as a fact (`M06-15`). */
const DEFAULT_TERMS = documentDefaults(en.t).terms;
const withDefaultTerms = pageWordsOf(en.t, {
  ...SNAPSHOT,
  fields: { ...SNAPSHOT.fields, terms: DEFAULT_TERMS },
  validityDays: PROPOSAL_VALIDITY_DAYS,
});
const PAYABLE_TEXT = printed(PAYABLE);

/** A4 at 96 dpi: the page's design size, which every fitted width keeps the ratio of. */
const PAGE = { width: 794, height: 1123 };

async function inScheme(page: Page, scheme: 'light' | 'dark') {
  await page.evaluate(
    (value) => document.documentElement.setAttribute('data-theme', value),
    scheme,
  );
}

test('the cover carries the customer, the number, three figures and who prepared it', async ({
  mount,
}) => {
  const cover = await mount(
    <PageAsPrinted
      page="cover"
      width={PAGE.width}
      terms={DEFAULT_TERMS}
      validityDays={PROPOSAL_VALIDITY_DAYS}
    />,
  );
  await expect(cover.getByRole('heading', { level: 1 })).toHaveText(CUSTOMER);
  await expect(cover.getByText(words.cover.over)).toBeVisible();
  await expect(cover.getByText(words.cover.system ?? '')).toBeVisible();
  await expect(cover.locator('.hg-pp-cover-number')).toContainText(NUMBER);
  await expect(cover.locator('.hg-pp-cover-value')).toHaveText([
    PAYABLE_TEXT,
    words.cover.generationValue('4,404'),
    words.cover.paybackValue('2.7'),
  ]);
  await expect(cover.getByText(words.cover.preparedBy ?? '')).toBeVisible();
  await expect(cover.locator('.hg-pp-cover-foot')).toContainText(
    withDefaultTerms.cover.validity ?? 'a validity line',
  );
  /* The cover's picture is decoration: it carries no words of its own for a screen reader. */
  await expect(cover.locator('img.hg-proposal-picture-file')).toHaveAttribute('alt', '');
});

test('a company’s own terms state no validity the server can read, so the cover prints none', async ({
  mount,
}) => {
  expect(words.cover.validity).toBeUndefined();
  const cover = await mount(<PageAsPrinted page="cover" width={PAGE.width} />);
  await expect(cover.locator('.hg-pp-cover-foot')).toHaveText(words.cover.preparedBy ?? '');
});

test('a draft with facts missing prints Draft and leaves the missing parts out', async ({
  mount,
}) => {
  const cover = await mount(<PageAsPrinted page="cover" width={PAGE.width} bare />);
  await expect(cover.locator('.hg-pp-cover-number')).toContainText(words.cover.draft);
  await expect(cover.locator('.hg-pp-cover-value')).toHaveText([PAYABLE_TEXT]);
  await cover.unmount();
  const bank = await mount(<PageAsPrinted page="bank" width={PAGE.width} bare />);
  await expect(bank.getByText(words.bankAbsent)).toBeVisible();
  await expect(bank.getByText(words.bankLead)).toHaveCount(0);
  await expect(bank.locator('.hg-pb-bank')).toHaveCount(0);
  await expect(bank.getByText(words.thanks)).toBeVisible();
  await bank.unmount();
  const about = await mount(<PageAsPrinted page="about" width={PAGE.width} bare />);
  await expect(about.locator('.hg-pb-record')).toHaveCount(0);
  await expect(about.locator('.hg-pp-lead')).toHaveCount(0);
});

test('a draft with no price yet draws its cover — the customer and the system line — and no glass', async ({
  mount,
}) => {
  const cover = await mount(<CoverBeforePrice width={PAGE.width} />);
  await expect(cover.getByRole('heading', { level: 1 })).toHaveText(CUSTOMER);
  await expect(cover.getByText(words.cover.system ?? 'a system line')).toBeVisible();
  await expect(cover.locator('.hg-pp-cover-number')).toContainText(words.cover.draft);
  /* No figure exists yet, so nothing is drawn to hold one (`ui-adherence.md`). */
  await expect(cover.locator('.hg-pp-cover-glass')).toHaveCount(0);
  await expect(cover.locator('.hg-pp-cover-value')).toHaveCount(0);
  await cover.unmount();
});

test('a page fits the width it is given and keeps the paper ratio', async ({ mount }) => {
  for (const width of [104, 350, 680]) {
    const fitted = await mount(<PageAsPrinted page="timeline" width={width} />);
    /* The fitted frame is the mounted root: the page inside it is scaled, the frame is not. */
    await expect(fitted).toHaveClass(/hg-pp-fit/);
    const box = await settledBox(fitted);
    expect(box.width).toBe(width);
    expect(box.height).toBeCloseTo((PAGE.height * width) / PAGE.width, 0);
    await expect(fitted.getByText(words.titles.timeline)).toBeVisible();
    await expect(fitted.getByText(words.timelineLead ?? '')).toBeVisible();
    await fitted.unmount();
  }
});

test('a page counts itself among the pages its version prints', async ({ mount }) => {
  const whole = await mount(<PageAsPrinted page="price" width={PAGE.width} />);
  await expect(whole.locator('.hg-pp-foot')).toContainText('6 / 9');
  await expect(whole.getByRole('article')).toHaveAccessibleName(
    words.pageName(words.titles.price, 6, 9),
  );
  await whole.unmount();
  /* A version whose company switched two pages off prints seven: the price page moves up. */
  const fewer = await mount(
    <PageAsPrinted page="price" width={PAGE.width} off={['about', 'generation']} />,
  );
  await expect(fewer.locator('.hg-pp-foot')).toContainText('4 / 7');
});

test('terms past one page print on two sheets, each counted among the pages, the second going on where the first stops', async ({
  mount,
}) => {
  /* Nine pages, the terms eighth: two sheets of terms make ten, and the bank page moves to tenth. */
  const first = await mount(
    <PageAsPrinted page="terms" width={PAGE.width} terms={TWO_SHEET_TERMS} part={0} />,
  );
  await expect(first.locator('.hg-pp-foot')).toContainText('8 / 10');
  await expect(first.getByText(/^1\. /)).toBeVisible();
  await expect(first.getByText(/^13\. /)).toHaveCount(0);
  await first.unmount();

  const second = await mount(
    <PageAsPrinted page="terms" width={PAGE.width} terms={TWO_SHEET_TERMS} part={1} />,
  );
  await expect(second.locator('.hg-pp-foot')).toContainText('9 / 10');
  await expect(second.getByText(/^13\. /)).toBeVisible();
  await expect(second.getByText(/^1\. /)).toHaveCount(0);
});

test('paper is light in a dark scheme, and the savings page draws light words on its deep ground', async ({
  mount,
  page,
}) => {
  await inScheme(page, 'light');
  const white = await resolvedColour(page, '--text-inverse');
  const lightPage = await mount(<PageAsPrinted page="price" width={PAGE.width} />);
  const paper = await fillOf(lightPage.locator('.hg-pp'));
  const ink = await lightPage.locator('.hg-pp-title').evaluate((t) => getComputedStyle(t).color);
  await lightPage.unmount();
  await inScheme(page, 'dark');
  const darkPage = await mount(<PageAsPrinted page="price" width={PAGE.width} />);
  expect(await fillOf(darkPage.locator('.hg-pp'))).toBe(paper);
  await expect(darkPage.locator('.hg-pp-title')).toHaveCSS('color', ink);
  await darkPage.unmount();
  const deep = await mount(<PageAsPrinted page="savings" width={PAGE.width} />);
  await expect(deep.locator('.hg-pp')).toHaveAttribute('data-tone', 'deep');
  await expect(deep.locator('.hg-pp-title')).toHaveCSS('color', white);
  await expect(deep.getByText(words.blocks.savings.projection)).toBeVisible();
});

test('the price page holds the plan, the EMI example and what is included, unshrunk and clear of its foot', async ({
  mount,
}) => {
  /* The plan fills the first sheet; the EMI example and what is included run on to the next. */
  const withEmi = pageWordsOf(en.t, versionOf(false, true, []));
  const said: string[] = [];
  for (const part of [0, 1]) {
    const price = await mount(<PageAsPrinted page="price" width={PAGE.width} emi part={part} />);
    await expect(price.locator('.hg-pp-body-fit')).not.toHaveAttribute('data-fitted', '');
    said.push((await price.locator('.hg-pp-body-fit').textContent()) ?? '');
    const body = await settledBox(price.locator('.hg-pp-body-fit'));
    const foot = await settledBox(price.locator('.hg-pp-foot'));
    expect(body.y + body.height).toBeLessThanOrEqual(foot.y + 1);
    await price.unmount();
  }
  const both = said.join(' ');
  expect(both).toContain(withEmi.blocks.emi.projection);
  expect(both).toContain(words.included);
  for (const line of words.includedLines) expect(both).toContain(line);
});

/** The lowest bottom of what a sheet prints, against the top of its foot: content never runs into it. */
async function clearOfFoot(sheet: Locator, rows: Locator) {
  const foot = await settledBox(sheet.locator('.hg-pp-foot'));
  const last = await settledBox(rows.last());
  expect(last.y + last.height).toBeLessThanOrEqual(foot.y);
}

for (const [page, rows, total] of [
  ['timeline', '.hg-pb-time-step', 20],
  ['price', '.hg-pb-split-row', 12],
] as const) {
  test(`the ${page} at its list's limit runs on over sheets: every line printed once, unshrunk, clear of the foot`, async ({
    mount,
    page: browser,
  }) => {
    await browser.setViewportSize({ width: PAGE.width, height: PAGE.height });
    let printed = 0;
    for (let part = 0; printed < total && part < 6; part += 1) {
      const sheet = await mount(
        <PageAsPrinted page={page} width={PAGE.width} emi full part={part} />,
      );
      const shown = sheet.locator(rows);
      const count = await shown.count();
      expect(count).toBeGreaterThan(0);
      await clearOfFoot(sheet, shown);
      await expect(sheet.locator('.hg-pp-body-fit')).not.toHaveAttribute('data-fitted', '');
      printed += count;
      await sheet.unmount();
    }
    expect(printed).toBe(total);
  });
}
