import type { FileContentType } from './vocabulary';

/**
 * What the first bytes of each type always hold. An upload link cannot bind the type — the S3
 * presigner leaves `Content-Type` unsigned — so a confirmed file is read back and held to these:
 * bytes that are not the declared type are never made readable. An `.xlsx` is a zip and opens with
 * its signature; a CSV has none, so it is held to being text — no NUL byte where a binary file
 * would have one.
 */
const SIGNATURES: Readonly<Record<Exclude<FileContentType, 'text/csv'>, readonly number[]>> = {
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [0x50, 0x4b, 0x03, 0x04],
};

/** How many leading bytes to read from the store: enough to see a CSV is text. */
export const FILE_SIGNATURE_BYTES = 512;

export function matchesFileSignature(type: FileContentType, firstBytes: Uint8Array): boolean {
  if (type === 'text/csv') return firstBytes.length > 0 && !firstBytes.includes(0);
  return SIGNATURES[type].every((byte, index) => firstBytes[index] === byte);
}
