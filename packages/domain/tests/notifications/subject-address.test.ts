import { describe, expect, it } from 'vitest';
import { subjectAddressOf } from '../../src/notifications/subject-address';

describe('subjectAddressOf — where a notification opens (F6-02)', () => {
  it.each([
    ['a dunning or trial notice opens Billing', 'dunning_event', 'more/billing'],
    ['a kind with no screen yet opens nothing', 'catalog_release', null],
    ['an unknown kind opens nothing', 'not_a_kind', null],
    ['no kind opens nothing', undefined, null],
  ] as const)('%s', (_, kind, address) => {
    expect(subjectAddressOf(kind)).toBe(address);
  });
});
