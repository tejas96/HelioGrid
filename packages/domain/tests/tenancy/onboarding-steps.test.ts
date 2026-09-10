import { describe, expect, it } from 'vitest';
import {
  ONBOARDING_STEPS,
  pendingPromptPoints,
  promptPointTransition,
  recordStep,
  resumeStep,
} from '../../src/tenancy/onboarding-steps';

describe('resumeStep — a returning owner resumes exactly where they stopped (M01-10)', () => {
  it('starts at the first step with nothing recorded', () => {
    expect(resumeStep({})).toBe(ONBOARDING_STEPS[0]);
  });

  it.each([
    { states: { language: 'completed' }, next: 'what_you_sell' },
    { states: { language: 'skipped', what_you_sell: 'completed' }, next: 'business_profile' },
    {
      states: { language: 'completed', what_you_sell: 'completed', business_profile: 'skipped' },
      next: 'invite_team',
    },
    {
      states: {
        language: 'completed',
        what_you_sell: 'completed',
        business_profile: 'skipped',
        invite_team: 'skipped',
      },
      next: 'ready',
    },
  ] as const)('resumes at $next', ({ states, next }) => {
    expect(resumeStep(states)).toBe(next);
  });

  it('is closed once every step is answered, and a skipped step counts as answered', () => {
    let states = {};
    for (const step of ONBOARDING_STEPS) states = recordStep(states, step, 'skipped');
    expect(resumeStep(states)).toBeNull();
  });

  it('follows the sequence, not the order of answering: an unanswered earlier step comes first', () => {
    expect(resumeStep({ business_profile: 'completed' })).toBe('language');
  });
});

describe('recordStep — an answer replaces the last one, so a skipped step may still be completed', () => {
  it('replaces skipped with completed and keeps the rest', () => {
    const states = recordStep(
      { language: 'completed', what_you_sell: 'skipped' },
      'what_you_sell',
      'completed',
    );
    expect(states).toEqual({ language: 'completed', what_you_sell: 'completed' });
  });
});

describe('promptPointTransition — exactly one prompt-point per skipped fact (M01-29)', () => {
  it.each([
    { states: {}, next: 'fired', outcome: 'done' },
    { states: { bank_details: 'fired' }, next: 'fired', outcome: 'already-fired' },
    { states: { bank_details: 'declined' }, next: 'fired', outcome: 'already-answered' },
    { states: { bank_details: 'completed' }, next: 'fired', outcome: 'already-answered' },
    { states: {}, next: 'completed', outcome: 'not-fired' },
    { states: {}, next: 'declined', outcome: 'not-fired' },
    { states: { bank_details: 'fired' }, next: 'completed', outcome: 'done' },
    { states: { bank_details: 'fired' }, next: 'declined', outcome: 'done' },
    { states: { bank_details: 'declined' }, next: 'completed', outcome: 'already-answered' },
    { states: { bank_details: 'completed' }, next: 'declined', outcome: 'already-answered' },
  ] as const)('$states → $next is $outcome', ({ states, next, outcome }) => {
    expect(promptPointTransition(states, 'bank_details', next).outcome).toBe(outcome);
  });

  it('records the new state beside the others and touches no other fact', () => {
    const fired = promptPointTransition({ catalog: 'declined' }, 'bank_details', 'fired');
    expect(fired).toEqual({
      outcome: 'done',
      states: { catalog: 'declined', bank_details: 'fired' },
    });
  });
});

describe('pendingPromptPoints — absent and never fired', () => {
  it('lists an absent fact that never fired, and no fact that fired, was declined or is present', () => {
    expect(
      pendingPromptPoints({ company_profile: 'fired', payment_terms: 'declined' }, [
        'company_profile',
        'payment_terms',
        'bank_details',
      ]),
    ).toEqual(['bank_details']);
    expect(pendingPromptPoints({}, [])).toEqual([]);
  });
});
