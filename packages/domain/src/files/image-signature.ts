import type { FileContentType } from './vocabulary';

/**
 * The leading bytes each image type always starts with. An upload link cannot bind the type —
 * the S3 presigner leaves `Content-Type` unsigned — so a confirmed file is read back and held to
 * these: bytes that are not the declared image are never made readable.
 */
const SIGNATURES: Readonly<Record<FileContentType, readonly number[]>> = {
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/jpeg': [0xff, 0xd8, 0xff],
};

/** How many leading bytes to read from the store: the longest signature. */
export const IMAGE_SIGNATURE_BYTES = Math.max(
  ...Object.values(SIGNATURES).map((signature) => signature.length),
);

export function matchesImageSignature(type: FileContentType, firstBytes: Uint8Array): boolean {
  const signature = SIGNATURES[type];
  return signature.every((byte, index) => firstBytes[index] === byte);
}
