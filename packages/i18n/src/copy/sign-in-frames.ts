/**
 * The words of each code-step frame (`SCR-M01-01`, the `m-*` code family), keyed by the
 * vocabularies `packages/domain`'s `loginFrame` decides. Nothing here chooses: a frame's
 * structure is domain's, a sentence is looked up by its key, and the policy numbers a sentence
 * names arrive under one placeholder each.
 */
import {
  type CodeError,
  countdownClock,
  type FootLine,
  type FrameExplainer,
  type FrameKind,
  type FrameTone,
  type GoogleLabel,
  type LoginFrame,
  OTP_EXPIRY_SECONDS,
  OTP_INVALIDATIONS_TO_LOCK,
  OTP_LENGTH,
  OTP_LOCK_MINUTES,
  OTP_MAX_FAILED_VERIFIES,
  OTP_REQUEST_WINDOW_MINUTES,
  OTP_REQUESTS_PER_DAY,
  OTP_REQUESTS_PER_WINDOW,
  type PrimaryLabel,
  RESEND_SECONDS,
  type ResendLabel,
  type SubLine,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { COMPANY_SIGNUP } from './company-signup';
import { SIGN_IN } from './sign-in';

const SECONDS_PER_MINUTE = 60;

/** Every policy number a frame may name, under the placeholder its sentence uses. */
const POLICY_VALUES = {
  n: OTP_LENGTH,
  codeMinutes: OTP_EXPIRY_SECONDS / SECONDS_PER_MINUTE,
  windowMinutes: OTP_REQUEST_WINDOW_MINUTES,
  lockMinutes: OTP_LOCK_MINUTES,
  tries: OTP_MAX_FAILED_VERIFIES,
  chain: OTP_INVALIDATIONS_TO_LOCK,
  perWindow: OTP_REQUESTS_PER_WINDOW,
  day: OTP_REQUESTS_PER_DAY,
  gap: RESEND_SECONDS,
};

/** A frame's title and its tinted block: the block names what happened; the controls are the fix (`F7-46`). */
interface FrameCopy {
  readonly title: MessageRef;
  readonly block: { readonly tone: FrameTone; readonly title: MessageRef } | null;
}

const OUR_SIDE = { tone: 'danger', title: SIGN_IN.ourSideFailed } as const;

const FRAME: Record<FrameKind, FrameCopy> = {
  'google-phone-taken': {
    title: SIGN_IN.phoneTakenTitle,
    block: { tone: 'danger', title: SIGN_IN.phoneTakenBlockTitle },
  },
  'auth-error': {
    title: SIGN_IN.authErrorTitle,
    block: { tone: 'danger', title: SIGN_IN.ourSideFailed },
  },
  locked: {
    title: SIGN_IN.lockedTitle,
    block: { tone: 'danger', title: SIGN_IN.lockedBlockTitle },
  },
  'call-offer': { title: SIGN_IN.getCodeByCall, block: null },
  capped: {
    title: SIGN_IN.capTitle,
    block: { tone: 'warning', title: SIGN_IN.capBlockTitle },
  },
  'delivery-failed': {
    title: SIGN_IN.notSentTitle,
    block: { tone: 'danger', title: SIGN_IN.notSentBlockTitle },
  },
  'call-not-placed': {
    title: SIGN_IN.callNotPlacedTitle,
    block: { tone: 'danger', title: SIGN_IN.callNotPlacedBlockTitle },
  },
  'request-failed': { title: SIGN_IN.requestFailedTitle, block: OUR_SIDE },
  'call-request-failed': { title: SIGN_IN.couldNotCallTitle, block: OUR_SIDE },
  expired: {
    title: SIGN_IN.expiredTitle,
    block: { tone: 'warning', title: SIGN_IN.expiredBlockTitle },
  },
  'used-up': {
    title: SIGN_IN.usedUpTitle,
    block: { tone: 'warning', title: SIGN_IN.usedUpBlockTitle },
  },
  wrong: { title: SIGN_IN.wrongTitle, block: null },
  filled: { title: SIGN_IN.codeFilledTitle, block: null },
  waiting: { title: SIGN_IN.enterTheCode, block: null },
  entry: { title: SIGN_IN.enterTheCode, block: null },
};

const SUB: Record<SubLine, MessageRef> = {
  'sent-by-sms': SIGN_IN.sentBySmsTo,
  'read-out': SIGN_IN.weReadOutTo,
  'tried-by-sms': SIGN_IN.triedBySmsTo,
  'tried-to-call': SIGN_IN.triedToCall,
  'will-call': SIGN_IN.weCallAndReadTo,
  'checked-for': SIGN_IN.checkedFor,
  'correct-for': SIGN_IN.codeCorrectFor,
  'locked-for': SIGN_IN.lockedFor,
};

const CODE_ERROR: Record<CodeError, MessageRef> = {
  wrong: SIGN_IN.wrongError,
  short: SIGN_IN.enterAllDigits,
};

const PRIMARY: Record<PrimaryLabel, MessageRef> = {
  verify: SIGN_IN.verifyAndSignIn,
  'try-again': SIGN_IN.tryAgain,
  'send-new': SIGN_IN.sendNewCode,
  'send-again': SIGN_IN.sendItAgain,
  'call-me': SIGN_IN.callMeWithCode,
  'call-again': SIGN_IN.callAgain,
  'sign-in-by-number': COMPANY_SIGNUP.signInWithThisNumber,
};

const RESEND: Record<ResendLabel, MessageRef> = {
  'send-new': SIGN_IN.sendNewCode,
  'send-sms-again': SIGN_IN.sendSmsAgain,
};

const FOOT: Record<FootLine, MessageRef> = {
  'auth-error': SIGN_IN.authErrorFoot,
  'tries-left': SIGN_IN.triesLeft,
};

const EXPLAINER: Record<
  FrameExplainer,
  { readonly label: MessageRef; readonly title: MessageRef; readonly page: MessageRef }
> = {
  'code-limits': {
    label: SIGN_IN.codeLimitsExplainerLabel,
    title: SIGN_IN.codeLimitsExplainerTitle,
    page: SIGN_IN.codeLimitsExplainerPage,
  },
};

/**
 * The Google control a code frame carries: the locked frame says why it still works (`M01-04`);
 * a taken phone offers another login and needs no sentence.
 */
interface GoogleCopy {
  readonly sentence: MessageRef | null;
  readonly label: MessageRef;
  readonly aria: MessageRef;
}

const GOOGLE: Record<GoogleLabel, GoogleCopy> = {
  continue: {
    sentence: SIGN_IN.lockedGoogleSentence,
    label: SIGN_IN.continueWithGoogle,
    aria: SIGN_IN.continueWithGoogleLabel,
  },
  'use-another': {
    sentence: null,
    label: SIGN_IN.useAnotherGoogle,
    aria: SIGN_IN.useAnotherGoogle,
  },
};

/** The facts a sentence fills in — the numbers that move. */
export interface SignInFacts {
  readonly cooldownLeft: number;
  readonly triesLeft: number;
}

/** The one word the two doors say differently: what a verified code leads to (`SCR-M01-02`). */
export interface SignInLabels {
  readonly verify?: MessageRef;
}

/** Every string a code frame draws; `null` where the frame has no such part. */
export interface SignInWords {
  readonly title: string;
  readonly sub: string;
  readonly block: { readonly tone: FrameTone; readonly title: string } | null;
  /** The rule behind the frame, in an Explainer beside the title; `null` when the frame has none. */
  readonly explainer: {
    readonly label: string;
    readonly title: string;
    readonly page: string;
  } | null;
  readonly codeError: string | null;
  readonly primary: string | null;
  /** The primary's accessible name where it says more than its label; `null` where the label is enough. */
  readonly primaryAria: string | null;
  readonly resend: string | null;
  /** The resend gap, in the waiting control's own label ("Resend code in 0:24") and its spoken name. */
  readonly wait: { readonly label: string; readonly spoken: string } | null;
  readonly call: string | null;
  readonly foot: string | null;
  /** "Links {email}" under the number while a Google login is being linked. */
  readonly links: string | null;
  readonly google: {
    readonly sentence: string | null;
    readonly label: string;
    readonly aria: string;
  } | null;
}

export function signInWords(
  translate: Translator['t'],
  frame: LoginFrame,
  facts: SignInFacts,
  labels: SignInLabels = {},
): SignInWords {
  const values = {
    ...POLICY_VALUES,
    seconds: facts.cooldownLeft,
    left: facts.triesLeft,
    email: frame.linkedEmail ?? '',
  };
  const t = (message: MessageRef, more: Record<string, string> = {}) =>
    translate(message, { ...values, ...more });
  const { title, block } = FRAME[frame.kind];
  const { resend, google } = frame;
  return {
    title: t(title),
    sub: t(SUB[frame.sub]),
    block: block === null ? null : { tone: block.tone, title: t(block.title) },
    explainer: explainerWords(frame.explainer, t),
    codeError: frame.codeError === null ? null : t(CODE_ERROR[frame.codeError]),
    primary: frame.primary === null ? null : t(primaryOf(frame.primary.label, labels)),
    primaryAria: primaryAriaOf(frame, t),
    resend: resend?.kind === 'live' ? t(RESEND[resend.label]) : null,
    wait:
      resend?.kind === 'wait'
        ? {
            label: t(SIGN_IN.resendIn, { time: countdownClock(facts.cooldownLeft) }),
            spoken: t(SIGN_IN.resendInLabel),
          }
        : null,
    call: frame.callOffered ? t(SIGN_IN.getCodeByCall) : null,
    foot: frame.foot === null ? null : t(FOOT[frame.foot]),
    links: frame.linkedEmail === null ? null : t(SIGN_IN.linksEmail),
    google: google === null ? null : googleWords(GOOGLE[google], t),
  };
}

function explainerWords(
  explainer: FrameExplainer | null,
  t: (message: MessageRef) => string,
): SignInWords['explainer'] {
  if (explainer === null) return null;
  const { label, title, page } = EXPLAINER[explainer];
  return { label: t(label), title: t(title), page: t(page) };
}

function googleWords(copy: GoogleCopy, t: (message: MessageRef) => string): SignInWords['google'] {
  const { sentence, label, aria } = copy;
  return { sentence: sentence === null ? null : t(sentence), label: t(label), aria: t(aria) };
}

function primaryAriaOf(frame: LoginFrame, t: (message: MessageRef) => string): string | null {
  if (frame.primary?.label === 'sign-in-by-number') return t(SIGN_IN.signInWithThisNumberLabel);
  if (frame.primary?.label === 'verify' && frame.linkedEmail !== null) {
    return t(SIGN_IN.verifyAndLinkLabel);
  }
  return null;
}

function primaryOf(label: PrimaryLabel, labels: SignInLabels): MessageRef {
  return label === 'verify' && labels.verify !== undefined ? labels.verify : PRIMARY[label];
}
