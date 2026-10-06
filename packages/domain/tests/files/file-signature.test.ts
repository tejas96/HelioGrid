import { describe, expect, it } from 'vitest';
import { matchesFileSignature } from '../../src/files/file-signature';

/**
 * The first bytes of a stored file against the type it was declared as (`T-FPLAT-035` C7,
 * `M01-41`). The store cannot be told the type, so this is what stops HTML or a script being kept
 * as a logo, and a photograph being kept as a price list.
 */
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
/** A PNG's signature and the length of its first chunk, which opens with zero bytes. */
const PNG_HEAD = [...PNG, 0x00, 0x00, 0x00, 0x0d];
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46];
const XLSX = [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00];
const HTML = [...'<html><b'].map((character) => character.charCodeAt(0));
const CSV = [...'Brand,Model,Rate\n'].map((character) => character.charCodeAt(0));
const BOM_CSV = [0xef, 0xbb, 0xbf, ...CSV];
const UTF16_CSV = [0xff, 0xfe, 0x42, 0x00, 0x72, 0x00];
const bytes = (values: readonly number[]) => Uint8Array.from(values);

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

describe('matchesFileSignature — each type holds only its own first bytes', () => {
  it.each([
    ['image/png', PNG, true],
    ['image/jpeg', JPEG, true],
    ['image/png', JPEG, false],
    ['image/jpeg', PNG, false],
    ['image/png', HTML, false],
    ['image/jpeg', HTML, false],
    ['image/png', PNG.slice(0, 7), false],
    ['image/jpeg', JPEG.slice(0, 2), false],
    ['image/png', [], false],
    [XLSX_TYPE, XLSX, true],
    [XLSX_TYPE, XLSX.slice(0, 3), false],
    [XLSX_TYPE, PNG, false],
    [XLSX_TYPE, CSV, false],
    ['text/csv', CSV, true],
    ['text/csv', BOM_CSV, true],
    ['text/csv', PNG_HEAD, false],
    ['text/csv', XLSX, false],
    ['text/csv', UTF16_CSV, false],
    ['text/csv', [], false],
  ] as const)('%s over %j is %s', (type, first, expected) => {
    expect(matchesFileSignature(type, bytes(first))).toBe(expected);
  });
});
