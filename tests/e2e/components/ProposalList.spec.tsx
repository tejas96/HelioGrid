import { formatMoneyPlainly, IN_FORMATS } from '@heliogrid/domain';
import { createTranslator, pickLeadWords, proposalListWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { LIST_ROWS } from '../support/proposal-after-lists';
import { ListAsDrawn } from './ProposalAfter.story';

/**
 * The proposals list (`SCR-M06-19`): chips with their counts, a card per proposal on a phone and a
 * table at width, each row with its customer, number, system, price, standing and latest line; a
 * row's copy act opens the lead picker.
 */
const en = await createTranslator('en');
const words = proposalListWords(en.t, {
  money: (amount) => formatMoneyPlainly(IN_FORMATS, amount),
  number: String,
  when: (instant) => instant,
  ago: () => '2 hours ago',
});
const [first] = LIST_ROWS;

test('at 375 each proposal is a card: customer, number, system, price, standing and latest line', async ({
  mount,
  page,
}) => {
  if (first === undefined) throw new Error('the sample holds rows');
  await page.setViewportSize({ width: 375, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const frame = await mount(<ListAsDrawn room="narrow" />);
  const card = page.getByRole('button', { name: words.open(first) });
  await expect(card.getByText(words.number(first))).toBeVisible();
  await expect(card.getByText(words.price(first) ?? '')).toBeVisible();
  await expect(card.getByText(words.standing(first.standing))).toBeVisible();
  await expect(card.getByText(words.latest(first))).toBeVisible();
  await card.click();
  await expect(frame).toHaveAttribute('data-act', 'open:PRP-0042');
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('at 1536 the list is a table, and a row copies itself for another lead', async ({
  mount,
  page,
}) => {
  if (first === undefined) throw new Error('the sample holds rows');
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(<ListAsDrawn room="wide" />);
  const table = page.getByRole('table', { name: words.caption });
  await expect(table.getByRole('columnheader', { name: words.columns.price })).toBeVisible();
  await expect(table.getByRole('row')).toHaveCount(LIST_ROWS.length + 1);
  await table.getByRole('button', { name: words.copyNamed(first) }).click();
  const picker = page.getByRole('dialog', { name: pickLeadWords(en.t).title });
  await expect(picker.getByText(pickLeadWords(en.t).newCustomer)).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('a chip carries its count and picks its filter; a list with nothing says so', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const frame = await mount(<ListAsDrawn room="narrow" />);
  const waiting = page.getByRole('button', { name: new RegExp(`^${words.filter('waiting')}`) });
  await expect(waiting).toContainText('4');
  await waiting.click();
  await expect(frame.locator('[data-filter]')).toHaveAttribute('data-filter', 'waiting');
  await frame.unmount();
  await mount(<ListAsDrawn room="narrow" frame="empty" />);
  await expect(page.getByText(words.emptyTitle)).toBeVisible();
});

for (const [width, room] of [
  [375, 'narrow'],
  [1536, 'wide'],
] as const) {
  test(`at ${width} a row that is not current says so with a mark and offers a new version`, async ({
    mount,
    page,
  }) => {
    if (first === undefined) throw new Error('the sample holds rows');
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const frame = await mount(<ListAsDrawn room={room} stale />);
    const mark = page.locator('.hg-status-mark', { hasText: words.stale });
    await expect(mark).toHaveCount(1);
    await expect(mark.locator('.hg-status-mark-glyph')).toBeVisible();
    await page.getByRole('button', { name: words.newVersionNamed(first) }).click();
    await expect(frame).toHaveAttribute('data-act', 'new:PRP-0042');
    await expect(page.getByRole('button', { name: words.newVersion, exact: true })).toHaveCount(0);
    await expectNoSidewaysScroll(page);
  });
}
