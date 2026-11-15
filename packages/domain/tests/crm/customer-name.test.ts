import { describe, expect, it } from 'vitest';
import { customerShortNameOf } from '../../src/crm/customer-name';

describe('customerShortNameOf — what a proposal line calls the customer', () => {
  it.each([
    ['Big Crore Industries', 'commercial', 'Big Crore Industries'],
    ['  Shree   Ganesh Traders ', 'commercial', 'Shree Ganesh Traders'],
    ['Anil Sharma', 'residential', 'Anil'],
    ['S. Kulkarni', 'residential', 'S. Kulkarni'],
    // A segment not yet chosen is read as a person, the common deal.
    ['Meena Deshpande', null, 'Meena'],
  ] as const)('%j (%s) → %j', (name, segment, short) => {
    expect(customerShortNameOf(name, segment)).toBe(short);
  });

  it('no name stays none', () => {
    expect(customerShortNameOf(null, 'commercial')).toBeNull();
    expect(customerShortNameOf(null, 'residential')).toBeNull();
  });
});
