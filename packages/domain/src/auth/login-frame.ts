/**
 * The code step's frame — WHAT each fact looks like, decided once for both doors (Law 11):
 * which frame the facts add up to, which controls it offers and what each control does. The
 * words are `packages/i18n`'s, keyed by the vocabularies here; the screen draws and decides
 * nothing.
 */
import type {
  CodeError,
  CodeField,
  FootLine,
  FrameControl,
  FrameExplainer,
  GoogleLabel,
  ResendSlot,
  SubLine,
} from './login-frame-parts';
import type { LoginState } from './login-state';

/** The frames, in the order a fact wins: a refused check over a refused request over the ordinary step. */
export type FrameKind =
  | 'google-phone-taken'
  | 'auth-error'
  | 'locked'
  | 'call-offer'
  | 'capped'
  | 'delivery-failed'
  | 'call-not-placed'
  | 'request-failed'
  | 'call-request-failed'
  | 'expired'
  | 'used-up'
  | 'wrong'
  | 'filled'
  | 'waiting'
  | 'entry';

export interface LoginFrame {
  readonly kind: FrameKind;
  readonly sub: SubLine;
  readonly codeError: CodeError | null;
  readonly code: CodeField;
  readonly primary: FrameControl | null;
  readonly resend: ResendSlot | null;
  /** The "Get the code by call" block — the person's own choice, never HelioGrid's (`M01-03`). */
  readonly callOffered: boolean;
  readonly foot: FootLine | null;
  /** The rule behind the frame, behind an Explainer beside its title; `null` when none. */
  readonly explainer: FrameExplainer | null;
  /** The Google control under the frame — the SMS lock does not close Google (`M01-04`). */
  readonly google: GoogleLabel | null;
  /** The Google login this code links, named under the number; `null` when it links none. */
  readonly linkedEmail: string | null;
}

/** What a frame decides for itself; the Google parts most frames lack are filled in once. */
type FrameBody = Omit<LoginFrame, 'google' | 'linkedEmail' | 'explainer'> &
  Partial<Pick<LoginFrame, 'google' | 'explainer'>>;

export function frameKindOf(state: LoginState): FrameKind {
  return refusalFrameOf(state) ?? codeFrameOf(state);
}

/** A refused check or a refused request owns the frame before any ordinary step is read. */
function refusalFrameOf(state: LoginState): FrameKind | null {
  const byCall = state.channel === 'voice';
  if (state.googleEnded === 'phone-taken') return 'google-phone-taken';
  if (state.verify === 'failed') return 'auth-error';
  if (state.verify === 'locked' || state.request === 'locked') return 'locked';
  // A call the person chose but has not placed yet is offered before any SMS outcome is judged —
  // the route out of a failed send must lead somewhere.
  if (byCall && !state.placed) return 'call-offer';
  if (state.request === 'capped') return 'capped';
  if (state.request === 'delivery-failed') return byCall ? 'call-not-placed' : 'delivery-failed';
  if (state.request === 'failed') return byCall ? 'call-request-failed' : 'request-failed';
  return null;
}

function codeFrameOf(state: LoginState): FrameKind {
  if (state.verify === 'expired') return 'expired';
  if (state.verify === 'invalidated') return 'used-up';
  if (state.verify === 'mismatch') return 'wrong';
  if (state.filled) return 'filled';
  if (state.cooldownLeft > 0) return 'waiting';
  return 'entry';
}

/**
 * `googleOffered` says whether this door has a Google sheet behind it: a door without one — the
 * signup door, or a web build with no client id — draws no Google control, never a dead one.
 */
export function loginFrame(state: LoginState, googleOffered: boolean): LoginFrame {
  const { google = null, explainer = null, ...body } = FRAMES[frameKindOf(state)](state);
  return {
    ...body,
    explainer,
    google: googleOffered ? google : null,
    linkedEmail: state.google?.email ?? null,
  };
}

const VERIFY: FrameControl = { press: 'verify', label: 'verify' };
const SEND_AGAIN: FrameControl = { press: 'resend', label: 'send-again' };
const CALL_AGAIN: FrameControl = { press: 'resend', label: 'call-again' };
const WAIT: ResendSlot = { kind: 'wait' };
const NEW_CODE: ResendSlot = { kind: 'live', press: 'resend', label: 'send-new' };
const SMS_AGAIN: ResendSlot = { kind: 'live', press: 'sms', label: 'send-sms-again' };

function sentSub(state: LoginState): SubLine {
  return state.channel === 'voice' ? 'read-out' : 'sent-by-sms';
}
function triedSub(state: LoginState): SubLine {
  return state.channel === 'voice' ? 'tried-to-call' : 'tried-by-sms';
}
function shortError(state: LoginState): CodeError | null {
  return state.codeShort ? 'short' : null;
}
/** Inside the gap the slot shows the wait, because a request pressed there is not sent. */
function insideGap(state: LoginState, live: ResendSlot): ResendSlot {
  return state.cooldownLeft > 0 ? WAIT : live;
}

/** After a code died: a new one on the channel in use, and the other channel as the way across. */
function newCodeWays(state: LoginState): Pick<LoginFrame, 'primary' | 'resend' | 'callOffered'> {
  if (state.cooldownLeft > 0) return { primary: null, resend: WAIT, callOffered: false };
  if (state.channel === 'voice')
    return { primary: CALL_AGAIN, resend: SMS_AGAIN, callOffered: false };
  return { primary: { press: 'resend', label: 'send-new' }, resend: null, callOffered: true };
}

const NO_CODE = { codeError: null, code: 'closed' } as const;
const NO_WAYS = { primary: null, callOffered: false } as const;

const FRAMES: Record<FrameKind, (state: LoginState) => FrameBody> = {
  // The code matched, so it is shown spent and fine; the number signs in by it, and the Google
  // login waits for another account (`M01-02`: nothing is relinked behind the person).
  'google-phone-taken': () => ({
    kind: 'google-phone-taken',
    sub: 'correct-for',
    codeError: null,
    code: 'read-only',
    primary: { press: 'sign-in-by-number', label: 'sign-in-by-number' },
    resend: null,
    callOffered: false,
    foot: null,
    google: 'use-another',
  }),
  'auth-error': () => ({
    kind: 'auth-error',
    sub: 'checked-for',
    codeError: null,
    code: 'read-only',
    primary: { press: 'verify', label: 'try-again' },
    resend: null,
    callOffered: false,
    foot: 'auth-error',
  }),
  locked: () => ({
    kind: 'locked',
    sub: 'locked-for',
    codeError: null,
    code: 'absent',
    ...NO_WAYS,
    resend: null,
    foot: null,
    google: 'continue',
  }),
  // The cap counts every request on the number, a call included (`M01-04`), so no primary
  // pretends a call is a way in, and no resend waits on a gap: the title says how long.
  capped: (state) => ({
    kind: 'capped',
    sub: triedSub(state),
    ...NO_CODE,
    ...NO_WAYS,
    resend: null,
    foot: null,
    explainer: 'code-limits',
  }),
  'delivery-failed': () => ({
    kind: 'delivery-failed',
    sub: 'tried-by-sms',
    ...NO_CODE,
    primary: SEND_AGAIN,
    resend: null,
    callOffered: true,
    foot: null,
  }),
  'call-not-placed': (state) => ({
    kind: 'call-not-placed',
    sub: 'tried-to-call',
    ...NO_CODE,
    primary: CALL_AGAIN,
    resend: insideGap(state, SMS_AGAIN),
    callOffered: false,
    foot: null,
  }),
  'request-failed': () => ({
    kind: 'request-failed',
    sub: 'tried-by-sms',
    ...NO_CODE,
    primary: SEND_AGAIN,
    resend: null,
    callOffered: true,
    foot: null,
  }),
  'call-request-failed': (state) => ({
    kind: 'call-request-failed',
    sub: 'tried-to-call',
    ...NO_CODE,
    primary: CALL_AGAIN,
    resend: insideGap(state, SMS_AGAIN),
    callOffered: false,
    foot: null,
  }),
  expired: (state) => ({
    kind: 'expired',
    sub: sentSub(state),
    codeError: null,
    code: 'closed',
    ...newCodeWays(state),
    foot: null,
  }),
  'used-up': (state) => ({
    kind: 'used-up',
    sub: sentSub(state),
    codeError: null,
    code: 'closed',
    ...newCodeWays(state),
    foot: null,
  }),
  'call-offer': (state) => ({
    kind: 'call-offer',
    sub: 'will-call',
    codeError: null,
    code: 'open',
    primary: state.cooldownLeft > 0 ? null : { press: 'call', label: 'call-me' },
    resend: insideGap(state, SMS_AGAIN),
    callOffered: false,
    foot: null,
  }),
  wrong: (state) => ({
    kind: 'wrong',
    sub: sentSub(state),
    codeError: 'wrong',
    code: 'open',
    primary: VERIFY,
    resend: insideGap(state, NEW_CODE),
    callOffered: false,
    foot: 'tries-left',
  }),
  filled: (state) => ({
    kind: 'filled',
    sub: sentSub(state),
    codeError: shortError(state),
    code: 'open',
    primary: VERIFY,
    resend: insideGap(state, NEW_CODE),
    callOffered: false,
    foot: null,
  }),
  waiting: (state) => ({
    kind: 'waiting',
    sub: sentSub(state),
    codeError: shortError(state),
    code: 'open',
    primary: VERIFY,
    resend: WAIT,
    callOffered: false,
    foot: null,
  }),
  entry: (state) => ({
    kind: 'entry',
    sub: sentSub(state),
    codeError: shortError(state),
    code: 'open',
    primary: VERIFY,
    resend: NEW_CODE,
    callOffered: state.channel === 'sms',
    foot: null,
  }),
};
