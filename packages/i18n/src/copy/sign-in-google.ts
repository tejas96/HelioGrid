/**
 * The Google door's own words (`SCR-M01-01`): the Google control on the phone step, and the link
 * step a first Google sign-in lands on. Keyed by what `packages/domain` decides (`phoneGoogle`,
 * `googleLinkFrame`); the code step's Google words are `signInWords`'.
 */
import {
  type FrameTone,
  type GoogleLinkFrame,
  OTP_INVALIDATIONS_TO_LOCK,
  OTP_LOCK_MINUTES,
  OTP_MAX_FAILED_VERIFIES,
  type PhoneGoogle,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { SIGN_IN } from './sign-in';

/** A tinted block's words, as the code frames carry them. */
export interface GoogleBlockWords {
  readonly tone: FrameTone;
  readonly title: string;
  readonly body: string;
}

/** The phone step's Google part: the "or", the control, and a sign-in that did not finish. */
export interface PhoneGoogleWords {
  readonly or: string;
  readonly label: string;
  /** The account rule lives here, not in a caption (`SCR-M01-01` decision 12). */
  readonly aria: string;
  readonly failed: GoogleBlockWords | null;
}

export function phoneGoogleWords(
  translate: Translator['t'],
  google: PhoneGoogle,
): PhoneGoogleWords {
  return {
    or: translate(SIGN_IN.or),
    label: translate(SIGN_IN.continueWithGoogle),
    aria: translate(google.busy ? SIGN_IN.openingGoogle : SIGN_IN.continueWithGoogleLabel),
    failed: google.failed
      ? {
          tone: 'danger',
          title: translate(SIGN_IN.googleFailedTitle),
          body: translate(SIGN_IN.googleFailedBody),
        }
      : null,
  };
}

/** Every string the link step draws; `null` where its frame has no such part. */
export interface GoogleLinkWords {
  readonly title: string;
  readonly body: string;
  /** Beside the title on the open step; the locked step drops it. */
  readonly explainer: {
    readonly label: string;
    readonly title: string;
    readonly page: string;
  } | null;
  readonly tileOverline: string;
  readonly email: string;
  /** The phone puts "Not you?" under the tile; the desktop's shorter link sits under Send code. */
  readonly anotherAccount: { readonly underTile: string; readonly short: string };
  readonly useNumber: { readonly label: string; readonly aria: string };
  readonly phoneLabel: string;
  readonly send: { readonly label: string; readonly aria: string } | null;
  readonly locked: { readonly block: GoogleBlockWords; readonly sentence: string } | null;
}

export function googleLinkWords(
  translate: Translator['t'],
  frame: GoogleLinkFrame,
  email: string,
): GoogleLinkWords {
  const values = {
    chain: OTP_INVALIDATIONS_TO_LOCK,
    lockMinutes: OTP_LOCK_MINUTES,
    tries: OTP_MAX_FAILED_VERIFIES,
  };
  const t = (message: Parameters<Translator['t']>[0]) => translate(message, values);
  const locked = frame.kind === 'link-locked';
  return {
    title: t(SIGN_IN.confirmYourNumber),
    body: t(SIGN_IN.linkingBody),
    explainer: locked
      ? null
      : {
          label: t(SIGN_IN.linkingExplainerLabel),
          title: t(SIGN_IN.linkingExplainerTitle),
          page: t(SIGN_IN.linkingExplainerPage),
        },
    tileOverline: t(SIGN_IN.signingInWithGoogle),
    email,
    anotherAccount: {
      underTile: t(SIGN_IN.notYouUseAnotherGoogle),
      short: t(SIGN_IN.useAnotherGoogle),
    },
    useNumber: { label: t(SIGN_IN.useMyNumberInstead), aria: t(SIGN_IN.useMyNumberInsteadLabel) },
    phoneLabel: t(SIGN_IN.mobileNumber),
    send: frame.sendOffered
      ? {
          label: t(frame.sending ? SIGN_IN.sendingTheCode : SIGN_IN.sendCode),
          aria: t(SIGN_IN.sendCodeAndLinkLabel),
        }
      : null,
    locked: locked
      ? {
          block: {
            tone: 'danger',
            title: t(SIGN_IN.lockedBlockTitle),
            body: t(SIGN_IN.lockedBlockBody),
          },
          sentence: t(SIGN_IN.linkLockedSentence),
        }
      : null,
  };
}
