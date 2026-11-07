import { describe, expect, it } from 'vitest';
import { type SetupFacts, setupReadiness } from '../../src/shell/setup-readiness';

const FRESH: SetupFacts = {
  profile: { address: false, bank: false, registrations: 0, logo: false },
  releases: 0,
  paymentTemplates: 1,
  templateOwn: false,
  people: 1,
  invites: 0,
};

describe('setupReadiness — where a company stands before its first proposal', () => {
  it('a fresh company has one of six steps done and its profile is next', () => {
    const readiness = setupReadiness(['epc_owner'], FRESH);
    expect(readiness.steps.map((s) => s.step)).toEqual([
      'company_profile',
      'branding',
      'catalog',
      'payment_terms',
      'proposal_templates',
      'team',
    ]);
    expect(readiness.done).toBe(1);
    expect(readiness.total).toBe(6);
    expect(readiness.next).toBe('company_profile');
    expect(readiness.complete).toBe(false);
  });

  it('a profile needs the address, the bank and a registration; the logo is branding', () => {
    const partial = {
      ...FRESH,
      profile: { address: true, bank: true, registrations: 0, logo: true },
    };
    const readiness = setupReadiness(['epc_owner'], partial);
    expect(readiness.steps[0]?.done).toBe(false);
    expect(readiness.steps[1]?.done).toBe(true);
  });

  it('an invitation out counts the team as started', () => {
    const readiness = setupReadiness(['epc_owner'], { ...FRESH, invites: 1 });
    expect(readiness.steps.find((s) => s.step === 'team')?.done).toBe(true);
  });

  it('a fact still out leaves its step unjudged and never next', () => {
    const readiness = setupReadiness(['epc_owner'], { ...FRESH, profile: null });
    expect(readiness.steps[0]?.done).toBeNull();
    expect(readiness.next).toBe('catalog');
  });

  it('is complete only when every step is judged and done', () => {
    const all: SetupFacts = {
      profile: { address: true, bank: true, registrations: 1, logo: true },
      releases: 2,
      paymentTemplates: 2,
      templateOwn: true,
      people: 4,
      invites: 0,
    };
    const readiness = setupReadiness(['epc_owner'], all);
    expect(readiness.complete).toBe(true);
    expect(readiness.next).toBeNull();
  });

  it('shows a person only the steps their presets open', () => {
    expect(setupReadiness(['sales_executive'], FRESH).steps).toEqual([]);
  });
});
