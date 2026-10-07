/*
 * The reader's whole-sheet read for the matching pass (`T-M01-030d` decision 2): every row of the
 * mapped sheet, at its sheet position and as the file wrote it — the rows the mapping turns into
 * cells. The file is one the read step already opened, so a sheet it does not hold reads as none.
 */
import { HEADER_ROW_SCAN } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { readSheetRows } from '../../src/modules/catalog/internal/spreadsheet';
import { aWorkbookOf, priceListType } from './support';

const CSV = priceListType.csv;
const XLSX = priceListType.xlsx;
const utf8 = (text: string) => new TextEncoder().encode(text);
const A_PRICE = 13_200;
/** Rows past the top rows the read step keeps, so the whole read is seen to go further. */
const PAST_THE_SCAN = 5;

describe('reading one sheet whole for the matching pass (`T-M01-030d`)', () => {
  it('gives every row of a CSV, past the top rows, by its sheet position and as written', async () => {
    const products = Array.from({ length: HEADER_ROW_SCAN + PAST_THE_SCAN }, (_, row) => [
      'Waaree',
      `WS-${row}`,
      '1,32,000',
    ]);
    const csv = [
      'Brand,Model,Rate',
      '',
      ...products.map((row) => row.join(',').replace('1,32,000', '"1,32,000"')),
    ];

    const read = await readSheetRows(utf8(csv.join('\n')), CSV, 0);

    expect(read).toEqual({ readable: true, rows: [['Brand', 'Model', 'Rate'], [], ...products] });
  });

  it('gives the sheet the mapping names, and nothing for a sheet the file does not hold', async () => {
    const workbook = await aWorkbookOf({
      Panels: [['Brand', 'Model', 'Rate']],
      Inverters: [
        ['Brand', 'Model', 'Rate'],
        ['Growatt', 'MIN-5000', A_PRICE],
      ],
    });

    expect(await readSheetRows(workbook, XLSX, 1)).toEqual({
      readable: true,
      rows: [
        ['Brand', 'Model', 'Rate'],
        ['Growatt', 'MIN-5000', String(A_PRICE)],
      ],
    });
    expect(await readSheetRows(workbook, XLSX, 2)).toEqual({ readable: false });
  });
});
