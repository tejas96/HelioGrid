import { describe, expect, it } from 'vitest';
import { nulPaths } from '../../src/common/unstorable-text';

/**
 * Where a NUL sits in a parsed body or query, by its schema-field path — and bytes, a webhook's raw
 * body, are never walked as text.
 */
describe('nulPaths', () => {
  it.each<[string, unknown, string[]]>([
    ['a clean body', { name: 'Ravi', tags: ['a', 'b'] }, []],
    ['a nested field', { contact: { name: 'Ra\u0000vi' } }, ['contact.name']],
    ['an array item', { tags: ['ok', 'b\u0000d'] }, ['tags.1']],
    ['a raw body of bytes', Buffer.from('a\u0000b'), []],
    ['a byte view', new Uint8Array([0, 1, 2]), []],
  ])('%s', (_what, value, paths) => {
    expect(nulPaths(value)).toEqual(paths);
  });
});
