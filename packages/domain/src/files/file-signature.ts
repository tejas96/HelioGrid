import { BINARY_DXF_SIGNATURE } from '../studio/dxf-pairs';
import type { FileContentType } from './vocabulary';

/**
 * What the first bytes of each type always hold. An upload link cannot bind the type — the S3
 * presigner leaves `Content-Type` unsigned — so a confirmed file is read back and held to these:
 * bytes that are not the declared type are never made readable. An `.xlsx` is a zip and opens with
 * its signature; a CSV has none, so it is held to being text — no NUL byte where a binary file
 * would have one. A plan's lines are a JSON object: text whose first mark is `{`.
 */
type TextType = 'text/csv' | 'application/json';
const ascii = (text: string): number[] => [...text].map((mark) => mark.charCodeAt(0));

/** A byte any value may take: a WebP's file size sits between its two marks. */
const ANY = null;

const SIGNATURES: Readonly<
  Record<Exclude<FileContentType, TextType>, readonly (number | typeof ANY)[]>
> = {
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/webp': [...ascii('RIFF'), ANY, ANY, ANY, ANY, ...ascii('WEBP')],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [0x50, 0x4b, 0x03, 0x04],
  'application/pdf': [0x25, 0x50, 0x44, 0x46, 0x2d],
  /** `AC10` and the release's two digits: `AC1015` is AutoCAD 2000, `AC1032` is 2018. */
  'image/vnd.dwg': ascii('AC10'),
  'image/vnd.dxf': BINARY_DXF_SIGNATURE,
};

/** How many leading bytes to read from the store: enough to see a CSV is text. */
export const FILE_SIGNATURE_BYTES = 512;

export function matchesFileSignature(type: FileContentType, firstBytes: Uint8Array): boolean {
  if (type === 'text/csv') return isText(firstBytes);
  if (type === 'application/json') {
    const first = firstBytes.find((byte) => !WHITESPACE.has(byte));
    return isText(firstBytes) && first === 0x7b;
  }
  return SIGNATURES[type].every((byte, index) =>
    byte === ANY ? firstBytes[index] !== undefined : firstBytes[index] === byte,
  );
}

const WHITESPACE = new Set([0x20, 0x09, 0x0a, 0x0d]);

function isText(firstBytes: Uint8Array): boolean {
  return firstBytes.length > 0 && !firstBytes.includes(0);
}
