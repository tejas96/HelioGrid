/**
 * The sign-in flow's facts and events — what `loginReducer` (`login-reducer.ts`) moves between
 * and both doors read (Law 11).
 */
import type { FormatPack } from '../format/pack';
import type { PhoneDigitsMismatch } from '../format/phone';
import type { GoogleEnded, GoogleOutcome, GoogleSheetResult, GoogleToken } from './google-sign-in';
import { OTP_MAX_FAILED_VERIFIES, type OtpChannel } from './otp-policy';

/**
 * The steps of the OTP login flow. `google-link` is a first Google sign-in confirming the number
 * its login will join (`M01-02`). `switch` is the shared-device step (`F4-37`): a different
 * user verified on a device still holding another user's work, and what will be lost is named
 * before the switch completes. A device holding nothing skips it.
 */
export type LoginStep = 'phone' | 'google-link' | 'otp' | 'switch' | 'done';

/** The door's own steps — `switch` is the session store's and `done` the navigator's. */
export type SignInStep = Extract<LoginStep, 'phone' | 'google-link' | 'otp'>;

/**
 * How a request for a code ended. Every refusal the wire can name has its own word, because
 * each is its own frame on the door (`SCR-M01-01`): `cooldown` is the 30 s gap, `capped` an
 * `M01-04` request cap, `locked` the 15-minute number lock, `delivery-failed` the network's
 * confirmed hard failure (the cooldown is released, the caps are not), `failed` a refusal the
 * wire could not name, `unreached` a request that got no answer — the person's network or ours,
 * never told as our failure (`F8-36`). Never collapse two into one — the copy differs.
 */
export type OtpRequestOutcome =
  | 'sent'
  | 'cooldown'
  | 'capped'
  | 'locked'
  | 'delivery-failed'
  | 'failed'
  | 'unreached';

/**
 * How a code check ended. `mismatch` leaves tries on this code; `invalidated` is the fifth
 * wrong try (`OTP_MAX_FAILED_VERIFIES`) or a code already used; `expired` is past
 * `OTP_EXPIRY_SECONDS`; `locked` the number lock; `failed` the step after the code; `unreached` a check that got no answer.
 */
export type OtpVerifyOutcome =
  | 'verified'
  | 'mismatch'
  | 'expired'
  | 'invalidated'
  | 'locked'
  | 'failed'
  | 'unreached';

/** The controls a frame can offer — each the press it raises. */
export type LoginPress =
  | 'send'
  | 'resend'
  | 'verify'
  | 'choose-call'
  | 'call'
  | 'sms'
  | 'change-number'
  | 'google'
  | 'use-number'
  | 'sign-in-by-number';

/**
 * A round trip the reducer asked for, carrying everything it must send, so the hook that makes
 * the call reads nothing else and a later keystroke cannot change what goes on the wire.
 */
export type PendingCall =
  | { readonly kind: 'request'; readonly phone: string; readonly channel: OtpChannel }
  | { readonly kind: 'verify'; readonly code: string }
  | { readonly kind: 'google-sheet' }
  /** `code` is the link's proof; `null` asks whether the login is linked already. */
  | { readonly kind: 'google'; readonly token: GoogleToken; readonly code: string | null };

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
  /** The Google login being linked to the number this flow proves; `null` outside the link. */
  readonly google: GoogleToken | null;
  /** What the last Google sign-in left on the door; `null` when it left nothing. */
  readonly googleEnded: GoogleEnded | null;
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
  | { readonly type: 'google' }
  | { readonly type: 'use-number' }
  | { readonly type: 'sign-in-by-number' }
  | { readonly type: 'request-ended'; readonly outcome: OtpRequestOutcome; readonly now: number }
  | {
      readonly type: 'verify-ended';
      readonly outcome: OtpVerifyOutcome;
      readonly triesLeft: number;
    }
  | { readonly type: 'google-sheet-ended'; readonly result: GoogleSheetResult }
  | { readonly type: 'google-ended'; readonly outcome: GoogleOutcome; readonly triesLeft: number }
  | { readonly type: 'tick'; readonly now: number };

type AnswerEvent = Extract<
  LoginEvent,
  { type: 'request-ended' | 'verify-ended' | 'google-sheet-ended' | 'google-ended' | 'tick' }
>;
export type PressEvent = Exclude<LoginEvent, AnswerEvent>;

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
  google: null,
  googleEnded: null,
};
