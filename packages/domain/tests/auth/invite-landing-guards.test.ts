import { describe, expect, it } from 'vitest';
import {
  INITIAL_INVITE_LANDING,
  type InviteFacts,
  type InviteLandingEvent,
  type InviteLandingState,
  inviteLandingReducer,
} from '../../src/auth/invite-landing';
import { inviteLandingFrame } from '../../src/auth/invite-landing-frame';

const NOW = Date.UTC(2026, 9, 21, 9, 0, 0);
const _SECOND = 1000;
const CODE = '123456';
const INVITE: InviteFacts = {
  inviterName: 'Rajesh Kulkarni',
  companyName: 'Suryodaya Solar',
  phoneE164: '+919845027746',
  roles: ['sales_executive'],
};

function run(...events: readonly InviteLandingEvent[]): InviteLandingState {
  return events.reduce(inviteLandingReducer, INITIAL_INVITE_LANDING);
}
const opened = run({ type: 'read-ended', read: { kind: 'pending', invite: INVITE } });
const sent = inviteLandingReducer(opened, { type: 'request-ended', outcome: 'sent', now: NOW });
const typed = inviteLandingReducer(sent, { type: 'code-typed', code: CODE });
const joining = inviteLandingReducer(typed, { type: 'verify' });

describe('answers nobody asked for, and presses while a call runs, change nothing', () => {
  const asking = run(
    { type: 'read-ended', read: { kind: 'expired', invite: INVITE } },
    { type: 'ask' },
  );
  const failed = inviteLandingReducer(joining, {
    type: 'join-ended',
    result: { step: 'join', outcome: 'failed' },
  });
  const retrying = inviteLandingReducer(failed, { type: 'try-again' });

  it.each([
    [
      'a join answer with no join asked',
      sent,
      { type: 'join-ended', result: { step: 'join', outcome: 'joined' } },
    ],
    ['an ask answer with no ask asked', sent, { type: 'ask-ended', outcome: 'asked' }],
    ['Try again while the retry runs', retrying, { type: 'try-again' }],
    ['the ask while one runs', asking, { type: 'ask' }],
    ['Join while the join runs', joining, { type: 'verify' }],
    ['Try again on a live invite with nothing failed', sent, { type: 'try-again' }],
  ] as const)('%s', (_, state, event) => {
    expect(inviteLandingReducer(state, event as InviteLandingEvent)).toBe(state);
  });
});

describe('a code check that spent nothing keeps the code for Try again', () => {
  it.each(['unreached', 'failed'] as const)(
    '%s keeps the code, and Try again sends it again',
    (outcome) => {
      const ended = inviteLandingReducer(joining, {
        type: 'join-ended',
        result: { step: 'code', outcome, triesLeft: 5 },
      });
      expect(ended.code.code).toBe(CODE);
      const frame = inviteLandingFrame(ended);
      expect(frame.primary?.press).toBe('verify');
      expect(inviteLandingReducer(ended, { type: 'verify' }).code.pending).toEqual({
        kind: 'verify',
        code: CODE,
      });
    },
  );

  it('a wrong code is not held: the door clears what it refused', () => {
    const ended = inviteLandingReducer(joining, {
      type: 'join-ended',
      result: { step: 'code', outcome: 'expired', triesLeft: 5 },
    });
    expect(ended.code.code).toBe('');
  });
});

describe('the code on arrival', () => {
  it('while it sends, the resend waits its whole gap', () => {
    expect(inviteLandingFrame(opened).code?.resend).toEqual({ kind: 'wait' });
  });
});
