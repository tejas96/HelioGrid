import { describe, expect, it } from 'vitest';
import type { SessionUser } from '../../src/auth/session';
import { type SetupRead, setupStepOwed } from '../../src/auth/setup-step';

const person = {
  id: '8f0c2d1e-0000-4000-8000-0000000000a1',
  name: 'Priya Kulkarni',
  phoneE164: '+919876543210',
  interfaceLanguage: 'en',
} as const;
const TENANT_ID = '8f0c2d1e-0000-4000-8000-000000000001';
const owner: SessionUser = { ...person, tenant: { id: TENANT_ID, roles: ['epc_owner'] } };
const ownerWhoSells: SessionUser = {
  ...person,
  tenant: { id: TENANT_ID, roles: ['sales_executive', 'epc_owner'] },
};
const seller: SessionUser = { ...person, tenant: { id: TENANT_ID, roles: ['sales_executive'] } };
const withoutCompany: SessionUser = { ...person, tenant: null };

const reading: SetupRead = { status: 'pending' };
const unanswered: SetupRead = { status: 'failed' };
const atLanguage: SetupRead = { status: 'ready', resumeStep: 'language' };
const atWhatYouSell: SetupRead = { status: 'ready', resumeStep: 'what_you_sell' };
const closed: SetupRead = { status: 'ready', resumeStep: null };

describe('setupStepOwed — the setup step a session is asked for (M01-10, F3-03)', () => {
  it.each([
    { who: 'an owner whose company resumes at the language step', user: owner, read: atLanguage },
    { who: 'an owner who holds a second role', user: ownerWhoSells, read: atLanguage },
  ])('asks $who for the language step', ({ user, read }) => {
    expect(setupStepOwed(user, false, read)).toBe('language');
  });

  it('waits while an owner’s progress is still being read', () => {
    expect(setupStepOwed(owner, false, reading)).toBe('wait');
  });

  it.each([
    { why: 'the read got no answer: setup never holds a person', user: owner, read: unanswered },
    {
      why: 'the company resumes at a later step, which has no screen yet',
      user: owner,
      read: atWhatYouSell,
    },
    { why: 'every step is answered', user: owner, read: closed },
    { why: 'the roles do not manage the company’s settings', user: seller, read: atLanguage },
    {
      why: 'the roles do not manage them, and nothing is read for that person',
      user: seller,
      read: reading,
    },
    { why: 'there is no company yet', user: withoutCompany, read: reading },
    { why: 'nobody is signed in', user: null, read: reading },
  ])('asks for no step when $why', ({ user, read }) => {
    expect(setupStepOwed(user, false, read)).toBeNull();
  });

  it.each([
    { read: atLanguage, when: 'the step is owed' },
    { read: reading, when: 'the read is still in flight' },
  ])('asks for no step in a session that put it off, when $when', ({ read }) => {
    expect(setupStepOwed(owner, true, read)).toBeNull();
  });
});
