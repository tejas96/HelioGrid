import { describe, expect, it } from 'vitest';
import type { SessionUser } from '../../src/auth/session';
import { setupStepOwed } from '../../src/auth/setup-step';
import type { Read } from '../../src/shell/read';
import type { StepStates } from '../../src/tenancy/onboarding-steps';

const person = {
  id: '8f0c2d1e-0000-4000-8000-0000000000a1',
  name: 'Priya Kulkarni',
  phoneE164: '+919876543210',
  interfaceLanguage: 'en',
  unitPreference: 'metric',
} as const;
const TENANT_ID = '8f0c2d1e-0000-4000-8000-000000000001';
const owner: SessionUser = { ...person, tenant: { id: TENANT_ID, roles: ['epc_owner'] } };
const ownerWhoSells: SessionUser = {
  ...person,
  tenant: { id: TENANT_ID, roles: ['sales_executive', 'epc_owner'] },
};
const seller: SessionUser = { ...person, tenant: { id: TENANT_ID, roles: ['sales_executive'] } };
const withoutCompany: SessionUser = { ...person, tenant: null };

const reading: Read<StepStates> = { kind: 'loading' };
const unanswered: Read<StepStates> = { kind: 'failed', failure: 'no_connection', retry: () => {} };
const at = (value: StepStates): Read<StepStates> => ({ kind: 'ready', value });
const inviteTeamSteps: StepStates = {
  language: 'completed',
  what_you_sell: 'completed',
  business_profile: 'skipped',
};
const readySteps: StepStates = { ...inviteTeamSteps, invite_team: 'skipped' };
const atLanguage = at({});
const atWhatYouSell = at({ language: 'completed' });
const atCompanyProfile = at({ language: 'completed', what_you_sell: 'completed' });
const atInviteTeam = at(inviteTeamSteps);
const atReady = at(readySteps);
const closed = at({ ...readySteps, ready: 'completed' });
const closedFromTeam = at({ ...readySteps, ready: 'skipped' });

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

  it('asks an owner whose company resumes at invite_team for the invite step', () => {
    expect(setupStepOwed(owner, [], atInviteTeam)).toBe('invite_team');
  });

  it('asks an owner whose company answered invite_team for the ready step', () => {
    expect(setupStepOwed(owner, [], atReady)).toBe('ready');
  });

  it('waits while an owner’s progress is still being read', () => {
    expect(setupStepOwed(owner, [], reading)).toBe('wait');
  });

  it.each([
    { why: 'the read got no answer: setup never holds a person', user: owner, read: unanswered },
    { why: 'the roles do not manage them, at the ready step', user: seller, read: atReady },
    { why: 'the roles do not manage them, at the second step', user: seller, read: atWhatYouSell },
    { why: 'every step is answered', user: owner, read: closed },
    { why: 'ready was skipped through Open Team', user: owner, read: closedFromTeam },
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
    { putOff: ['what_you_sell', 'business_profile'], read: atWhatYouSell, asked: 'invite_team' },
    { putOff: ['business_profile'], read: atCompanyProfile, asked: 'invite_team' },
    { putOff: ['invite_team'], read: atInviteTeam, asked: 'ready' },
  ] as const)(
    'passes over $putOff put off for the session and asks for $asked',
    ({ putOff, read, asked }) => {
      expect(setupStepOwed(owner, putOff, read)).toBe(asked);
    },
  );

  it.each([
    {
      putOff: ['what_you_sell', 'business_profile', 'invite_team', 'ready'],
      read: atWhatYouSell,
      why: 'every later step is put off',
    },
    {
      putOff: ['ready'],
      read: atReady,
      why: 'the last step is put off',
    },
    { putOff: ['what_you_sell'], read: unanswered, why: 'the read got no answer' },
  ] as const)('asks for no step with $putOff put off, when $why', ({ putOff, read }) => {
    expect(setupStepOwed(owner, putOff, read)).toBeNull();
  });

  it('still waits for the read with a step put off', () => {
    expect(setupStepOwed(owner, ['what_you_sell'], reading)).toBe('wait');
  });
});
