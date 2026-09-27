import { describe, expect, it } from 'vitest';
import { matchesImageSignature } from '../../src/files/image-signature';

/**
 * The first bytes of a stored file against the type it was declared as (`T-FPLAT-035` C7). The
 * store cannot be told the type, so this is what stops HTML or a script being kept as a logo.
 */
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46];
const HTML = [...'<html><b'].map((character) => character.charCodeAt(0));
const bytes = (values: readonly number[]) => Uint8Array.from(values);

describe('matchesImageSignature — only PNG and JPEG signatures match their type', () => {
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
  ] as const)('%s over %j is %s', (type, first, expected) => {
    expect(matchesImageSignature(type, bytes(first))).toBe(expected);
  });
});
