import { sha256 } from '@noble/hashes/sha2';
import { base64Of } from './base64';

/**
 * The SHA-256 of a file's bytes as a device declares it: the store holds the upload to this value,
 * so it is computed one way on every platform, and in the canonical base64 the api's own check of
 * the stored bytes answers.
 */
export function checksumSha256Of(bytes: Uint8Array): string {
  return base64Of(sha256(bytes));
}
