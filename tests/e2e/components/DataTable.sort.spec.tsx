import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { WordedDataTable } from './DataTable.story';

const en = await createTranslator('en');
const name = en.t(SIGN_IN.mobileNumber);
const score = en.t(SIGN_IN.changeNumber);

const rows = [
  { id: 1, name: 'Asha', score: 2 },
  { id: 2, name: 'Dev', score: 3 },
  { id: 3, name: 'Ravi', score: 1 },
];

/** A sortable table where only `score` opts in; `name` is left unmarked. */
function sortingTable() {
  return (
    <WordedDataTable
      read={{ kind: 'ready' }}
      sortable
      columns={[
        { key: 'name', label: name, primary: true },
        { key: 'score', label: score, sortable: true },
      ]}
      rows={rows}
      stackBelow={0}
    />
  );
}

test('only a column that opts in offers a sort', async ({ mount }) => {
  const table = await mount(sortingTable());

  await expect(table.getByRole('columnheader', { name })).not.toHaveAttribute('aria-sort');
  await expect(table.getByRole('columnheader', { name }).getByRole('button')).toHaveCount(0);
  await expect(table.getByRole('columnheader', { name: score })).toHaveAttribute(
    'aria-sort',
    'none',
  );
});

test('each press on a sorted column turns its order round', async ({ mount }) => {
  const table = await mount(sortingTable());
  const head = table.getByRole('columnheader', { name: score });
  const firstCells = table.locator('tbody tr td:first-child');

  await head.getByRole('button').click();
  await expect(head).toHaveAttribute('aria-sort', 'ascending');
  await expect(firstCells).toHaveText(['Ravi', 'Asha', 'Dev']);

  await head.getByRole('button').click();
  await expect(head).toHaveAttribute('aria-sort', 'descending');
  await expect(firstCells).toHaveText(['Dev', 'Asha', 'Ravi']);

  await head.getByRole('button').click();
  await expect(head).toHaveAttribute('aria-sort', 'ascending');
  await expect(firstCells).toHaveText(['Ravi', 'Asha', 'Dev']);
});
