import { describe, expect, it } from 'vitest';
import {
  INITIAL_INVITE_LANDING,
  type InviteFacts,
  type InviteLandingEvent,
  type InviteLandingState,
  inviteLandingReducer,
} from '../../src/auth/invite-landing';
import { inviteLandingFrame } from '../../src/auth/invite-landing-frame';
import { INITIAL_LOGIN_STATE } from '../../src/auth/login-state';

const NOW = Date.UTC(2026, 9, 21, 9, 0, 0);
const SECOND = 1000;
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

describe('the read — the link opens on a read, and only a live invite asks for a code', () => {
  it('opens loading, with the read asked for and no code asked for', () => {
    expect(INITIAL_INVITE_LANDING.pending).toEqual({ kind: 'read' });
    expect(INITIAL_INVITE_LANDING.code.pending).toBeNull();
    expect(inviteLandingFrame(INITIAL_INVITE_LANDING).kind).toBe('loading');
  });

  it('pending asks a code on the invite’s phone, expired and gone ask none', () => {
    expect(opened.code.pending).toEqual({
      kind: 'request',
      phone: INVITE.phoneE164,
      channel: 'sms',
    });
    expect(opened.code.phone).toBe(INVITE.phoneE164);
    for (const read of [{ kind: 'expired', invite: INVITE }, { kind: 'gone' }] as const) {
      expect(run({ type: 'read-ended', read }).code.pending).toBeNull();
    }
  });

  it.each([
    ['pending', { kind: 'pending', invite: INVITE }, 'landing'],
    ['expired', { kind: 'expired', invite: INVITE }, 'expired'],
    ['gone', { kind: 'gone' }, 'empty'],
    ['unread', { kind: 'unread' }, 'load-error'],
  ] as const)('a %s read draws %s', (_, read, frame) => {
    expect(inviteLandingFrame(run({ type: 'read-ended', read })).kind).toBe(frame);
  });

  it('Try again after a read that got no answer reads again, and nothing else is pressable there', () => {
    const unread = run({ type: 'read-ended', read: { kind: 'unread' } });
    expect(inviteLandingReducer(unread, { type: 'verify' })).toBe(unread);
    const again = inviteLandingReducer(unread, { type: 'try-again' });
    expect(again.pending).toEqual({ kind: 'read' });
    expect(inviteLandingFrame(again).kind).toBe('loading');
  });

  it('a second read answer is not heard once the first was', () => {
    expect(inviteLandingReducer(opened, { type: 'read-ended', read: { kind: 'gone' } })).toBe(
      opened,
    );
  });
});

describe('the code — every code event is the door’s own (brief decision 5)', () => {
  it('a sent code starts the door’s 30 s wait, and Join is live', () => {
    expect(sent.code.cooldownLeft).toBe(30);
    const frame = inviteLandingFrame(sent);
    expect(frame.primary).toEqual({ press: 'verify', label: 'join' });
    expect(frame.joinHeld).toBe(false);
    expect(frame.code?.resend).toEqual({ kind: 'wait' });
  });

  it('a code filled whole reads as filled from the SMS', () => {
    expect(inviteLandingFrame(sent).code?.kind).toBe('waiting');
    expect(inviteLandingFrame(typed).code?.kind).toBe('filled');
  });

  it('Join with the code asks the door’s verify with that code', () => {
    expect(joining.code.pending).toEqual({ kind: 'verify', code: CODE });
    expect(inviteLandingFrame(joining).busy).toBe(true);
  });

  it('a mismatch sets the field’s error and the tries, nothing else', () => {
    const wrong = inviteLandingReducer(joining, {
      type: 'join-ended',
      result: { step: 'code', outcome: 'mismatch', triesLeft: 3 },
    });
    const frame = inviteLandingFrame(wrong);
    expect(frame.kind).toBe('landing');
    expect(frame.code?.codeError).toBe('wrong');
    expect(frame.wrongTries).toBe(2);
    expect(frame.joinFailed).toBe(false);
    expect(wrong.invite).toBe(joining.invite);
    expect(wrong.code.code).toBe(CODE);
  });

  it.each([
    ['locked', 'locked'],
    ['invalidated', 'used-up'],
    ['expired', 'expired'],
  ] as const)('a %s answer draws the door’s %s frame', (outcome, kind) => {
    const ended = inviteLandingReducer(joining, {
      type: 'join-ended',
      result: { step: 'code', outcome, triesLeft: 0 },
    });
    expect(inviteLandingFrame(ended).code?.kind).toBe(kind);
  });

  it('a cooldown answer draws the wait and holds Join', () => {
    const reloaded = inviteLandingReducer(opened, {
      type: 'request-ended',
      outcome: 'cooldown',
      now: NOW,
    });
    const frame = inviteLandingFrame(reloaded);
    expect(frame.kind).toBe('landing');
    expect(frame.code?.resend).toEqual({ kind: 'wait' });
    expect(frame.joinHeld).toBe(true);
    const pressed = inviteLandingReducer(
      inviteLandingReducer(reloaded, { type: 'code-typed', code: CODE }),
      { type: 'verify' },
    );
    expect(pressed.code.pending).toBeNull();
  });

  it('after the wait, the resend sends a code this page owns and Join is live again', () => {
    const reloaded = inviteLandingReducer(opened, {
      type: 'request-ended',
      outcome: 'cooldown',
      now: NOW,
    });
    const open = inviteLandingReducer(reloaded, { type: 'tick', now: NOW + 30 * SECOND });
    const resent = inviteLandingReducer(open, { type: 'resend' });
    expect(resent.code.pending).toEqual({
      kind: 'request',
      phone: INVITE.phoneE164,
      channel: 'sms',
    });
    const answered = inviteLandingReducer(resent, {
      type: 'request-ended',
      outcome: 'sent',
      now: NOW + 31 * SECOND,
    });
    expect(inviteLandingFrame(answered).joinHeld).toBe(false);
  });

  it('the code’s events are not heard before the invite is read', () => {
    expect(run({ type: 'code-typed', code: CODE })).toBe(INITIAL_INVITE_LANDING);
  });
});

describe('the join — after a right code', () => {
  const failed = inviteLandingReducer(joining, {
    type: 'join-ended',
    result: { step: 'join', outcome: 'failed' },
  });

  it('a join that fails keeps the invite and the code, held read-only, with Try again', () => {
    const frame = inviteLandingFrame(failed);
    expect(frame.kind).toBe('landing');
    expect(frame.joinFailed).toBe(true);
    expect(frame.codeField).toBe('read-only');
    expect(frame.primary).toEqual({ press: 'try-again', label: 'try-again' });
    expect(failed.code.code).toBe(CODE);
    expect(failed.code.pending).toBeNull();
  });

  it('Try again sends the join alone, never the code again', () => {
    const retried = inviteLandingReducer(failed, { type: 'try-again' });
    expect(retried.pending).toEqual({ kind: 'retry-join' });
    expect(retried.code.pending).toBeNull();
    expect(inviteLandingReducer(failed, { type: 'verify' })).toBe(failed);
  });

  it('INVITE_EXPIRED draws expired, CONFLICT hands off', () => {
    const expired = inviteLandingReducer(joining, {
      type: 'join-ended',
      result: { step: 'join', outcome: 'expired' },
    });
    expect(inviteLandingFrame(expired).kind).toBe('expired');
    expect(inviteLandingFrame(expired).code).toBeNull();
    const handedOff = inviteLandingReducer(joining, {
      type: 'join-ended',
      result: { step: 'join', outcome: 'joined' },
    });
    expect(handedOff.join).toBe('joined');
    expect(inviteLandingFrame(handedOff).busy).toBe(true);
  });

  it('a retried join that succeeds hands off', () => {
    const retried = inviteLandingReducer(failed, { type: 'try-again' });
    const joined = inviteLandingReducer(retried, {
      type: 'join-ended',
      result: { step: 'join', outcome: 'joined' },
    });
    expect(joined.join).toBe('joined');
    expect(joined.pending).toBeNull();
  });
});

describe('the ask — an expired invite offers one tap that tells the inviter', () => {
  const expired = run({ type: 'read-ended', read: { kind: 'expired', invite: INVITE } });

  it('expired offers the ask and no code', () => {
    const frame = inviteLandingFrame(expired);
    expect(frame.primary).toEqual({ press: 'ask', label: 'ask' });
    expect(frame.code).toBeNull();
  });

  it.each([
    ['asked', 'reinvite-requested', null],
    ['unreached', 'expired', 'unreached'],
    ['failed', 'expired', 'failed'],
    ['gone', 'empty', null],
  ] as const)('an ask answered %s draws %s', (outcome, kind, askRefused) => {
    const asking = inviteLandingReducer(expired, { type: 'ask' });
    expect(asking.pending).toEqual({ kind: 'ask' });
    const frame = inviteLandingFrame(inviteLandingReducer(asking, { type: 'ask-ended', outcome }));
    expect(frame.kind).toBe(kind);
    expect(frame.askRefused).toBe(askRefused);
  });

  it('asking again after a failed ask clears the refusal while it runs', () => {
    const failed = inviteLandingReducer(inviteLandingReducer(expired, { type: 'ask' }), {
      type: 'ask-ended',
      outcome: 'failed',
    });
    const again = inviteLandingReducer(failed, { type: 'ask' });
    expect(inviteLandingFrame(again).askRefused).toBeNull();
    expect(again.pending).toEqual({ kind: 'ask' });
  });

  it('the ask is not pressable on a live invite', () => {
    expect(inviteLandingReducer(sent, { type: 'ask' })).toBe(sent);
  });

  it('reinvite-requested offers no code', () => {
    const asked = inviteLandingReducer(inviteLandingReducer(expired, { type: 'ask' }), {
      type: 'ask-ended',
      outcome: 'asked',
    });
    expect(inviteLandingFrame(asked).code).toBeNull();
    expect(asked.code).toEqual(INITIAL_LOGIN_STATE);
  });
});
