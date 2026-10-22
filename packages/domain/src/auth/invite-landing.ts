/**
 * The invite landing's flow (`SCR-M01-08`, `M01-13`), decided once for both platforms (Law 11):
 * the read of the link, the code sent on arrival, the one act that joins, the decline a wrong
 * person confirms, and the ask an expired invite offers. Every code event is the door's own
 * (`loginReducer`), so the gap, the caps, the lock and the wrong tries are the front door's, never
 * a second copy (brief decision 5).
 */
import type { RolePreset } from '../authz/roles';
import { loginReducer } from './login-reducer';
import {
  INITIAL_LOGIN_STATE,
  type LoginEvent,
  type LoginState,
  type OtpVerifyOutcome,
} from './login-state';

/** The invite as the landing reads it: who asked, to which company, the number it is keyed to, the roles. */
export interface InviteFacts {
  readonly inviterName: string;
  readonly companyName: string;
  readonly phoneE164: string;
  readonly roles: readonly RolePreset[];
}

/**
 * How the read of the link ended. `gone` — no invite behind it (used, declined, revoked or
 * unknown); `unread` — no answer, or the server failed, so nothing about the invite is known.
 */
export type InviteRead =
  | { readonly kind: 'pending' | 'expired'; readonly invite: InviteFacts }
  | { readonly kind: 'gone' | 'unread' };

/**
 * How a join ended after the code was right: `joined` — a member, or one already (the verified
 * session is handed in either way); `expired` — the invite ran out between the read and the join;
 * `failed` — nothing joined, and the invite still works.
 */
export type InviteJoinOutcome = 'joined' | 'expired' | 'failed';

/** A join's answer: the code's own refusal, the door's to draw, or how the join itself ended. */
export type InviteJoinResult =
  | {
      readonly step: 'code';
      readonly outcome: Exclude<OtpVerifyOutcome, 'verified'>;
      readonly triesLeft: number;
    }
  | { readonly step: 'join'; readonly outcome: InviteJoinOutcome };

/**
 * How the ask on an expired invite ended: `asked` — the inviter is told; `gone` — the invite was
 * withdrawn meanwhile; `unreached` — no answer; `failed` — the server refused or failed.
 */
export type InviteAskOutcome = 'asked' | 'gone' | 'unreached' | 'failed';

/**
 * How a decline ended: `declined` — the link is closed and the owners are told (a second decline
 * answers the same); `gone` — no invite behind the link; `stale` — the invite is not live any more
 * (it ran out, or it was used or withdrawn), so the link is read again; `unreached` — no answer;
 * `failed` — the server refused or failed.
 */
export type InviteDeclineOutcome = 'declined' | 'gone' | 'stale' | 'unreached' | 'failed';

/** A round trip the landing asked for; the code's own trips ride on `code.pending`. */
export type InviteCall =
  | { readonly kind: 'read' }
  | { readonly kind: 'retry-join' }
  | { readonly kind: 'ask' }
  | { readonly kind: 'decline' };

export interface InviteLandingState {
  /** `declined` — this page closed the link; the invite is kept so the after-state names the inviter. */
  readonly read: 'loading' | InviteRead['kind'] | 'declined';
  readonly invite: InviteFacts | null;
  /** The door's code facts on the invite's number. */
  readonly code: LoginState;
  /** `failed` keeps the right code held, and Try again sends the join alone. */
  readonly join: 'none' | 'failed' | 'joined';
  readonly ask: 'none' | Exclude<InviteAskOutcome, 'gone'>;
  /** The decline's confirm: open, or open again after a decline that did not go through (brief ruling 19). */
  readonly decline: 'none' | 'confirming' | 'unreached' | 'failed';
  readonly pending: InviteCall | null;
}

type CodeEvent = Extract<
  LoginEvent,
  { type: 'code-typed' | 'verify' | 'resend' | 'request-ended' | 'tick' }
>;

export type InviteLandingEvent =
  | CodeEvent
  | { readonly type: 'read-ended'; readonly read: InviteRead }
  | { readonly type: 'join-ended'; readonly result: InviteJoinResult }
  | { readonly type: 'ask-ended'; readonly outcome: InviteAskOutcome }
  | { readonly type: 'decline-ended'; readonly outcome: InviteDeclineOutcome }
  | { readonly type: 'try-again' }
  | { readonly type: 'ask' }
  | { readonly type: 'decline' | 'keep' | 'confirm-decline' };

/** The link opens on its read; nothing is pressable until it answers. */
export const INITIAL_INVITE_LANDING: InviteLandingState = {
  read: 'loading',
  invite: null,
  code: INITIAL_LOGIN_STATE,
  join: 'none',
  ask: 'none',
  decline: 'none',
  pending: { kind: 'read' },
};

export function inviteLandingReducer(
  state: InviteLandingState,
  event: InviteLandingEvent,
): InviteLandingState {
  switch (event.type) {
    case 'read-ended':
      return state.pending?.kind === 'read' ? readEnded(event.read) : state;
    case 'join-ended':
      return joinEnded(state, event.result);
    case 'ask-ended':
      return askEnded(state, event.outcome);
    case 'try-again':
      return tryAgain(state);
    case 'ask':
      if (state.read !== 'expired' || state.pending !== null) return state;
      return { ...state, ask: 'none', pending: { kind: 'ask' } };
    case 'decline':
    case 'keep':
    case 'confirm-decline':
      return onDecline(state, event.type);
    case 'decline-ended':
      return declineEnded(state, event.outcome);
    case 'verify':
      return joinHeld(state) || state.join !== 'none' || state.decline !== 'none'
        ? state
        : onCode(state, event);
    default:
      return onCode(state, event);
  }
}

/** The code's events are heard only on a live invite, and not while a join is held or done. */
function onCode(state: InviteLandingState, event: CodeEvent): InviteLandingState {
  if (state.read !== 'pending' || state.join !== 'none') return state;
  const code = loginReducer(state.code, event);
  return code === state.code ? state : { ...state, code };
}

/**
 * Opening the link sends the code (brief decision 1): the invite is keyed to the number, so there
 * is no number step and no Send code tap. An expired or gone invite asks for none.
 */
function readEnded(read: InviteRead): InviteLandingState {
  const settled = { ...INITIAL_INVITE_LANDING, read: read.kind, pending: null };
  if (!('invite' in read)) return settled;
  if (read.kind === 'expired') return { ...settled, invite: read.invite };
  const phone = read.invite.phoneE164;
  return {
    ...settled,
    invite: read.invite,
    code: {
      ...INITIAL_LOGIN_STATE,
      step: 'otp',
      phone,
      pending: { kind: 'request', phone, channel: 'sms' },
    },
  };
}

/**
 * A reload inside the gap is refused a code (`cooldown`), and the code the first SMS carried
 * belongs to a challenge this page never opened: Join waits until a send of its own answers.
 */
export function joinHeld(state: InviteLandingState): boolean {
  return state.code.sends === 0;
}

function joinEnded(state: InviteLandingState, result: InviteJoinResult): InviteLandingState {
  const asked = state.code.pending?.kind === 'verify' || state.pending?.kind === 'retry-join';
  if (!asked) return state;
  if (result.step === 'code') {
    const { outcome, triesLeft } = result;
    const code = loginReducer(state.code, { type: 'verify-ended', outcome, triesLeft });
    // A check with no answer, or one the server failed, spent nothing: the code is held, so the
    // frame's Try again sends it again rather than an empty field.
    const unspent = outcome === 'unreached' || outcome === 'failed';
    return { ...state, code: unspent ? { ...code, code: state.code.code } : code };
  }
  const settled = { ...state, pending: null, code: { ...state.code, pending: null } };
  switch (result.outcome) {
    case 'joined':
      return { ...settled, join: 'joined' };
    case 'failed':
      return { ...settled, join: 'failed' };
    case 'expired':
      return { ...settled, read: 'expired', join: 'none', code: INITIAL_LOGIN_STATE };
  }
}

function askEnded(state: InviteLandingState, outcome: InviteAskOutcome): InviteLandingState {
  if (state.pending?.kind !== 'ask') return state;
  if (outcome === 'gone') return { ...INITIAL_INVITE_LANDING, read: 'gone', pending: null };
  return { ...state, pending: null, ask: outcome };
}

/**
 * The wrong person may decline a live invite at any point but while a code check or a join is out,
 * or once the join is done: the decline would race the accept (`S1.wrong.2`).
 */
export function declineOffered(state: InviteLandingState): boolean {
  if (state.read !== 'pending' || state.join === 'joined') return false;
  return state.code.pending?.kind !== 'verify' && state.pending?.kind !== 'retry-join';
}

/** The control opens the confirm; Keep closes it unless the decline is out; Decline sends it once. */
function onDecline(
  state: InviteLandingState,
  press: 'decline' | 'keep' | 'confirm-decline',
): InviteLandingState {
  if (press === 'decline') {
    return declineOffered(state) && state.decline === 'none'
      ? { ...state, decline: 'confirming' }
      : state;
  }
  if (state.decline === 'none') return state;
  if (press === 'keep') {
    return state.pending?.kind === 'decline' ? state : { ...state, decline: 'none' };
  }
  return state.pending !== null
    ? state
    : { ...state, decline: 'confirming', pending: { kind: 'decline' } };
}

function declineEnded(
  state: InviteLandingState,
  outcome: InviteDeclineOutcome,
): InviteLandingState {
  if (state.pending?.kind !== 'decline') return state;
  switch (outcome) {
    case 'declined':
      return { ...INITIAL_INVITE_LANDING, read: 'declined', invite: state.invite, pending: null };
    case 'gone':
      return { ...INITIAL_INVITE_LANDING, read: 'gone', pending: null };
    // The fresh read draws what the link is now: expired, or no invite behind it.
    case 'stale':
      return INITIAL_INVITE_LANDING;
    case 'unreached':
    case 'failed':
      return { ...state, pending: null, decline: outcome };
  }
}

/** After a read with no answer it reads again; after a failed join it sends the join alone. */
function tryAgain(state: InviteLandingState): InviteLandingState {
  if (state.pending !== null || state.decline !== 'none') return state;
  if (state.read === 'unread') return { ...INITIAL_INVITE_LANDING };
  if (state.join === 'failed') return { ...state, pending: { kind: 'retry-join' } };
  return state;
}
