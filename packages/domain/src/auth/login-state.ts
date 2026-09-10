/**
 * The OTP login flow — one state machine both doors run (Law 11). The reducer is total and pure:
 * a press it cannot honour returns the state unchanged, the clock arrives inside the event as
 * `now`, and a round trip is ASKED FOR through `pending` and answered by an `-ended` event, so
 * the hook that drives it decides nothing.
 */
import type { FormatPack } from '../format/pack';
import { type PhoneDigitsMismatch, phoneDigitsMismatch } from '../format/phone';
import { resendOpensAt, resendSecondsLeft } from './login-policy';
import { OTP_LENGTH } from './otp';
import { OTP_MAX_FAILED_VERIFIES, type OtpChannel } from './otp-policy';

/**
 * The steps of the OTP login flow. `switch` is the shared-device step (`F4-37`): a different
 * user verified on a device still holding another user's work, and what will be lost is named
 * before the switch completes. A device holding nothing skips it.
 */
export type LoginStep = 'phone' | 'otp' | 'switch' | 'done';

/** The door's own two steps — `switch` is the session store's and `done` the navigator's. */
export type SignInStep = Extract<LoginStep, 'phone' | 'otp'>;

/**
 * How a request for a code ended. Every refusal the wire can name has its own word, because
 * each is its own frame on the door (`SCR-M01-01`): `cooldown` is the 30 s gap, `capped` an
 * `M01-04` request cap, `locked` the 15-minute number lock, `delivery-failed` the network's
 * confirmed hard failure (the cooldown is released, the caps are not), `failed` anything the
 * wire could not name. Never collapse two into one — the copy differs.
 */
export type OtpRequestOutcome =
  | 'sent'
  | 'cooldown'
  | 'capped'
  | 'locked'
  | 'delivery-failed'
  | 'failed';

/**
 * How a code check ended. `mismatch` leaves tries on this code; `invalidated` is the fifth
 * wrong try (`OTP_MAX_FAILED_VERIFIES`) or a code already used; `expired` is past
 * `OTP_EXPIRY_SECONDS`; `locked` the number lock; `failed` the step after the code.
 */
export type OtpVerifyOutcome =
  | 'verified'
  | 'mismatch'
  | 'expired'
  | 'invalidated'
  | 'locked'
  | 'failed';

/** The controls a frame can offer — each the press it raises. */
export type LoginPress =
  | 'send'
  | 'resend'
  | 'verify'
  | 'choose-call'
  | 'call'
  | 'sms'
  | 'change-number';

/**
 * A round trip the reducer asked for, carrying everything it must send, so the hook that makes
 * the call reads nothing else and a later keystroke cannot change what goes on the wire.
 */
export type PendingCall =
  | { readonly kind: 'request'; readonly phone: string; readonly channel: OtpChannel }
  | { readonly kind: 'verify'; readonly code: string };

/** Everything a frame is drawn from — one fact per field, so a frame is a pure reading of it. */
export interface LoginState {
  readonly step: SignInStep;
  /** E.164 as the field commits it; empty until something is typed. */
  readonly phone: string;
  /** The field's own answer when Send code is pressed on a short or long number. */
  readonly phoneProblem: PhoneDigitsMismatch | null;
  /** The round trip in flight; the primary spins and the fields lock while it is not null. */
  readonly pending: PendingCall | null;
  /** How the last request for a code ended; `null` before the first. */
  readonly request: OtpRequestOutcome | null;
  /** The channel in use: the call route stays chosen until the person asks for the SMS again. */
  readonly channel: OtpChannel;
  /** Whether the chosen channel has been asked for since it was chosen — a refusal counts. */
  readonly placed: boolean;
  /** Codes sent on this number — the first send reads differently from a resend. */
  readonly sends: number;
  readonly code: string;
  /** Verify was pressed with fewer digits than a code has (`OTP_LENGTH`). */
  readonly codeShort: boolean;
  /** The code arrived whole — the platform filled it, or a paste did. */
  readonly filled: boolean;
  /** How the last check ended; `null` while the current code is untried. */
  readonly verify: OtpVerifyOutcome | null;
  readonly triesLeft: number;
  /** The clock instant the resend opens (`resendOpensAt`); `null` while no gap runs. */
  readonly resendAt: number | null;
  /** Whole seconds until the resend is live; 0 means it is. Re-read on every tick. */
  readonly cooldownLeft: number;
}

export type LoginEvent =
  | { readonly type: 'phone-typed'; readonly phone: string }
  | { readonly type: 'code-typed'; readonly code: string }
  | { readonly type: 'send'; readonly pack: FormatPack }
  | { readonly type: 'resend' }
  | { readonly type: 'verify' }
  | { readonly type: 'choose-call' }
  | { readonly type: 'call' }
  | { readonly type: 'sms' }
  | { readonly type: 'change-number' }
  | { readonly type: 'request-ended'; readonly outcome: OtpRequestOutcome; readonly now: number }
  | {
      readonly type: 'verify-ended';
      readonly outcome: OtpVerifyOutcome;
      readonly triesLeft: number;
    }
  | { readonly type: 'tick'; readonly now: number };

type PressEvent = Exclude<LoginEvent, { type: 'request-ended' | 'verify-ended' | 'tick' }>;

export const INITIAL_LOGIN_STATE: LoginState = {
  step: 'phone',
  phone: '',
  phoneProblem: null,
  pending: null,
  request: null,
  channel: 'sms',
  placed: false,
  sends: 0,
  code: '',
  codeShort: false,
  filled: false,
  verify: null,
  triesLeft: OTP_MAX_FAILED_VERIFIES,
  resendAt: null,
  cooldownLeft: 0,
};

/** While a round trip is in flight only its answer and the clock are heard. */
export function loginReducer(state: LoginState, event: LoginEvent): LoginState {
  switch (event.type) {
    case 'tick':
      return { ...state, cooldownLeft: resendSecondsLeft(state.resendAt, event.now) };
    case 'request-ended':
      return requestEnded(state, event.outcome, event.now);
    case 'verify-ended':
      return verifyEnded(state, event.outcome, event.triesLeft);
    default:
      return state.pending === null ? pressed(state, event) : state;
  }
}

function pressed(state: LoginState, event: PressEvent): LoginState {
  switch (event.type) {
    case 'phone-typed':
      return { ...state, phone: event.phone, phoneProblem: null };
    case 'code-typed':
      return codeTyped(state, event.code);
    case 'send':
      return send(state, event.pack);
    case 'verify':
      return verify(state);
    case 'resend':
      return requestOn(state, state.channel);
    case 'call':
      return requestOn(state, 'voice');
    case 'sms':
      return requestOn(state, 'sms');
    case 'choose-call':
      return { ...state, ...UNTRIED_CODE, channel: 'voice', placed: false };
    case 'change-number':
      return { ...INITIAL_LOGIN_STATE, phone: state.phone };
  }
}

/** The code field as a fresh code finds it. */
const UNTRIED_CODE = { code: '', codeShort: false, filled: false, verify: null } as const;

function codeTyped(state: LoginState, code: string): LoginState {
  const arrivedWhole = state.code === '' && code.length > 1;
  return { ...state, code, filled: arrivedWhole, verify: null, codeShort: false };
}

function send(state: LoginState, pack: FormatPack): LoginState {
  const problem = phoneDigitsMismatch(pack, state.phone);
  if (problem !== null) return { ...state, phoneProblem: problem };
  return {
    ...state,
    ...UNTRIED_CODE,
    phoneProblem: null,
    channel: 'sms',
    pending: { kind: 'request', phone: state.phone, channel: 'sms' },
  };
}

function verify(state: LoginState): LoginState {
  if (state.code.length < OTP_LENGTH) return { ...state, codeShort: true };
  return { ...state, codeShort: false, pending: { kind: 'verify', code: state.code } };
}

/** A request inside the gap is not sent — the server would refuse it (`M01-04`) — so the press is ignored. */
function requestOn(state: LoginState, channel: OtpChannel): LoginState {
  if (state.cooldownLeft > 0) return state;
  return {
    ...state,
    ...UNTRIED_CODE,
    channel,
    pending: { kind: 'request', phone: state.phone, channel },
  };
}

/** A send and a server-side gap both start the device's gap; every other answer releases it (`M01-03`). */
function startsCooldown(outcome: OtpRequestOutcome): boolean {
  return outcome === 'sent' || outcome === 'cooldown';
}

function requestEnded(state: LoginState, outcome: OtpRequestOutcome, now: number): LoginState {
  const resendAt = startsCooldown(outcome) ? resendOpensAt(now) : null;
  return {
    ...state,
    ...UNTRIED_CODE,
    pending: null,
    step: 'otp',
    request: outcome,
    // A gap refusal placed nothing, so the call route stays offered rather than reading as answered.
    placed: outcome === 'cooldown' ? state.placed : true,
    sends: outcome === 'sent' ? state.sends + 1 : state.sends,
    triesLeft: OTP_MAX_FAILED_VERIFIES,
    resendAt,
    cooldownLeft: resendSecondsLeft(resendAt, now),
  };
}

function verifyEnded(state: LoginState, outcome: OtpVerifyOutcome, triesLeft: number): LoginState {
  return {
    ...state,
    pending: null,
    verify: outcome,
    triesLeft,
    code: outcome === 'mismatch' ? state.code : '',
    codeShort: false,
    filled: false,
  };
}
