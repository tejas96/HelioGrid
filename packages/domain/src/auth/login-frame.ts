/**
 * The code step's frame — WHAT each fact looks like, decided once for both doors (Law 11):
 * which frame the facts add up to, which controls it offers and what each control does. The
 * words are `packages/i18n`'s, keyed by the vocabularies here; the screen draws and decides
 * nothing.
 */
import type {
  CodeError,
  CodeHelper,
  FootLine,
  FrameControl,
  ResendSlot,
  SubLine,
} from './login-frame-parts';
import type { LoginState } from './login-state';

/** The frames, in the order a fact wins: a refused check over a refused request over the ordinary step. */
export type FrameKind =
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
  /** `null` when the field shows an error instead. */
  readonly helper: CodeHelper | null;
  readonly codeError: CodeError | null;
  readonly codeEnabled: boolean;
  readonly primary: FrameControl | null;
  readonly resend: ResendSlot | null;
  /** The "Get the code by call" block — the person's own choice, never HelioGrid's (`M01-03`). */
  readonly callOffered: boolean;
  readonly foot: FootLine | null;
}

export function frameKindOf(state: LoginState): FrameKind {
  return refusalFrameOf(state) ?? codeFrameOf(state);
}

/** A refused check or a refused request owns the frame before any ordinary step is read. */
function refusalFrameOf(state: LoginState): FrameKind | null {
  const byCall = state.channel === 'voice';
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

export function loginFrame(state: LoginState): LoginFrame {
  return FRAMES[frameKindOf(state)](state);
}

const VERIFY: FrameControl = { press: 'verify', label: 'verify' };
const SEND_AGAIN: FrameControl = { press: 'resend', label: 'send-again' };
const CALL_AGAIN: FrameControl = { press: 'resend', label: 'call-again' };
const WAIT_SHORT: ResendSlot = { kind: 'wait', reason: 'short' };
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
  return state.cooldownLeft > 0 ? WAIT_SHORT : live;
}
function firstSend(state: LoginState): boolean {
  return state.sends <= 1;
}

/** After a code died: a new one on the channel in use, and the other channel as the way across. */
function newCodeWays(state: LoginState): Pick<LoginFrame, 'primary' | 'resend' | 'callOffered'> {
  if (state.cooldownLeft > 0) return { primary: null, resend: WAIT_SHORT, callOffered: false };
  if (state.channel === 'voice')
    return { primary: CALL_AGAIN, resend: SMS_AGAIN, callOffered: false };
  return { primary: { press: 'resend', label: 'send-new' }, resend: null, callOffered: true };
}

const NO_CODE = { helper: 'no-code-yet', codeError: null, codeEnabled: false } as const;
const NO_WAYS = { primary: null, callOffered: false } as const;

const FRAMES: Record<FrameKind, (state: LoginState) => LoginFrame> = {
  'auth-error': () => ({
    kind: 'auth-error',
    sub: 'checked-for',
    helper: 'code-was-fine',
    codeError: null,
    codeEnabled: false,
    primary: { press: 'verify', label: 'try-again' },
    resend: null,
    callOffered: false,
    foot: 'auth-error',
  }),
  locked: () => ({
    kind: 'locked',
    sub: 'locked-for',
    helper: 'locked',
    codeError: null,
    codeEnabled: false,
    ...NO_WAYS,
    resend: { kind: 'wait', reason: 'locked' },
    foot: 'locked',
  }),
  // The cap counts every request on the number, a call included (`M01-04`), so no primary
  // pretends a call is a way in: the wait is the remedy, as in the locked frame.
  capped: (state) => ({
    kind: 'capped',
    sub: triedSub(state),
    ...NO_CODE,
    ...NO_WAYS,
    resend: { kind: 'wait', reason: 'cap' },
    foot: 'cap',
  }),
  'delivery-failed': () => ({
    kind: 'delivery-failed',
    sub: 'tried-by-sms',
    ...NO_CODE,
    primary: SEND_AGAIN,
    resend: null,
    callOffered: true,
    foot: 'not-sent',
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
    helper: 'nothing-until-new',
    codeError: null,
    codeEnabled: false,
    ...newCodeWays(state),
    foot: null,
  }),
  'used-up': (state) => ({
    kind: 'used-up',
    sub: sentSub(state),
    helper: 'nothing-until-new',
    codeError: null,
    codeEnabled: false,
    ...newCodeWays(state),
    foot: null,
  }),
  'call-offer': (state) => ({
    kind: 'call-offer',
    sub: 'will-call',
    helper: 'answer-call',
    codeError: null,
    codeEnabled: true,
    primary: state.cooldownLeft > 0 ? null : { press: 'call', label: 'call-me' },
    resend: insideGap(state, SMS_AGAIN),
    callOffered: false,
    foot: 'call',
  }),
  wrong: (state) => ({
    kind: 'wrong',
    sub: sentSub(state),
    helper: null,
    codeError: 'wrong',
    codeEnabled: true,
    primary: VERIFY,
    resend: insideGap(state, NEW_CODE),
    callOffered: false,
    foot: 'tries-left',
  }),
  filled: (state) => ({
    kind: 'filled',
    sub: sentSub(state),
    helper: 'filled-from-sms',
    codeError: shortError(state),
    codeEnabled: true,
    primary: VERIFY,
    resend: insideGap(state, NEW_CODE),
    callOffered: false,
    foot: 'only-some-phones',
  }),
  waiting: (state) => ({
    kind: 'waiting',
    sub: sentSub(state),
    helper: waitingHelper(state),
    codeError: shortError(state),
    codeEnabled: true,
    primary: VERIFY,
    resend: { kind: 'wait', reason: firstSend(state) ? 'first' : 'again' },
    callOffered: false,
    foot: firstSend(state) ? 'code-works-for' : 'wait-stops',
  }),
  entry: (state) => ({
    kind: 'entry',
    sub: sentSub(state),
    helper: 'paste-whole',
    codeError: shortError(state),
    codeEnabled: true,
    primary: VERIFY,
    resend: NEW_CODE,
    callOffered: state.channel === 'sms',
    foot: null,
  }),
};

function waitingHelper(state: LoginState): CodeHelper {
  if (state.channel === 'voice') return 'answer-call';
  return firstSend(state) ? 'sent-just-now' : 'sent-moment-ago';
}
