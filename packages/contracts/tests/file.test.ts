import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { checksumSha256Schema } from '../src/file';

/**
 * The checksum a client declares (`T-FPLAT-035`): canonical base64 of a SHA-256 only, because the
 * store reports the canonical form back and `complete` compares the two as strings.
 */
const canonical = createHash('sha256').update('logo').digest('base64');
const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
/**
 * Same 32 bytes, one spare bit set in the last character: it decodes equal, never string-equal.
 * A canonical last character sits at a multiple of four in the alphabet, so the next one is it.
 */
const lastData = canonical.at(-2) ?? '';
const nonCanonical = `${canonical.slice(0, -2)}${BASE64[BASE64.indexOf(lastData) + 1]}=`;

describe('checksumSha256Schema', () => {
  it('takes the canonical encoding of a digest and refuses one the store would never echo', () => {
    expect(checksumSha256Schema.safeParse(canonical).success).toBe(true);
    expect(Buffer.from(nonCanonical, 'base64')).toEqual(Buffer.from(canonical, 'base64'));
    expect(checksumSha256Schema.safeParse(nonCanonical).success).toBe(false);
  });
});
