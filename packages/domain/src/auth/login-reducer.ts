/**
 * The OTP login flow — one state machine both doors run (Law 11). The reducer is total and pure:
 * a press it cannot honour returns the state unchanged, the clock arrives inside the event as
 * `now`, and a round trip is ASKED FOR through `pending` and answered by an `-ended` event, so
 * the hook that drives it decides nothing.
 */
import type { FormatPack } from '../format/pack';
import { phoneDigitsMismatch } from '../format/phone';
import type { GoogleOutcome, GoogleSheetResult, GoogleToken } from './google-sign-in';
import { resendOpensAt, resendSecondsLeft } from './login-policy';
import {
  INITIAL_LOGIN_STATE,
  type LoginEvent,
  type LoginState,
  type OtpRequestOutcome,
  type OtpVerifyOutcome,
  type PendingCall,
  type PressEvent,
} from './login-state';
import { OTP_LENGTH } from './otp';
import { OTP_MAX_FAILED_VERIFIES, type OtpChannel } from './otp-policy';

/**
 * While a round trip is in flight only its answer and the clock are heard — and Google, which the
 * front door keeps live while a code is sending (`SCR-M01-01` `m-loading`): it takes the round trip.
 */
export function loginReducer(state: LoginState, event: LoginEvent): LoginState {
  switch (event.type) {
    case 'tick':
      return { ...state, cooldownLeft: resendSecondsLeft(state.resendAt, event.now) };
    case 'request-ended':
      return requestEnded(state, event.outcome, event.now);
    case 'verify-ended':
      return verifyEnded(state, event.outcome, event.triesLeft);
    case 'google-sheet-ended':
      return googleSheetEnded(state, event.result);
    case 'google-ended':
      return googleEnded(state, event.outcome, event.triesLeft);
    default:
      if (state.pending === null) return pressed(state, event);
      return googleTakesOverSend(state, event) ? pressed(state, event) : state;
  }
}

/** Google pressed on the number step while its code is sending takes the door (`m-loading`). */
function googleTakesOverSend(state: LoginState, event: PressEvent): boolean {
  return event.type === 'google' && state.step === 'phone' && state.pending?.kind === 'request';
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
      return state.google === null ? phoneStep(state) : linkStep(state, state.google);
    // What the last sign-in left stays drawn while the sheet is open: a cancel changes nothing.
    case 'google':
      return { ...state, pending: { kind: 'google-sheet' } };
    case 'use-number':
      return phoneStep(state);
    case 'sign-in-by-number':
      if (state.googleEnded !== 'phone-taken') return state;
      return {
        ...state,
        google: null,
        googleEnded: null,
        pending: { kind: 'verify', code: state.code },
      };
  }
}

function phoneStep(state: LoginState): LoginState {
  return { ...INITIAL_LOGIN_STATE, phone: state.phone };
}

function linkStep(state: LoginState, google: GoogleToken): LoginState {
  return { ...phoneStep(state), step: 'google-link', google };
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
    // The last send's block goes while this one runs, so the next answer is spoken afresh.
    request: null,
    channel: 'sms',
    pending: { kind: 'request', phone: state.phone, channel: 'sms' },
  };
}

/** While a Google login is being linked, the code is its proof and travels with it. */
function verify(state: LoginState): LoginState {
  if (state.code.length < OTP_LENGTH) return { ...state, codeShort: true };
  const pending: PendingCall =
    state.google === null
      ? { kind: 'verify', code: state.code }
      : { kind: 'google', token: state.google, code: state.code };
  return { ...state, codeShort: false, pending };
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

/**
 * A number locked while a Google login waits to link stays on the link step: linking needs a
 * code, and the plain locked frame's Google control would lead back to the same wait.
 */
function lockedWhileLinking(state: LoginState): LoginState {
  return { ...state, pending: null, step: 'google-link', request: 'locked' };
}

function requestEnded(state: LoginState, outcome: OtpRequestOutcome, now: number): LoginState {
  // A send Google took over is answered too late to matter, even once Google has ended.
  if (state.pending?.kind !== 'request') return state;
  if (outcome === 'locked' && state.google !== null) return lockedWhileLinking(state);
  // A first send that got no answer opened nothing: the number stays, with the block above it.
  if (outcome === 'unreached' && state.step === 'phone')
    return { ...state, pending: null, request: outcome };
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
  if (outcome === 'locked' && state.google !== null) return lockedWhileLinking(state);
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

/**
 * A sheet's answer is heard for the sheet this flow opened — or, with nothing in flight, a token
 * the web's return route brings in. Any other answer would start a second call beside the first.
 */
function googleSheetEnded(state: LoginState, result: GoogleSheetResult): LoginState {
  const sheetOpen = state.pending?.kind === 'google-sheet';
  // The web's return route reads Google's answer with nothing pending: Google's page left the tab.
  const webReturn = state.pending === null && result.kind !== 'cancelled';
  if (!sheetOpen && !webReturn) return state;
  switch (result.kind) {
    case 'token':
      return {
        ...state,
        googleEnded: null,
        pending: { kind: 'google', token: result.token, code: null },
      };
    case 'cancelled':
      return { ...state, pending: null };
    case 'failed':
      return { ...phoneStep(state), googleEnded: 'failed' };
  }
}

/** A Google answer is heard only for the Google call in flight — it carries the token it checked. */
function googleEnded(state: LoginState, outcome: GoogleOutcome, triesLeft: number): LoginState {
  const { pending } = state;
  if (pending?.kind !== 'google') return state;
  switch (outcome) {
    case 'signed-in':
      return { ...state, pending: null };
    case 'not-linked':
      return linkStep(state, pending.token);
    case 'phone-taken':
      return { ...state, pending: null, googleEnded: 'phone-taken' };
    case 'failed':
      return { ...phoneStep(state), googleEnded: 'failed' };
    default:
      return verifyEnded(state, outcome, triesLeft);
  }
}
