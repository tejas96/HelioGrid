import { formatMoneyPlainly, formatNumber, IN_FORMATS } from '@heliogrid/domain';
import { createTranslator, leadProposalsWords, proposalWithdrawWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { LEAD_PROPOSALS } from '../support/proposal-after-lists';
import { expectTouchFloor } from '../support/touch-target';
import { LeadProposalsAsDrawn } from './ProposalAfterSheets.story';

/**
 * The lead's Proposals section (`T-M06-001`, `M06-25`, `M06-58`): none yet, a draft with its ring,
 * one proposal, two live proposals with the warning and Withdraw, and a closed lead. Withdraw opens
 * its sheet, which says what the link will say and deletes nothing.
 */
const en = await createTranslator('en');
const FORMATS = {
  money: (amount: string) => formatMoneyPlainly(IN_FORMATS, amount),
  number: (value: number) => formatNumber(IN_FORMATS, value),
  ago: () => '2 hours ago',
  day: () => '14 Nov 2026',
};
const words = leadProposalsWords(en.t, FORMATS, {
  customerName: 'Anil Sharma',
  segment: 'residential',
  closedAs: 'lost',
});

for (const width of [375, 1536]) {
  test(`at ${width} a lead with no proposal offers Create proposal`, async ({ mount, page }) => {
    await page.setViewportSize({ width, height: 900 });
    const frame = await mount(<LeadProposalsAsDrawn state="none" />);
    await expect(page.getByText(words.noneTitle)).toBeVisible();
    await expect(page.getByText(words.noneLine)).toBeVisible();
    const create = page.getByRole('button', { name: words.create });
    await expectTouchFloor([create]);
    await create.click();
    await expect(frame).toHaveAttribute('data-act', 'create');
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);
  });

  test(`at ${width} two live proposals carry the warning and Withdraw on each`, async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await mount(<LeadProposalsAsDrawn state="two" />);
    await expect(page.getByText(words.twoTitle)).toBeVisible();
    await expect(page.getByText(words.twoLine)).toBeVisible();
    await expect(page.getByRole('button', { name: words.create })).toHaveCount(0);
    const [, second] = LEAD_PROPOSALS.two.items;
    if (second === undefined) throw new Error('the sample holds two proposals');
    const withdraw = page.getByRole('button', { name: words.withdrawNamed(second.number) });
    await expectTouchFloor([withdraw]);
    await withdraw.click();
    const sheet = proposalWithdrawWords(en.t, FORMATS, second).words;
    const dialog = page.getByRole('dialog', { name: sheet.title });
    await expect(dialog.getByText(sheet.hint)).toBeVisible();
    await expect(dialog.getByText(sheet.note)).toBeVisible();
    // Made by names the maker and the day the proposal was started (`T-M06-031`).
    await expect(dialog.getByText('Sneha Kulkarni · 14 Nov 2026', { exact: true })).toBeVisible();
    // The size is words in the UI face; only the price is a figure in mono.
    const price = FORMATS.money(second.payable ?? '');
    const figure = dialog.getByText(price, { exact: true });
    await expect(figure).toHaveCSS('font-family', /mono/i);
    await expect(figure.locator('..')).not.toHaveCSS('font-family', /mono/i);
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);
    await dialog.getByRole('button', { name: sheet.confirm }).click();
    await expect(page.locator('[data-act="withdrawn"]')).toHaveCount(1);
    // Its Withdraw went with it: focus lands on the page, never on nothing.
    await expect(page.getByTestId('page')).toBeFocused();
  });
}

test('a draft shows how far it is and continues; a built proposal shows where it stands and opens', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const [draft] = LEAD_PROPOSALS.draft.items;
  const [built] = LEAD_PROPOSALS.one.items;
  if (draft === undefined || built === undefined) throw new Error('the sample holds both');
  const drawn = await mount(<LeadProposalsAsDrawn state="draft" />);
  const row = page.getByRole('button', { name: new RegExp(words.draftTitle) });
  await expect(row.getByText(words.ringValue(7, 11))).toBeVisible();
  await expect(row.getByText(words.continue)).toBeVisible();
  await row.click();
  await expect(drawn).toHaveAttribute('data-act', `continue:${draft.id.slice(-2)}`);
  await drawn.unmount();
  const frame = await mount(<LeadProposalsAsDrawn state="one" />);
  const one = page.getByRole('button', { name: new RegExp(built.number ?? '') });
  await expect(one.getByText(words.standing(built.standing))).toBeVisible();
  await expect(one.getByText(words.line(built))).toBeVisible();
  await one.click();
  await expect(frame).toHaveAttribute('data-act', `open:${built.id.slice(-2)}`);
});

test('a closed lead makes no proposal until it is reopened', async ({ mount, page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const frame = await mount(<LeadProposalsAsDrawn state="closed" />);
  await expect(page.getByText(words.closedTitle)).toBeVisible();
  await expect(page.getByText(words.closedLine)).toBeVisible();
  await expect(page.getByRole('button', { name: words.create })).toHaveCount(0);
  await page.getByRole('button', { name: words.reopenLead }).click();
  await expect(frame).toHaveAttribute('data-act', 'reopen');
});

test('in Hindi the section keeps to its width', async ({ mount, page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await mount(<LeadProposalsAsDrawn state="two" reader="hi" />);
  await expectNoSidewaysScroll(page);
});
