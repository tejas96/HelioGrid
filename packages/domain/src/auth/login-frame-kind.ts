/**
 * Which code-step frame the facts add up to, decided once for both doors (Law 11): a refused or
 * unanswered check over a refused or unanswered request over the ordinary step. What each frame
 * offers is `login-frame.ts`'s.
 */
import type { LoginState, OtpRequestOutcome } from './login-state';

/** The frames, in the order a fact wins: a refused check over a refused request over the ordinary step. */
export type FrameKind =
  | 'google-phone-taken'
  | 'auth-error'
  | 'auth-unreached'
  | 'locked'
  | 'call-offer'
  | 'capped'
  | 'delivery-failed'
  | 'call-not-placed'
  | 'request-failed'
  | 'call-request-failed'
  | 'request-unreached'
  | 'call-request-unreached'
  | 'expired'
  | 'used-up'
  | 'wrong'
  | 'filled'
  | 'waiting'
  | 'entry';

export function frameKindOf(state: LoginState): FrameKind {
  return refusalFrameOf(state) ?? codeFrameOf(state);
}

/** A refused or unanswered request's frame, by SMS and by call. */
const REQUEST_REFUSAL: Record<OtpRequestOutcome, readonly [FrameKind, FrameKind] | null> = {
  sent: null,
  cooldown: null,
  locked: null,
  capped: ['capped', 'capped'],
  'delivery-failed': ['delivery-failed', 'call-not-placed'],
  failed: ['request-failed', 'call-request-failed'],
  unreached: ['request-unreached', 'call-request-unreached'],
};

/** A refused check or a refused request owns the frame before any ordinary step is read. */
function refusalFrameOf(state: LoginState): FrameKind | null {
  const byCall = state.channel === 'voice';
  if (state.googleEnded === 'phone-taken') return 'google-phone-taken';
  if (state.verify === 'failed') return 'auth-error';
  if (state.verify === 'unreached') return 'auth-unreached';
  if (state.verify === 'locked' || state.request === 'locked') return 'locked';
  // A call the person chose but has not placed yet is offered before any SMS outcome is judged —
  // the route out of a failed send must lead somewhere.
  if (byCall && !state.placed) return 'call-offer';
  const frames = state.request === null ? null : REQUEST_REFUSAL[state.request];
  return frames === null ? null : frames[byCall ? 1 : 0];
}

function codeFrameOf(state: LoginState): FrameKind {
  if (state.verify === 'expired') return 'expired';
  if (state.verify === 'invalidated') return 'used-up';
  if (state.verify === 'mismatch') return 'wrong';
  if (state.filled) return 'filled';
  if (state.cooldownLeft > 0) return 'waiting';
  return 'entry';
}
