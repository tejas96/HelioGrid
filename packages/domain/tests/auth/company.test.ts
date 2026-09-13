import { describe, expect, it } from 'vitest';
import { hasCompany, homeOf } from '../../src/auth/company';
import type { SessionUser } from '../../src/auth/session';

/**
 * The two questions every signed-in surface asks about a person's company: may they be inside at
 * all, and where do they land. Both answer for the ABSENT person too — nobody is not inside, and
 * nobody has no home — because the caller holds `SessionUser | null` while the session settles.
 */
const person = (tenant: SessionUser['tenant']): SessionUser => ({
  id: 'u1',
  name: 'Asha',
  phoneE164: '+919876543210',
  interfaceLanguage: 'en',
  tenant,
});

describe('hasCompany', () => {
  it.each([
    ['nobody has no company', null, false],
    ['a person without a tenant has none', person(null), false],
    ['a person with a tenant has one', person({ id: 't1', roles: ['epc_owner'] }), true],
  ] as const)('%s', (_name, user, expected) => {
    expect(hasCompany(user)).toBe(expected);
  });
});

describe('homeOf', () => {
  it('answers null for nobody', () => {
    expect(homeOf(null)).toBeNull();
  });

  it('answers null while a person has no company', () => {
    expect(homeOf(person(null))).toBeNull();
  });

  it('resolves the home from the roles a person actually holds', () => {
    expect(homeOf(person({ id: 't1', roles: ['survey_engineer'] }))).toBe('survey_engineer');
  });

  it('answers null for a company held with no roles at all', () => {
    expect(homeOf(person({ id: 't1', roles: [] }))).toBeNull();
  });

  it('takes the HIGHEST rung when a person holds several, whatever order they arrive in', () => {
    const low = person({ id: 't1', roles: ['field_technician', 'sales_manager'] });
    const reversed = person({ id: 't1', roles: ['sales_manager', 'field_technician'] });
    expect(homeOf(low)).toBe('sales_manager');
    expect(homeOf(reversed)).toBe('sales_manager');
  });
});
