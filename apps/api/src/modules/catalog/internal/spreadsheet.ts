import { Readable } from 'node:stream';
import { inflateRawSync } from 'node:zlib';
import {
  CATALOG_IMPORT_UNPACKED_LIMIT_BYTES,
  type CatalogImportSheet,
  type CatalogImportUnreadableReason,
  type FileContentType,
  HEADER_ROW_SCAN,
} from '@heliogrid/domain';
import ExcelJS, { type CellValue, type Worksheet } from 'exceljs';

/**
 * A stored price list read into what the wizard maps (`T-M01-030c`): each sheet's name, how many rows
 * and columns it fills, and its first rows as the file wrote them. A cell is text, never a value
 * this reader made up — the matching pass judges it later, against the tenant's currency.
 */
export type SpreadsheetRead =
  | { readonly readable: true; readonly sheets: readonly CatalogImportSheet[] }
  | {
      readonly readable: false;
      readonly reason: Exclude<CatalogImportUnreadableReason, 'not_read'>;
    };

export async function readSpreadsheet(
  bytes: Uint8Array,
  contentType: FileContentType,
  unpackedLimit = CATALOG_IMPORT_UNPACKED_LIMIT_BYTES,
): Promise<SpreadsheetRead> {
  const workbook = new ExcelJS.Workbook();
  if (contentType === 'text/csv') {
    // TextDecoder drops a byte-order mark; `map` keeps every cell the text it was, so `1,32,000`
    // and `0013200.50` reach the matching pass as written, never as a number exceljs guessed.
    const text = new TextDecoder().decode(bytes);
    try {
      await workbook.csv.read(Readable.from([text]), { map: (value: unknown) => value });
    } catch {
      // A quote left open is the file's, never an outage: a retry would read it the same way.
      return { readable: false, reason: 'cannot_open' };
    }
  } else {
    const unpacked = unpackedSizeOf(bytes, unpackedLimit);
    if (unpacked === 'too_large') return { readable: false, reason: 'too_large_unpacked' };
    if (unpacked === 'not_a_zip') return { readable: false, reason: 'cannot_open' };
    try {
      await workbook.xlsx.load(Buffer.from(bytes));
    } catch {
      return { readable: false, reason: 'cannot_open' };
    }
  }
  const sheets = workbook.worksheets.map(sheetOf);
  if (sheets.every((sheet) => sheet.rowCount === 0)) return { readable: false, reason: 'no_rows' };
  return { readable: true, sheets };
}

/**
 * Every row that holds a value is counted, the header row and any title above it included: the
 * device takes those off once the person has placed the header row among `topRows`. A top row
 * ends at its last filled cell, so a stray cell far to the right of one row never pads every row.
 */
function sheetOf(sheet: Worksheet): CatalogImportSheet {
  const rowCount = countFilledRows(sheet);
  const columnCount = rowCount === 0 ? 0 : sheet.columnCount;
  const lastTopRow = rowCount === 0 ? 0 : Math.min(HEADER_ROW_SCAN, sheet.rowCount);
  const topRows = Array.from({ length: lastTopRow }, (_row, index) => {
    const row = sheet.getRow(index + 1);
    const cells = Array.from({ length: row.cellCount }, (_cell, column) =>
      textOf(row.getCell(column + 1).value),
    );
    while (cells.at(-1) === '') cells.pop();
    return cells;
  });
  return { name: sheet.name, rowCount, columnCount, topRows };
}

function countFilledRows(sheet: Worksheet): number {
  let filled = 0;
  sheet.eachRow((row) => {
    let holdsText = false;
    row.eachCell((cell) => {
      holdsText ||= textOf(cell.value) !== '';
    });
    if (holdsText) filled += 1;
  });
  return filled;
}

/** A date cell reads as its day: the ISO form's first part. */
const ISO_DAY = 'yyyy-mm-dd';

/** A cell as the text a person reads in it: a formula's result, a link's words, a date's day. */
function textOf(value: CellValue | undefined): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date) return value.toISOString().slice(0, ISO_DAY.length);
  if ('richText' in value) return value.richText.map((run) => run.text).join('');
  if ('error' in value) return '';
  if ('result' in value) return textOf(value.result as CellValue);
  if ('text' in value) return typeof value.text === 'string' ? value.text : textOf(value.text);
  return '';
}

/**
 * Where a zip writes what this reader needs (APPNOTE 4.3): each record's signature, size and fields.
 * Exported for the reader's test, which writes packed and crafted zips by the same layout.
 */
export const zipEnd = {
  signature: 0x06054b50,
  size: 22,
  diskNumber: 4,
  directoryDisk: 6,
  entriesOnDisk: 8,
  entries: 10,
  directorySize: 12,
  directoryAt: 16,
} as const;
export const zipEntry = {
  signature: 0x02014b50,
  size: 46,
  method: 10,
  packedSize: 20,
  nameLength: 28,
  extraLength: 30,
  commentLength: 32,
  localAt: 42,
} as const;
export const zipLocal = {
  signature: 0x04034b50,
  size: 30,
  nameLength: 26,
  extraLength: 28,
} as const;
export const zipMethod = { stored: 0, deflated: 8 } as const;
/** What a two- or four-byte end-record field holds when it sends the parser to ZIP64. */
export const zipAllOnes = { twoBytes: 0xffff, fourBytes: 0xffffffff } as const;
/** A zip may end in a comment of up to this many bytes after its end-of-directory record. */
const MAX_ZIP_COMMENT = 0xffff;

/**
 * What an `.xlsx` unpacks to, measured by unpacking every entry under the limit — never what its
 * directory claims, which a crafted file writes as anything. Stops at the first byte past the
 * limit, so a packed upload costs the api the limit and no more.
 *
 * The zip is measured only as the parser will read it: `exceljs` hands it to JSZip, which finds the
 * directory where its offset and size say it ends and walks every record it meets there, whatever
 * count the end record states. So a directory that does not end at the end record, or a count that
 * disagrees with the records, is refused — either would let the parser unpack entries this never
 * measured.
 */
export function unpackedSizeOf(
  bytes: Uint8Array,
  limit: number,
): number | 'too_large' | 'not_a_zip' {
  const zip = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = endRecordOf(zip);
  if (end === null) return 'not_a_zip';
  let at = zip.readUInt32LE(end + zipEnd.directoryAt);
  let total = 0;
  let records = 0;
  try {
    while (at < end) {
      if (zip.readUInt32LE(at) !== zipEntry.signature) return 'not_a_zip';
      const unpacked = unpackEntry(zip, at, limit - total);
      if (unpacked === null) return 'not_a_zip';
      total += unpacked;
      if (total > limit) return 'too_large';
      records += 1;
      at += zipEntry.size + fieldLengths(zip, at, zipEntry);
    }
  } catch (error) {
    return isOverLimit(error) ? 'too_large' : 'not_a_zip';
  }
  if (at !== end || records !== zip.readUInt16LE(end + zipEnd.entries)) return 'not_a_zip';
  return total;
}

/**
 * Where the end record sits, when the parser would read the directory it names exactly as this
 * walk does: no ZIP64, and a directory that ends where the end record starts.
 */
function endRecordOf(zip: Buffer): number | null {
  const end = zip.lastIndexOf(signature(zipEnd.signature));
  // A file cut off inside its end record holds the signature and not the fields after it.
  if (end < 0 || zip.length - end < zipEnd.size) return null;
  if (zip.length - end > MAX_ZIP_COMMENT + zipEnd.size) return null;
  if (asksForZip64(zip, end)) return null;
  const directoryAt = zip.readUInt32LE(end + zipEnd.directoryAt);
  return directoryAt + zip.readUInt32LE(end + zipEnd.directorySize) === end ? end : null;
}

/**
 * Whether the end record sends the parser to a ZIP64 record: any of its counts or places at its
 * all-ones value does, and JSZip then searches the whole file for a directory this never walked.
 * A 2 MB workbook never needs ZIP64, so such a file is refused.
 */
function asksForZip64(zip: Buffer, end: number): boolean {
  const twoByte = [zipEnd.diskNumber, zipEnd.directoryDisk, zipEnd.entriesOnDisk, zipEnd.entries];
  const fourByte = [zipEnd.directorySize, zipEnd.directoryAt];
  return (
    twoByte.some((field) => zip.readUInt16LE(end + field) === zipAllOnes.twoBytes) ||
    fourByte.some((field) => zip.readUInt32LE(end + field) === zipAllOnes.fourBytes)
  );
}

/** One entry's unpacked size, inflated no further than one byte past the room left; null if unknown. */
function unpackEntry(zip: Buffer, at: number, room: number): number | null {
  const local = zip.readUInt32LE(at + zipEntry.localAt);
  if (zip.readUInt32LE(local) !== zipLocal.signature) return null;
  const dataAt = local + zipLocal.size + fieldLengths(zip, local, zipLocal);
  const packed = zip.subarray(dataAt, dataAt + zip.readUInt32LE(at + zipEntry.packedSize));
  switch (zip.readUInt16LE(at + zipEntry.method)) {
    case zipMethod.stored:
      return packed.length;
    case zipMethod.deflated:
      return inflateRawSync(packed, { maxOutputLength: room + 1 }).length;
    default:
      return null;
  }
}

/** The variable-length fields after a record's fixed part. */
function fieldLengths(
  zip: Buffer,
  at: number,
  record: {
    readonly nameLength: number;
    readonly extraLength: number;
    readonly commentLength?: number;
  },
): number {
  const comment =
    record.commentLength === undefined ? 0 : zip.readUInt16LE(at + record.commentLength);
  return (
    zip.readUInt16LE(at + record.nameLength) + zip.readUInt16LE(at + record.extraLength) + comment
  );
}

/** What Node throws when an inflate would pass `maxOutputLength`. */
function isOverLimit(error: unknown): boolean {
  return error instanceof RangeError && 'code' in error && error.code === 'ERR_BUFFER_TOO_LARGE';
}

function signature(value: number): Buffer {
  const bytes = Buffer.alloc(Uint32Array.BYTES_PER_ELEMENT);
  bytes.writeUInt32LE(value);
  return bytes;
}
