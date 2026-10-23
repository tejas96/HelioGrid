import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Card, DataTable } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';
import { FlaggedStackedTable, OpeningTable } from './DataTable.story';

const en = await createTranslator('en');
const label = en.t(SIGN_IN.mobileNumber);
const value = en.t(SIGN_IN.changeNumber);
const issue = en.t(SIGN_IN.wrongError);

const rows = [{ id: 1, name: value }];
const WIDE = 0;
const STACKED = Number.MAX_SAFE_INTEGER;

test('a table is a heading on the page — no fill, no shadow', async ({ mount }) => {
  const table = await mount(
    <DataTable columns={[{ key: 'name', label }]} rows={rows} stackBelow={WIDE} />,
  );

  await expect(table).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(table).toHaveCSS('box-shadow', 'none');
  await expect(table).toHaveCSS('border-radius', '0px');
});

test('a table row is on the page and its cell editor is a field on the fill', async ({
  mount,
  page,
}) => {
  const table = await mount(
    <DataTable
      columns={[{ key: 'name', label, editable: true }]}
      rows={rows}
      onCellCommit={() => undefined}
      stackBelow={WIDE}
    />,
  );
  const row = table.locator('.hg-dt-row').first();
  const editor = table.getByRole('textbox', { name: label });

  await expect(row).toHaveCSS('background-color', await resolvedColour(page, '--hg-ground'));
  await expect(row).toHaveCSS('box-shadow', 'none');
  await expect(editor).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  await expect(editor).toHaveCSS('box-shadow', 'none');
});

test('the sticky head paints the ground that holds it', async ({ mount, page }) => {
  const card = await mount(
    <Card>
      <DataTable columns={[{ key: 'name', label }]} rows={rows} stackBelow={WIDE} />
    </Card>,
  );
  const head = card.getByRole('columnheader', { name: label });

  await expect(head).toHaveCSS('position', 'sticky');
  await expect(head).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
});

test('a stacked record is a tile, and one holding an editor lies on the page', async ({
  mount,
  page,
}) => {
  await mount(
    <>
      <DataTable columns={[{ key: 'name', label }]} rows={rows} selectable stackBelow={STACKED} />
      <DataTable
        columns={[{ key: 'name', label, editable: true }]}
        rows={rows}
        onCellCommit={() => undefined}
        selectable
        stackBelow={STACKED}
      />
    </>,
  );
  const tile = page.locator('.hg-dt-card').nth(0);
  const onPage = page.locator('.hg-dt-card').nth(1);

  await expect(tile).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  await expect(tile).toHaveCSS('box-shadow', 'none');
  await expect(tile.locator('.hg-checkbox-box')).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--surface'),
  );
  await expect(onPage).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(onPage.getByRole('textbox', { name: label })).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--fill'),
  );
  await expect(onPage.locator('.hg-checkbox-box')).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--fill'),
  );
});

test('a record whose only editor is in its detail list lies on the page', async ({
  mount,
  page,
}) => {
  const table = await mount(
    <DataTable
      columns={[
        { key: 'name', label, primary: true },
        { key: 'note', label: issue, editable: true },
      ]}
      rows={[{ id: 1, name: value, note: value }]}
      onCellCommit={() => undefined}
      stackBelow={STACKED}
    />,
  );

  await expect(table.locator('.hg-dt-card')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(table.getByRole('textbox', { name: issue })).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--fill'),
  );
});

test('a column marked editable with nothing to commit to leaves the record a tile', async ({
  mount,
  page,
}) => {
  const table = await mount(
    <DataTable
      columns={[{ key: 'name', label, editable: true }]}
      rows={rows}
      stackBelow={STACKED}
    />,
  );

  await expect(table.locator('.hg-dt-card')).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--fill'),
  );
});

test('a flagged record holding an editor keeps its tint, and its controls are white', async ({
  mount,
  page,
}) => {
  const table = await mount(
    <FlaggedStackedTable label={label} value={value} issue={issue} withEditor />,
  );
  const card = table.locator('.hg-dt-card');

  await expect(card).toHaveCSS('background-color', await resolvedColour(page, '--warning-bg'));
  await expect(card.locator('.hg-checkbox-box')).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--surface'),
  );
  await expect(card.getByRole('textbox', { name: label })).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--fill'),
  );
});

test('a stacked total is a grey tile with no shadow', async ({ mount, page }) => {
  const table = await mount(
    <DataTable
      columns={[{ key: 'name', label }]}
      rows={rows}
      totalRow={{ label: value }}
      stackBelow={STACKED}
    />,
  );
  const total = table.locator('.hg-dt-total-block');

  await expect(total).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  await expect(total).toHaveCSS('box-shadow', 'none');
});

test('a flagged stacked record keeps its warning fill', async ({ mount, page }) => {
  const table = await mount(<FlaggedStackedTable label={label} value={value} issue={issue} />);

  await expect(table.locator('.hg-dt-card')).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--warning-bg'),
  );
});

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
    <DataTable
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
    <DataTable
      columns={[{ key: 'name', label }]}
      rows={[]}
      state="loading"
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
    <DataTable columns={[{ key: 'name', label }]} rows={rows} stackBelow={WIDE} />,
  );
  await expect(table.locator('.hg-dt-quiet')).toHaveCount(0);
});

test.describe('rowOpens: only the rows it allows open (D242)', () => {
  const label = en.t(SIGN_IN.mobileNumber);
  const act = en.t(SIGN_IN.changeNumber);

  test('in the grid: a click or the row button opens an allowed row, an act stays its own', async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width: 1536, height: 800 });
    const frame = await mount(<OpeningTable label={label} act={act} />);
    const rows = page.locator('tr.hg-dt-row');
    const open = page.getByRole('button', { name: 'Vikram Deshpande' });
    await expect(open).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Deepak Jadhav' })).toHaveCount(0);
    await rows.nth(1).click();
    await expect(frame).toHaveAttribute('data-opened', '');
    await rows.nth(0).getByRole('button', { name: act }).click();
    await expect(frame).toHaveAttribute('data-acted', 'Vikram Deshpande');
    await expect(frame).toHaveAttribute('data-opened', '');
    await rows.nth(0).getByRole('button', { name: act }).focus();
    await page.keyboard.press('Enter');
    await expect(frame).toHaveAttribute('data-opened', '');
    await open.focus();
    await expect(rows.nth(0)).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Space');
    await expect(frame).toHaveAttribute('data-opened', 'Vikram Deshpande');
  });

  test('in the cards: only an allowed card has a press target', async ({ mount, page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    const frame = await mount(<OpeningTable label={label} act={act} stacked />);
    const targets = page.locator('.hg-dt-card-target');
    await expect(targets).toHaveCount(1);
    await targets.click({ position: { x: 12, y: 12 } });
    await expect(frame).toHaveAttribute('data-opened', 'Vikram Deshpande');
  });
});
