/**
 * The Google door's own frames (`SCR-M01-01`), decided once for both doors (Law 11): the link step
 * a first Google sign-in lands on, and the Google control on the phone step. The words are
 * `packages/i18n`'s; the screen draws and decides nothing.
 */
import type { LoginState } from './login-state';

/**
 * The link step: `link` confirms the number the Google login joins; `link-locked` is that number
 * under its SMS lock — linking needs a code, so it waits, and Send code is gone, not greyed.
 */
export interface GoogleLinkFrame {
  readonly kind: 'link' | 'link-locked';
  readonly phoneEnabled: boolean;
  readonly sendOffered: boolean;
  /** Send code spins while its request is in flight. */
  readonly sending: boolean;
}

export function googleLinkFrame(state: LoginState): GoogleLinkFrame {
  const locked = state.request === 'locked';
  const sending = state.pending?.kind === 'request';
  return {
    kind: locked ? 'link-locked' : 'link',
    phoneEnabled: !locked && !sending,
    sendOffered: !locked,
    sending,
  };
}

/**
 * The Google control on the phone step: it spins while Google's sheet is open or its token is
 * checked, and a sign-in that did not finish says so above the field. A cancelled sheet says
 * nothing (`SCR-M01-01` decision 11).
 */
export interface PhoneGoogle {
  readonly busy: boolean;
  readonly failed: boolean;
}

export function phoneGoogle(state: LoginState): PhoneGoogle {
  const kind = state.pending?.kind;
  return {
    busy: kind === 'google-sheet' || kind === 'google',
    failed: state.googleEnded === 'failed',
  };
}
