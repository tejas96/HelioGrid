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
const atLanguage: SetupRead = { status: 'ready', steps: {} };
const atWhatYouSell: SetupRead = { status: 'ready', steps: { language: 'completed' } };
const atCompanyProfile: SetupRead = {
  status: 'ready',
  steps: { language: 'completed', what_you_sell: 'completed' },
};
const atInviteTeam: SetupRead = {
  status: 'ready',
  steps: { language: 'completed', what_you_sell: 'completed', business_profile: 'skipped' },
};
const atReady: SetupRead = {
  status: 'ready',
  steps: { ...atInviteTeam.steps, invite_team: 'skipped' },
};
const closed: SetupRead = { status: 'ready', steps: { ...atReady.steps, ready: 'completed' } };

describe('setupStepOwed — the setup step a session is asked for (M01-10, F3-03)', () => {
  it.each([
    { who: 'an owner whose company resumes at the language step', user: owner, read: atLanguage },
    { who: 'an owner who holds a second role', user: ownerWhoSells, read: atLanguage },
  ])('asks $who for the language step', ({ user, read }) => {
    expect(setupStepOwed(user, [], read)).toBe('language');
  });

  it('asks an owner whose company resumes at what-you-sell for that step', () => {
    expect(setupStepOwed(owner, [], atWhatYouSell)).toBe('what_you_sell');
  });

  it('asks an owner whose company resumes at the company profile for that step', () => {
    expect(setupStepOwed(owner, [], atCompanyProfile)).toBe('business_profile');
  });

  it('waits while an owner’s progress is still being read', () => {
    expect(setupStepOwed(owner, [], reading)).toBe('wait');
  });

  it.each([
    { why: 'the read got no answer: setup never holds a person', user: owner, read: unanswered },
    {
      why: 'the company resumes at invite_team, which has no screen yet',
      user: owner,
      read: atInviteTeam,
    },
    { why: 'the company resumes at ready, which has no screen yet', user: owner, read: atReady },
    { why: 'the roles do not manage them, at the second step', user: seller, read: atWhatYouSell },
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
    expect(setupStepOwed(user, [], read)).toBeNull();
  });

  it.each([
    { putOff: ['what_you_sell'], read: atWhatYouSell, asked: 'business_profile' },
    { putOff: ['language'], read: atLanguage, asked: 'what_you_sell' },
    { putOff: ['language', 'what_you_sell'], read: atLanguage, asked: 'business_profile' },
    { putOff: ['language'], read: atWhatYouSell, asked: 'what_you_sell' },
  ] as const)(
    'passes over $putOff put off for the session and asks for $asked',
    ({ putOff, read, asked }) => {
      expect(setupStepOwed(owner, putOff, read)).toBe(asked);
    },
  );

  it.each([
    {
      putOff: ['what_you_sell', 'business_profile'],
      read: atWhatYouSell,
      why: 'no later step has a screen',
    },
    {
      putOff: ['business_profile'],
      read: atCompanyProfile,
      why: 'the last step with a screen is put off',
    },
    { putOff: ['what_you_sell'], read: unanswered, why: 'the read got no answer' },
  ] as const)('asks for no step with $putOff put off, when $why', ({ putOff, read }) => {
    expect(setupStepOwed(owner, putOff, read)).toBeNull();
  });

  it('still waits for the read with a step put off', () => {
    expect(setupStepOwed(owner, ['what_you_sell'], reading)).toBe('wait');
  });
});
