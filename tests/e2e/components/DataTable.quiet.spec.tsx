import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';
import { WordedDataTable } from './DataTable.story';

/**
 * The quiet head (design-system change 20), drawn as OneOhm draws a table: sentence-case labels on
 * the page over one line, a line under every row, and no card behind the rows.
 */
const en = await createTranslator('en');
const label = en.t(SIGN_IN.mobileNumber);
const value = en.t(SIGN_IN.changeNumber);
const issue = en.t(SIGN_IN.wrongError);

const WIDE = 0;

test('a quiet table — sentence-case labels over a line, a line under every row, no card behind them', async ({
  mount,
  page,
}) => {
  const three = [
    { id: 1, name: value },
    { id: 2, name: label },
    { id: 3, name: issue },
  ];
  const table = await mount(
    <WordedDataTable
      read={{ kind: 'ready' }}
      columns={[{ key: 'name', label }]}
      rows={three}
      caption={value}
      head="quiet"
      stackBelow={WIDE}
    />,
  );
  const head = table.getByRole('columnheader', { name: label });
  const rowsShown = table.locator('.hg-dt-row');
  const line = await resolvedColour(page, '--line-soft');

  // The words themselves, not only their cell: the label is a Text inside the header cell.
  const words = head.getByText(label, { exact: true });
  await expect(words).toHaveCSS('text-transform', 'none');
  await expect(words).toHaveCSS('font-size', '12px');
  await expect(words).toHaveCSS('letter-spacing', 'normal');
  await expect(words).toHaveCSS('color', await resolvedColour(page, '--text-secondary'));
  await expect(head).toHaveCSS('border-bottom-color', line);
  // The caption still names the table, for a screen reader only (F7-27).
  await expect(table.getByRole('table', { name: value })).toBeVisible();
  await expect(table.getByText(value, { exact: true }).first()).toHaveClass(/hg-spoken-only/);
  await expect(rowsShown).toHaveCount(3);
  for (const index of [0, 1, 2]) {
    await expect(rowsShown.nth(index)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(rowsShown.nth(index).locator('td').first()).toHaveCSS('border-bottom-color', line);
  }
  // A row is at least 56 tall over a 12 cell pad: a face with a name over one quiet line.
  const cell = rowsShown.nth(1).locator('td').first();
  await expect(cell).toHaveCSS('height', '56px');
  await expect(cell).toHaveCSS('padding-top', '12px');
  // Nothing is drawn behind the rows: the table stands on the page.
  const behind = await table.evaluate((node) => {
    const holder = node.querySelector('.hg-dt-table')?.parentElement;
    if (!holder) return 'none';
    const style = getComputedStyle(holder, '::before');
    return style.content === 'none' || style.content === '' ? 'none' : style.backgroundColor;
  });
  expect(behind).toBe('none');
});

test('a quiet table keeps its labels while it loads, with three rows', async ({ mount }) => {
  const table = await mount(
    <WordedDataTable
      columns={[{ key: 'name', label }]}
      rows={[]}
      read={{ kind: 'loading' }}
      head="quiet"
      stackBelow={WIDE}
    />,
  );
  await expect(table.locator('[aria-busy="true"]').first()).toBeVisible();
  await expect(table.getByText(label)).toBeVisible();
  await expect(table.locator('.hg-dt-row')).toHaveCount(3);
});
