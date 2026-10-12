import { describe, expect, it } from 'vitest';
import { base64Of, bytesOfBase64 } from '../../src/files/base64';
import { checksumSha256Of } from '../../src/files/checksum';

/**
 * The checksum a device declares a file with (`T-FPLAT-035`): the store holds the upload to it, so
 * a device that computed another value could never store a file.
 */
const bytesOf = (text: string) => Uint8Array.from([...text].map((letter) => letter.charCodeAt(0)));

describe('checksumSha256Of — the SHA-256 of the bytes, in the base64 the api takes', () => {
  it.each([
    ['abc', 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0='],
    ['', '47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='],
  ])('the bytes of "%s"', (text, checksum) => {
    expect(checksumSha256Of(bytesOf(text))).toBe(checksum);
  });
});

describe('bytesOfBase64 — a picker’s base64 back to the bytes it holds', () => {
  it.each([0, 1, 2, 3, 4, 1000, 1001])('%i bytes come back as they went in', (length) => {
    const bytes = Uint8Array.from({ length }, (_, at) => (at * 37 + 11) & 255);
    expect(bytesOfBase64(base64Of(bytes))).toEqual(bytes);
  });
});
