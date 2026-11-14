import { createTranslator, provenanceWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll, expectNothingClipped } from '../support/layout';
import {
  NET_COST,
  PAYABLE,
  printed,
  rupees,
  SUBSIDY,
  TAX,
} from '../support/proposal-document-figures';
import { moneyOf, TRANCHES, TRANCHES_LONG } from '../support/proposal-document-money';
import { SNAPSHOT } from '../support/proposal-document-sample';
import { blockWordsOf } from '../support/proposal-document-words';
import { resolvedColour } from '../support/token';
import { expectTouchFloor } from '../support/touch-target';
import { BlockAsDrawn } from './ProposalDocument.story';

/**
 * The proposal's blocks (`M06-50`: one renderer): each drawn once and read three ways — `app` to
 * the person building, `paper` and `link` to the customer. A block prints the figures it is handed
 * with their honesty beside them, and draws nothing for a fact it was not given.
 */
const en = await createTranslator('en');
const builder = blockWordsOf(en.t, 'builder', SNAPSHOT);
const customer = blockWordsOf(en.t, 'customer', SNAPSHOT);

/** The sample's figures as the document prints them: never rounded, no zero fraction. */
const text = (amount: Parameters<typeof printed>[0]) => printed(amount);
const PAYABLE_TEXT = text(PAYABLE);
const TAX_TEXT = text(TAX);
const PER_KW_TEXT = text(rupees(63525));
const SUBSIDY_TEXT = text(SUBSIDY);
const NET_COST_TEXT = text(NET_COST);
const MARGIN_TEXT = text(rupees(35000));
/** The plan's amounts, as the market format prints the money block's own. */
const PLAN_AMOUNTS = (moneyOf('drawn', TRANCHES).tranches ?? []).map((part) => part.amount);
const AMOUNTS = PLAN_AMOUNTS.map((amount) => printed(amount, PLAN_AMOUNTS));

const at = (page: Page, width: number) => page.setViewportSize({ width, height: 900 });

test('the price speaks to the person building: payable, tax, the per-kW check, the incentive beside it', async ({
  mount,
  page,
}) => {
  await at(page, 375);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const block = await mount(<BlockAsDrawn block="price" mode="app" />);
  await expect(block.getByText(builder.price.overline)).toBeVisible();
  await expect(block.locator('.hg-pb-price-main')).toContainText(PAYABLE_TEXT);
  await expect(block.getByText(builder.price.includesTax(TAX_TEXT))).toBeVisible();
  /* The tax figure is set in the mono face, wherever the sentence put it. */
  await expect(block.locator('.hg-pb-sub b.hg-pb-mono')).toHaveText(TAX_TEXT);
  await expect(block.getByText(builder.price.perKw(PER_KW_TEXT))).toBeVisible();
  /* The incentive is information beside the payable, never taken off it. */
  await expect(block.getByText(builder.price.incentive)).toBeVisible();
  await expect(block.getByText(SUBSIDY_TEXT)).toBeVisible();
  await expect(block.getByText(builder.price.netCost)).toBeVisible();
  await expect(block.getByText(NET_COST_TEXT)).toBeVisible();
  /* The basis line is the customer's to read; nobody is handed a margin here. */
  await expect(block.getByText(customer.price.basis ?? '')).toHaveCount(0);
  await expect(block.getByText(builder.price.onlyYou)).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('the margin shows only to its holder, and only in the builder', async ({ mount }) => {
  const owner = await mount(<BlockAsDrawn block="price" mode="app" kase="owner" />);
  await expect(owner.getByText(builder.price.margin(MARGIN_TEXT, '20%'))).toBeVisible();
  await expect(owner.getByText(builder.price.onlyYou)).toBeVisible();
  await owner.unmount();
  const link = await mount(<BlockAsDrawn block="price" mode="link" kase="owner" />);
  await expect(link.getByText(customer.price.onlyYou)).toHaveCount(0);
  await expect(link.getByText(customer.price.perKw(PER_KW_TEXT))).toHaveCount(0);
});

test('the customer reads the basis line in the flow, at the weight of the figures', async ({
  mount,
}) => {
  const block = await mount(<BlockAsDrawn block="price" mode="link" />);
  await expect(block.getByText(customer.price.overline)).toBeVisible();
  await expect(block.getByText(customer.price.basis ?? '')).toBeVisible();
  await expect(block.getByText(customer.price.incentive)).toBeVisible();
});

test('a payable at or below zero is shown as it is, in the danger ink, with its line', async ({
  mount,
  page,
}) => {
  const block = await mount(<BlockAsDrawn block="price" mode="app" kase="belowZero" />);
  await expect(block.locator('.hg-pb-bad-line')).toHaveRole('status');
  await expect(block.locator('.hg-pb-bad-line')).toHaveText(builder.price.aboveZero);
  await expect(block.locator('.hg-pb-price-main .hg-text')).toHaveCSS(
    'color',
    await resolvedColour(page, '--danger-text'),
  );
  await expect(block.getByText(builder.price.includesTax(TAX_TEXT))).toHaveCount(0);
});

test('a company registered for no tax prints its line, never an empty tax', async ({ mount }) => {
  const block = await mount(<BlockAsDrawn block="price" mode="link" kase="noTax" />);
  await expect(block.getByText(customer.price.noTax)).toBeVisible();
  await expect(block.getByText(customer.price.includesTax(TAX_TEXT))).toHaveCount(0);
});

test('generation names its source and its best month, and draws twelve bars', async ({
  mount,
  page,
}) => {
  await at(page, 375);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const block = await mount(<BlockAsDrawn block="generation" mode="app" />);
  await expect(block.getByText(builder.generation.source ?? '')).toBeVisible();
  await expect(block.getByText(builder.generation.perYear)).toBeVisible();
  await expect(block.getByText(builder.generation.source ?? '')).toContainText('ERA5');
  const chart = block.getByRole('img', { name: builder.generation.chart('May') });
  await expect(chart).toBeVisible();
  await expect(chart.locator('.hg-pb-bar')).toHaveCount(12);
  await expect(chart.locator('.hg-pb-bar[data-peak]')).toHaveCount(1);
  await expect(chart.locator('.hg-pb-bar-value')).toHaveText('456');
  await expect(block.getByText(builder.generation.average('367'))).toBeVisible();
  await expectNothingClipped(page, '.hg-pb-bar-value, .hg-pb-figure');
  await expectNoSidewaysScroll(page);
});

test('savings prints its projection line beside the figures, never on hover', async ({
  mount,
  page,
}) => {
  await at(page, 375);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const block = await mount(<BlockAsDrawn block="savings" mode="link" />);
  await expect(block.getByRole('img', { name: customer.savings.chart('2.7') })).toBeVisible();
  await expect(block.getByText(customer.savings.netCost(NET_COST_TEXT))).toBeVisible();
  await expect(block.getByText(customer.savings.paybackValue('2.7'))).toBeVisible();
  await expect(block.getByText(customer.savings.lifetimeLabel(25))).toBeVisible();
  await expect(block.getByText(customer.savings.projection)).toBeVisible();
  /* Words set beside a plot stay at the page's size: none falls under the 12 px floor. */
  const smallest = await block
    .locator('.hg-pb-payback-net-word, .hg-pb-payback-axis')
    .evaluateAll((words) =>
      Math.min(...words.map((w) => parseFloat(getComputedStyle(w).fontSize))),
    );
  expect(smallest).toBeGreaterThanOrEqual(12);
  await expectNoSidewaysScroll(page);
});

test('the EMI example says it is a projection and no loan offer', async ({ mount }) => {
  const block = await mount(<BlockAsDrawn block="emi" mode="link" />);
  await expect(block.getByText(customer.emi.monthlyLabel(60))).toBeVisible();
  await expect(block.getByText(customer.emi.projection)).toBeVisible();
});

test('a whole payment plan reads 100% with an amount on every part', async ({ mount }) => {
  const block = await mount(<BlockAsDrawn block="split" mode="paper" />);
  await expect(block.getByRole('img', { name: customer.split.chart })).toBeVisible();
  await expect(block.locator('.hg-pb-verdict[data-state="met"]')).toHaveText('100%');
  await expect(block.locator('.hg-pb-split-row')).toHaveCount(TRANCHES.length);
  await expect(block.locator('.hg-pb-split-amount')).toHaveText(AMOUNTS);
  /* When a part falls due is said to the customer, never as the pipeline's own stage name. */
  for (const part of TRANCHES) {
    await expect(
      block.getByText(customer.split.due(part.dueOnStage), { exact: true }),
    ).toBeVisible();
  }
  await expect(block.locator('.hg-pb-split-gap')).toHaveCount(0);
});

test('a plan that falls short says so in words, shows the gap, and states no amount', async ({
  mount,
}) => {
  const block = await mount(<BlockAsDrawn block="split" mode="app" kase="short" />);
  await expect(block.locator('.hg-pb-verdict')).toHaveRole('status');
  await expect(block.locator('.hg-pb-verdict')).toHaveText(builder.split.under('12%'));
  await expect(block.locator('.hg-pb-split-gap')).toHaveCount(1);
  await expect(block.locator('.hg-pb-split-amount')).toHaveCount(0);
});

test('long Devanagari names wrap at 375 and never clip a share or an amount', async ({
  mount,
  page,
}) => {
  await at(page, 375);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const block = await mount(<BlockAsDrawn block="split" mode="link" kase="long" />);
  for (const part of TRANCHES_LONG) await expect(block.getByText(part.label)).toBeVisible();
  await expect(block.locator('.hg-pb-split-amount')).toHaveCount(TRANCHES_LONG.length);
  await expectNothingClipped(page, '.hg-pb-split-share, .hg-pb-split-amount');
  await expectNoSidewaysScroll(page);
});

test('in the builder a kind is a tile at the touch floor, and a press opens its picker', async ({
  mount,
  page,
}) => {
  await at(page, 375);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const block = await mount(<BlockAsDrawn block="parts" mode="app" />);
  const tiles = block.getByRole('button');
  await expect(tiles).toHaveCount(5);
  await expectTouchFloor(await tiles.all());
  /* An empty kind carries its line in words, never the tint alone. */
  const empty = block.getByRole('button', { name: builder.parts.pick });
  await expect(empty).toHaveCount(1);
  await empty.click();
  await expect(page.getByTestId('picked')).toHaveText('structure');
  /* A kind's first line prints its own facts: the panel's watt-peak, its cell type, its warranty. */
  await expect(block.getByText(builder.parts.count('panel', 6))).toBeVisible();
  await expect(block.locator('.hg-pb-flag')).toHaveText('DCR');
  /* Two brands of one kind read as alternatives. */
  await expect(block.getByText(builder.parts.or, { exact: true })).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('an empty kind is absent on the customer page and named as left out on paper', async ({
  mount,
}) => {
  const link = await mount(<BlockAsDrawn block="parts" mode="link" />);
  await expect(link.locator('.hg-pb-part')).toHaveCount(4);
  await expect(link.getByRole('button')).toHaveCount(0);
  await expect(link.getByText(customer.parts.notPicked)).toHaveCount(0);
  await link.unmount();
  const paper = await mount(<BlockAsDrawn block="parts" mode="paper" />);
  await expect(paper.locator('.hg-pb-part')).toHaveCount(5);
  await expect(paper.getByText(customer.parts.notPicked)).toBeVisible();
});

test('bank details that are saved and not printed say so to the person building only', async ({
  mount,
}) => {
  const app = await mount(<BlockAsDrawn block="bank" mode="app" kase="notPrinted" />);
  await expect(app.getByText(builder.bank.notPrinted)).toBeVisible();
  await app.unmount();
  const paper = await mount(<BlockAsDrawn block="bank" mode="paper" kase="notPrinted" />);
  await expect(paper.getByText(customer.bank.notPrinted)).toHaveCount(0);
  await expect(
    paper.getByText(customer.bank.account(SNAPSHOT.company.bankDetails?.accountNumber ?? '')),
  ).toBeVisible();
});

test('the track record carried onto a proposal states its power figure’s tier, and no count’s (F8-01)', async ({
  mount,
}) => {
  const record = await mount(<BlockAsDrawn block="record" mode="paper" />);
  const assumed = provenanceWords(en.t).tier('assumed');
  await expect(record.getByText(assumed)).toHaveCount(1);
  await expect(record.getByText(customer.record.installedKw)).toBeVisible();
});

test('the track record, the timeline and the terms print what they are handed', async ({
  mount,
}) => {
  const record = await mount(<BlockAsDrawn block="record" mode="paper" />);
  await expect(record.getByText(customer.record.installedKw)).toBeVisible();
  await expect(record.getByText(customer.record.cities)).toBeVisible();
  await record.unmount();
  const timeline = await mount(<BlockAsDrawn block="timeline" mode="link" />);
  await expect(timeline.getByRole('listitem')).toHaveCount(5);
  await timeline.unmount();
  const company = await mount(<BlockAsDrawn block="company" mode="app" />);
  await expect(company.getByText(builder.company.proposalOverline)).toBeVisible();
  await expect(company.getByText(builder.company.draft)).toBeVisible();
  await expect(company.getByText(builder.company.type)).toBeVisible();
});
