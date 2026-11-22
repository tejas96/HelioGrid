/**
 * A DXF as its stream of group-code pairs (`T-M05-002d`), from text or binary: both formats are the
 * same pairs, written two ways, so the reader of the drawing (`dxf-read.ts`) takes either.
 */

/** One group: its code and its value, a string or a number by the code's range. */
export interface DxfPair {
  readonly code: number;
  readonly value: string | number;
}

/** A DXF saved in binary opens with these bytes, whatever its release; the store holds one to them. */
export const BINARY_DXF_SIGNATURE: readonly number[] = [
  ...[...'AutoCAD Binary DXF\r\n'].map((mark) => mark.charCodeAt(0)),
  0x1a,
  0x00,
];

/** Whether these bytes open as a binary DXF: the same signature the store holds the file to. */
export function isBinaryDxf(bytes: Uint8Array): boolean {
  return BINARY_DXF_SIGNATURE.every((byte, i) => bytes[i] === byte);
}

/** What a group code's value is. */
type ValueKind = 'string' | 'double' | 'int16' | 'int32' | 'int64' | 'bool' | 'chunk';

/** The DXF reference's code ranges, first to last; a code in none is a string. */
const CODE_RANGES: readonly (readonly [number, number, ValueKind])[] = [
  [0, 9, 'string'],
  [10, 59, 'double'],
  [60, 79, 'int16'],
  [90, 99, 'int32'],
  [110, 149, 'double'],
  [160, 169, 'int64'],
  [170, 179, 'int16'],
  [210, 239, 'double'],
  [270, 289, 'int16'],
  [290, 299, 'bool'],
  [310, 319, 'chunk'],
  [370, 389, 'int16'],
  [400, 409, 'int16'],
  [420, 429, 'int32'],
  [440, 459, 'int32'],
  [460, 469, 'double'],
  [1004, 1004, 'chunk'],
  [1010, 1059, 'double'],
  [1060, 1070, 'int16'],
  [1071, 1071, 'int32'],
];

function kindOf(code: number): ValueKind {
  return CODE_RANGES.find(([from, to]) => code >= from && code <= to)?.[2] ?? 'string';
}

/** The pairs of a text DXF: a code line, then its value line. */
export function dxfPairsOfText(text: string): DxfPair[] {
  const lines = text.split(/\r?\n/);
  const pairs: DxfPair[] = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = Number.parseInt((lines[i] as string).trim(), 10);
    if (Number.isNaN(code)) throw new Error(`line ${i + 1} is no group code`);
    const raw = (lines[i + 1] as string).trim();
    const kind = kindOf(code);
    pairs.push({ code, value: kind === 'string' || kind === 'chunk' ? raw : Number(raw) });
  }
  return pairs;
}

/** Bytes read one group at a time, refusing a read past the end. */
class Cursor {
  at = BINARY_DXF_SIGNATURE.length;
  private readonly view: DataView;

  constructor(private readonly bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  get done(): boolean {
    return this.at >= this.bytes.length;
  }

  private take(count: number): number {
    if (this.at + count > this.bytes.length) throw new Error('the binary DXF ends inside a group');
    const from = this.at;
    this.at += count;
    return from;
  }

  byte = (): number => this.bytes[this.take(1)] as number;
  uint16 = (): number => this.view.getUint16(this.take(2), true);
  int16 = (): number => this.view.getInt16(this.take(2), true);
  int32 = (): number => this.view.getInt32(this.take(4), true);
  int64 = (): number => Number(this.view.getBigInt64(this.take(8), true));
  double = (): number => this.view.getFloat64(this.take(8), true);

  /** A NUL-ended string. Names and layers are ASCII in every release that writes binary DXF. */
  string = (): string => {
    const end = this.bytes.indexOf(0, this.at);
    if (end < 0) throw new Error('a string with no end');
    const text = String.fromCharCode(...this.bytes.subarray(this.at, end));
    this.at = end + 1;
    return text;
  };

  /** A binary chunk: its length, then its bytes, which no plan line needs. */
  chunk = (): string => {
    this.take(this.byte());
    return '';
  };
}

const READ: Readonly<Record<ValueKind, (cursor: Cursor) => string | number>> = {
  string: (cursor) => cursor.string(),
  double: (cursor) => cursor.double(),
  int16: (cursor) => cursor.int16(),
  int32: (cursor) => cursor.int32(),
  int64: (cursor) => cursor.int64(),
  bool: (cursor) => cursor.byte(),
  chunk: (cursor) => cursor.chunk(),
};

/** A code that says the next code is two bytes wide, in an R12 file whose codes are one byte. */
const WIDE_CODE_FOLLOWS = 255;

/**
 * The pairs of a binary DXF. From AutoCAD R13 each code is two bytes; an R12 file's is one byte,
 * 255 leading a two-byte one. Numbers are little-endian.
 */
export function dxfPairsOfBinary(bytes: Uint8Array): DxfPair[] {
  if (!isBinaryDxf(bytes)) throw new Error('not a binary DXF');
  const cursor = new Cursor(bytes);
  // The first group is always 0 SECTION: a zero second byte says the codes are two bytes wide.
  const wide = bytes[cursor.at + 1] === 0;
  const codeOf = (): number => {
    if (wide) return cursor.uint16();
    const code = cursor.byte();
    return code === WIDE_CODE_FOLLOWS ? cursor.uint16() : code;
  };
  const pairs: DxfPair[] = [];
  while (!cursor.done) {
    const code = codeOf();
    const value = READ[kindOf(code)](cursor);
    pairs.push({ code, value });
    if (code === 0 && value === 'EOF') break;
  }
  return pairs;
}
