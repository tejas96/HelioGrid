import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';
import { WordedDataTable } from './DataTable.story';

/** The quiet head (design-system change 20): labels on the page, the rows in one raised card. */
const en = await createTranslator('en');
const label = en.t(SIGN_IN.mobileNumber);
const value = en.t(SIGN_IN.changeNumber);
const issue = en.t(SIGN_IN.wrongError);

const rows = [{ id: 1, name: value }];
const WIDE = 0;

test('a quiet table — sentence-case labels on the page, the rows in one raised card with hairlines (design-system change 20)', async ({
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
  const card = table.locator('.hg-dt-quiet');

  // The words themselves, not only their cell: the label is a Text inside the header cell.
  const words = head.getByText(label, { exact: true });
  await expect(words).toHaveCSS('text-transform', 'none');
  await expect(words).toHaveCSS('font-size', '12px');
  await expect(words).toHaveCSS('letter-spacing', 'normal');
  await expect(words).toHaveCSS('color', await resolvedColour(page, '--text-secondary'));
  // The caption still names the table, for a screen reader only (F7-27).
  await expect(table.getByRole('table', { name: value })).toBeVisible();
  await expect(table.getByText(value, { exact: true }).first()).toHaveClass(/hg-spoken-only/);
  await expect(rowsShown).toHaveCount(3);
  for (const index of [0, 1, 2]) {
    await expect(rowsShown.nth(index)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  }
  await expect(rowsShown.nth(0)).toHaveCSS('border-top-width', '0px');
  await expect(rowsShown.nth(1)).toHaveCSS(
    'border-top-color',
    await resolvedColour(page, '--line-soft'),
  );
  await expect(rowsShown.nth(1).locator('td').first()).toHaveCSS('height', '82px');
  const cardLook = await card.evaluate((node) => {
    const style = getComputedStyle(node, '::before');
    return {
      background: style.backgroundColor,
      shadow: style.boxShadow,
      radius: style.borderRadius,
    };
  });
  expect(cardLook.background).toBe(await resolvedColour(page, '--surface'));
  expect(cardLook.shadow).not.toBe('none');
  expect(cardLook.radius).toBe('16px');
});

test('a quiet table keeps its labels and its card while it loads, with three rows', async ({
  mount,
}) => {
  const table = await mount(
    <WordedDataTable
      columns={[{ key: 'name', label }]}
      rows={[]}
      read={{ kind: 'loading' }}
      head="quiet"
      stackBelow={WIDE}
    />,
  );
  await expect(table.locator('.hg-dt-quiet')).toHaveAttribute('aria-busy', 'true');
  await expect(table.getByText(label)).toBeVisible();
  await expect(table.locator('.hg-dt-row')).toHaveCount(3);
});

test('a table without the quiet head draws no card wrapper', async ({ mount }) => {
  const table = await mount(
    <WordedDataTable
      read={{ kind: 'ready' }}
      columns={[{ key: 'name', label }]}
      rows={rows}
      stackBelow={WIDE}
    />,
  );
  await expect(table.locator('.hg-dt-quiet')).toHaveCount(0);
});
