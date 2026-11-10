import { describe, expect, it } from 'vitest';
import { subjectAddressOf } from '../../src/notifications/subject-address';

const LEAD = '0190f3b6-7a1c-7c3e-9d2a-5b8e4f6a1c20';

describe('subjectAddressOf — where a notification opens (F6-02)', () => {
  it.each([
    ['a dunning or trial notice opens Billing', 'dunning_event', undefined, 'more/billing'],
    ['a lead notice opens that lead', 'lead', LEAD, `leads/${LEAD}`],
    ['a lead notice with no id opens nothing', 'lead', undefined, null],
    ['an import notice opens that import', 'lead_import', LEAD, `leads/import?job=${LEAD}`],
    ['an import notice with no id opens nothing', 'lead_import', undefined, null],
    ['a customer has no page of its own', 'customer', LEAD, null],
    ['a kind with no screen yet opens nothing', 'catalog_release', LEAD, null],
    ['an unknown kind opens nothing', 'not_a_kind', LEAD, null],
    ['no kind opens nothing', undefined, undefined, null],
  ] as const)('%s', (_, kind, ref, address) => {
    expect(subjectAddressOf(kind, ref)).toBe(address);
  });
});
