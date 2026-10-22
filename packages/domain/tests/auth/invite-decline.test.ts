import { describe, expect, it } from 'vitest';
import {
  INITIAL_INVITE_LANDING,
  type InviteFacts,
  type InviteLandingEvent,
  type InviteLandingState,
  inviteLandingReducer,
} from '../../src/auth/invite-landing';
import { inviteLandingFrame } from '../../src/auth/invite-landing-frame';

const NOW = Date.UTC(2026, 9, 22, 9, 0, 0);
const CODE = '123456';
const INVITE: InviteFacts = {
  inviterName: 'Rajesh Kulkarni',
  companyName: 'Suryodaya Solar',
  phoneE164: '+919845027746',
  roles: ['sales_executive'],
};

function played(state: InviteLandingState, ...events: readonly InviteLandingEvent[]) {
  return events.reduce(inviteLandingReducer, state);
}
const typed = played(
  INITIAL_INVITE_LANDING,
  { type: 'read-ended', read: { kind: 'pending', invite: INVITE } },
  { type: 'request-ended', outcome: 'sent', now: NOW },
  { type: 'code-typed', code: CODE },
);
const confirming = played(typed, { type: 'decline' });
const sending = played(confirming, { type: 'confirm-decline' });

describe('the confirm — opened by the control, closed only by Keep or Decline (brief ruling 11)', () => {
  it('the control opens the confirm on the live invite', () => {
    expect(inviteLandingFrame(typed).decline).toEqual({
      confirming: false,
      sending: false,
      refused: null,
      held: false,
    });
    expect(inviteLandingFrame(confirming).decline?.confirming).toBe(true);
  });

  it('Keep closes it, and the landing is as it was, the typed code kept', () => {
    expect(played(confirming, { type: 'keep' })).toEqual(typed);
  });

  it('while the confirm is open no join starts and no Try again is heard', () => {
    expect(played(confirming, { type: 'verify' })).toBe(confirming);
    const failedJoin = played(
      typed,
      { type: 'verify' },
      { type: 'join-ended', result: { step: 'join', outcome: 'failed' } },
      { type: 'decline' },
    );
    expect(played(failedJoin, { type: 'try-again' })).toBe(failedJoin);
  });

  it.each([
    ['expired', { kind: 'expired', invite: INVITE }],
    ['gone', { kind: 'gone' }],
    ['unread', { kind: 'unread' }],
  ] as const)('a %s link offers no decline', (_, read) => {
    const state = played(INITIAL_INVITE_LANDING, { type: 'read-ended', read });
    expect(inviteLandingFrame(state).decline).toBeNull();
    expect(played(state, { type: 'decline' })).toBe(state);
  });
});

describe('the decline — sent once, and every answer drawn', () => {
  it('Decline sends once, and the landing’s act does not spin behind the confirm', () => {
    expect(sending.pending).toEqual({ kind: 'decline' });
    const frame = inviteLandingFrame(sending);
    expect(frame.decline).toMatchObject({ confirming: true, sending: true });
    expect(frame.busy).toBe(false);
  });

  it('a second confirm while one is out sends nothing', () => {
    expect(played(sending, { type: 'confirm-decline' })).toBe(sending);
  });

  it('Keep waits while the decline is out', () => {
    expect(played(sending, { type: 'keep' })).toBe(sending);
  });

  it('a declined link is closed, the inviter still named, and nothing reopens it', () => {
    const declined = played(sending, { type: 'decline-ended', outcome: 'declined' });
    const frame = inviteLandingFrame(declined);
    expect(frame.kind).toBe('declined');
    expect(frame.decline).toBeNull();
    expect(frame.code).toBeNull();
    expect(declined.invite).toEqual(INVITE);
    expect(declined.code.pending).toBeNull();
    for (const event of [{ type: 'decline' }, { type: 'verify' }] as const) {
      expect(played(declined, event)).toBe(declined);
    }
    // The first SMS's answer, arriving after the decline, opens nothing again.
    expect(played(declined, { type: 'request-ended', outcome: 'sent', now: NOW })).toBe(declined);
  });

  it.each(['unreached', 'failed'] as const)(
    'a decline with no answer or a server failure keeps the confirm open with its reason (%s)',
    (outcome) => {
      const refused = played(sending, { type: 'decline-ended', outcome });
      expect(inviteLandingFrame(refused).decline).toEqual({
        confirming: true,
        sending: false,
        refused: outcome,
        held: false,
      });
      const again = played(refused, { type: 'confirm-decline' });
      expect(again.pending).toEqual({ kind: 'decline' });
      expect(inviteLandingFrame(again).decline?.refused).toBeNull();
      expect(played(refused, { type: 'keep' }).decline).toBe('none');
    },
  );

  it('a link gone meanwhile draws empty', () => {
    const gone = played(sending, { type: 'decline-ended', outcome: 'gone' });
    expect(inviteLandingFrame(gone).kind).toBe('empty');
    expect(gone.pending).toBeNull();
  });

  it('a link no longer live is read again', () => {
    const stale = played(sending, { type: 'decline-ended', outcome: 'stale' });
    expect(stale).toEqual(INITIAL_INVITE_LANDING);
    expect(inviteLandingFrame(stale).kind).toBe('loading');
  });

  it('an answer no decline asked for is not heard', () => {
    expect(played(confirming, { type: 'decline-ended', outcome: 'declined' })).toBe(confirming);
  });
});

describe('the control waits while a join is out or done (AC-20)', () => {
  const joining = played(typed, { type: 'verify' });
  const joined = played(joining, {
    type: 'join-ended',
    result: { step: 'join', outcome: 'joined' },
  });
  const failed = played(joining, {
    type: 'join-ended',
    result: { step: 'join', outcome: 'failed' },
  });
  const retrying = played(failed, { type: 'try-again' });

  it.each([
    ['a code check or join in flight', joining],
    ['the join done', joined],
    ['a join sent again', retrying],
  ] as const)('the control waits with %s', (_, state) => {
    expect(inviteLandingFrame(state).decline?.held).toBe(true);
    expect(played(state, { type: 'decline' })).toBe(state);
  });

  it('after a failed join the control is live again (`m-error`)', () => {
    expect(inviteLandingFrame(failed).decline?.held).toBe(false);
    expect(played(failed, { type: 'decline' }).decline).toBe('confirming');
  });

  it('while the code on arrival is still sending the control is live', () => {
    const arriving = played(INITIAL_INVITE_LANDING, {
      type: 'read-ended',
      read: { kind: 'pending', invite: INVITE },
    });
    expect(arriving.code.pending?.kind).toBe('request');
    expect(inviteLandingFrame(arriving).decline?.held).toBe(false);
  });
});
