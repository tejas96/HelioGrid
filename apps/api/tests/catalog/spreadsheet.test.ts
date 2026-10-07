/*
 * The import's reader (`T-M01-030c` AC-10): a stored price list in, each sheet's name, counts and
 * top rows out, every cell as the file wrote it — or the reason the file cannot be read. The bound
 * on what a workbook unpacks to is the one thing standing between a 2 MB upload and the serving
 * api's memory, so it is proven at its edge.
 */
import { deflateRawSync } from 'node:zlib';
import { HEADER_ROW_SCAN } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import {
  readSpreadsheet,
  unpackedSizeOf,
  zipAllOnes,
  zipEnd,
  zipEntry,
  zipLocal,
  zipMethod,
} from '../../src/modules/catalog/internal/spreadsheet';
import { aWorkbookOf, priceListType } from './support';

const CSV = priceListType.csv;
const XLSX = priceListType.xlsx;

const utf8 = (text: string) => new TextEncoder().encode(text);
const SAVED_ON = new Date('2026-08-12T00:00:00Z');
const A_PRICE = 13_200;
/** Rows past the scan, so the count and the kept rows differ. */
const PAST_THE_SCAN = 5;
/** Any small entry: the zip is whole, but nothing in it is a workbook. */
const NOT_A_WORKBOOK = 64;

/** A zip of one deflated entry of `size` zero bytes: what a packed upload looks like. */
function aZipOf(size: number): Uint8Array {
  const name = Buffer.from('xl/worksheets/sheet1.xml');
  const packed = deflateRawSync(Buffer.alloc(size));
  const local = Buffer.alloc(zipLocal.size);
  local.writeUInt32LE(zipLocal.signature);
  local.writeUInt16LE(name.length, zipLocal.nameLength);
  const central = Buffer.alloc(zipEntry.size);
  central.writeUInt32LE(zipEntry.signature);
  central.writeUInt16LE(zipMethod.deflated, zipEntry.method);
  central.writeUInt32LE(packed.length, zipEntry.packedSize);
  central.writeUInt32LE(size, zipEntry.packedSize + Uint32Array.BYTES_PER_ELEMENT);
  central.writeUInt16LE(name.length, zipEntry.nameLength);
  const end = Buffer.alloc(zipEnd.size);
  end.writeUInt32LE(zipEnd.signature);
  end.writeUInt16LE(1, zipEnd.entries);
  end.writeUInt32LE(central.length + name.length, zipEnd.directorySize);
  end.writeUInt32LE(local.length + name.length + packed.length, zipEnd.directoryAt);
  return new Uint8Array(Buffer.concat([local, name, packed, central, name, end]));
}

/** The same zip with one field of its end record rewritten — a crafted file's lie. */
function withEndField(
  zip: Uint8Array,
  field: number,
  bytes: number,
  rewrite: (stated: number) => number,
): Uint8Array {
  const crafted = Buffer.from(zip);
  const at = crafted.length - zipEnd.size + field;
  if (bytes === Uint16Array.BYTES_PER_ELEMENT)
    crafted.writeUInt16LE(rewrite(crafted.readUInt16LE(at)), at);
  else crafted.writeUInt32LE(rewrite(crafted.readUInt32LE(at)), at);
  return new Uint8Array(crafted);
}

describe('reading a CSV price list', () => {
  it('keeps every cell as the file wrote it — grouped figures, Hindi headers, no coercion', async () => {
    const file = utf8(
      '\uFEFFब्रांड,मॉडल,दर,Saved\nWaaree,WS-540,"1,32,000",2026-08-12\nLuminous,NXG 1100,0013200.50,\n',
    );

    const read = await readSpreadsheet(file, CSV);

    expect(read).toEqual({
      readable: true,
      sheets: [
        {
          name: expect.any(String),
          rowCount: 3,
          columnCount: 4,
          topRows: [
            ['ब्रांड', 'मॉडल', 'दर', 'Saved'],
            ['Waaree', 'WS-540', '1,32,000', '2026-08-12'],
            ['Luminous', 'NXG 1100', '0013200.50'],
          ],
        },
      ],
    });
  });

  it.each([
    ['nothing at all', ''],
    ['blank lines only', '\n\n,,\n'],
  ])('reads no rows from %s', async (_case, text) => {
    expect(await readSpreadsheet(utf8(text), CSV)).toEqual({ readable: false, reason: 'no_rows' });
  });

  it('cannot open a CSV whose quote is never closed — the file’s fault, never an outage', async () => {
    expect(await readSpreadsheet(utf8('Brand,Model\n"Waaree,WS-540\n'), CSV)).toEqual({
      readable: false,
      reason: 'cannot_open',
    });
  });

  it('ends each top row at its last filled cell, so one far cell pads no other row', async () => {
    const read = await readSpreadsheet(utf8('Brand,Model,,,,,,,,,,,,Note\nWaaree,WS-540\n'), CSV);

    if (!read.readable) throw new Error('the list is readable');
    expect(read.sheets[0]?.topRows).toEqual([
      ['Brand', 'Model', '', '', '', '', '', '', '', '', '', '', '', 'Note'],
      ['Waaree', 'WS-540'],
    ]);
  });
});

describe('reading an .xlsx price list', () => {
  it('reads every sheet, its counts and its first rows, cells as text', async () => {
    const file = await aWorkbookOf({
      Panels: [
        ['Rooftop Distributors — August'],
        [],
        ['Brand', 'Model', 'Rate', 'In stock', 'Since'],
        ['Waaree', 'WS-540', A_PRICE, true, SAVED_ON],
        ['Adani', 'ASB-545', { formula: '13000+200', result: A_PRICE }],
      ],
      Notes: [],
    });

    const read = await readSpreadsheet(file, XLSX);

    expect(read).toEqual({
      readable: true,
      sheets: [
        {
          name: 'Panels',
          rowCount: 4,
          columnCount: 5,
          topRows: [
            ['Rooftop Distributors — August'],
            [],
            ['Brand', 'Model', 'Rate', 'In stock', 'Since'],
            ['Waaree', 'WS-540', '13200', 'TRUE', '2026-08-12'],
            ['Adani', 'ASB-545', '13200'],
          ],
        },
        { name: 'Notes', rowCount: 0, columnCount: 0, topRows: [] },
      ],
    });
  });

  it(`keeps the first ${HEADER_ROW_SCAN} rows and counts the rest`, async () => {
    const rows = Array.from({ length: HEADER_ROW_SCAN + PAST_THE_SCAN }, (_row, index) => [
      `row ${index + 1}`,
    ]);

    const read = await readSpreadsheet(await aWorkbookOf({ Long: rows }), XLSX);

    if (!read.readable) throw new Error('a long sheet is readable');
    expect(read.sheets[0]?.rowCount).toBe(HEADER_ROW_SCAN + PAST_THE_SCAN);
    expect(read.sheets[0]?.topRows).toHaveLength(HEADER_ROW_SCAN);
    expect(read.sheets[0]?.topRows.at(-1)).toEqual([`row ${HEADER_ROW_SCAN}`]);
  });

  it.each([
    ['bytes that are not a zip', utf8('PK\u0003\u0004 and then nothing a zip holds')],
    ['a zip that is not a workbook', aZipOf(NOT_A_WORKBOOK)],
  ])('cannot open %s', async (_case, bytes) => {
    expect(await readSpreadsheet(bytes, XLSX)).toEqual({ readable: false, reason: 'cannot_open' });
  });

  it('cannot open a workbook cut off inside its end record', async () => {
    const cutOff = aZipOf(NOT_A_WORKBOOK).slice(0, -zipEnd.size / 2);
    expect(await readSpreadsheet(cutOff, XLSX)).toEqual({ readable: false, reason: 'cannot_open' });
  });

  it('reads no rows from a workbook whose every sheet is empty', async () => {
    const file = await aWorkbookOf({ One: [], Two: [] });
    expect(await readSpreadsheet(file, XLSX)).toEqual({ readable: false, reason: 'no_rows' });
  });
});

describe('the unpacked bound', () => {
  const LIMIT = 4096;

  it.each([
    ['exactly the bound', LIMIT, 'cannot_open'],
    ['one byte past it', LIMIT + 1, 'too_large_unpacked'],
  ])('a zip unpacking to %s (%i bytes) is %s', async (_case, size, reason) => {
    expect(await readSpreadsheet(aZipOf(size), XLSX, LIMIT)).toEqual({ readable: false, reason });
  });

  it('stops a packed zip at the bound, whatever it would unpack to', async () => {
    expect(await readSpreadsheet(aZipOf(LIMIT * LIMIT), XLSX, LIMIT)).toEqual({
      readable: false,
      reason: 'too_large_unpacked',
    });
  });

  it('measures a packed entry whatever count the end record states', async () => {
    const statesNone = withEndField(
      aZipOf(LIMIT * LIMIT),
      zipEnd.entries,
      Uint16Array.BYTES_PER_ELEMENT,
      () => 0,
    );
    expect(await readSpreadsheet(statesNone, XLSX, LIMIT)).toEqual({
      readable: false,
      reason: 'too_large_unpacked',
    });
  });

  it.each([
    [
      'a directory that ends short of the end record',
      zipEnd.directorySize,
      Uint32Array.BYTES_PER_ELEMENT,
      (size: number) => size - 1,
    ],
    ['a count of two over one record', zipEnd.entries, Uint16Array.BYTES_PER_ELEMENT, () => 2],
  ] as const)(
    'refuses %s, which the parser would read past the measure',
    (_case, field, bytes, rewrite) => {
      const honest = aZipOf(NOT_A_WORKBOOK);

      expect(unpackedSizeOf(honest, LIMIT)).toBe(NOT_A_WORKBOOK);
      expect(unpackedSizeOf(withEndField(honest, field, bytes, rewrite), LIMIT)).toBe('not_a_zip');
    },
  );

  it.each([
    ['its disk number', zipEnd.diskNumber, Uint16Array.BYTES_PER_ELEMENT, zipAllOnes.twoBytes],
    [
      'its directory disk',
      zipEnd.directoryDisk,
      Uint16Array.BYTES_PER_ELEMENT,
      zipAllOnes.twoBytes,
    ],
    [
      'its entries on disk',
      zipEnd.entriesOnDisk,
      Uint16Array.BYTES_PER_ELEMENT,
      zipAllOnes.twoBytes,
    ],
    [
      'its directory size',
      zipEnd.directorySize,
      Uint32Array.BYTES_PER_ELEMENT,
      zipAllOnes.fourBytes,
    ],
  ] as const)(
    'refuses an end record that asks for ZIP64 through %s',
    (_case, field, bytes, allOnes) => {
      expect(
        unpackedSizeOf(
          withEndField(aZipOf(NOT_A_WORKBOOK), field, bytes, () => allOnes),
          LIMIT,
        ),
      ).toBe('not_a_zip');
    },
  );
});
