/**
 * The words of each code-step frame (`SCR-M01-01`, the `m-*` code family), keyed by the
 * vocabularies `packages/domain`'s `loginFrame` decides. Nothing here chooses: a frame's
 * structure is domain's, a sentence is looked up by its key, and the policy numbers a sentence
 * names arrive under one placeholder each.
 */
import {
  type CodeError,
  type CodeHelper,
  type FootLine,
  type FrameKind,
  type FrameTone,
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
  type WaitReason,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
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

interface FrameCopy {
  readonly title: MessageRef;
  readonly block: {
    readonly tone: FrameTone;
    readonly title: MessageRef;
    readonly body: MessageRef;
  } | null;
}

const OUR_SIDE = {
  tone: 'danger',
  title: SIGN_IN.ourSideFailed,
  body: SIGN_IN.requestFailedBody,
} as const;

const FRAME: Record<FrameKind, FrameCopy> = {
  'auth-error': {
    title: SIGN_IN.authErrorTitle,
    block: { tone: 'danger', title: SIGN_IN.ourSideFailed, body: SIGN_IN.authErrorBody },
  },
  locked: {
    title: SIGN_IN.lockedTitle,
    block: { tone: 'danger', title: SIGN_IN.lockedBlockTitle, body: SIGN_IN.lockedBlockBody },
  },
  'call-offer': { title: SIGN_IN.getCodeByCall, block: null },
  capped: {
    title: SIGN_IN.capTitle,
    block: { tone: 'warning', title: SIGN_IN.capBlockTitle, body: SIGN_IN.capBlockBody },
  },
  'delivery-failed': {
    title: SIGN_IN.notSentTitle,
    block: { tone: 'danger', title: SIGN_IN.notSentBlockTitle, body: SIGN_IN.notSentBlockBody },
  },
  'call-not-placed': {
    title: SIGN_IN.callNotPlacedTitle,
    block: {
      tone: 'danger',
      title: SIGN_IN.callNotPlacedBlockTitle,
      body: SIGN_IN.notSentBlockBody,
    },
  },
  'request-failed': { title: SIGN_IN.requestFailedTitle, block: OUR_SIDE },
  'call-request-failed': { title: SIGN_IN.couldNotCallTitle, block: OUR_SIDE },
  expired: {
    title: SIGN_IN.expiredTitle,
    block: { tone: 'warning', title: SIGN_IN.expiredBlockTitle, body: SIGN_IN.expiredBlockBody },
  },
  'used-up': {
    title: SIGN_IN.usedUpTitle,
    block: { tone: 'warning', title: SIGN_IN.usedUpBlockTitle, body: SIGN_IN.usedUpBlockBody },
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
  'locked-for': SIGN_IN.lockedFor,
};

const HELPER: Record<CodeHelper, MessageRef> = {
  'no-code-yet': SIGN_IN.noCodeYet,
  'nothing-until-new': SIGN_IN.nothingUntilNew,
  locked: SIGN_IN.lockedHelper,
  'code-was-fine': SIGN_IN.codeWasFine,
  'sent-just-now': SIGN_IN.sentJustNow,
  'sent-moment-ago': SIGN_IN.sentMomentAgo,
  'answer-call': SIGN_IN.answerCall,
  'filled-from-sms': SIGN_IN.filledFromSms,
  'paste-whole': SIGN_IN.pasteWhole,
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
};

const RESEND: Record<ResendLabel, MessageRef> = {
  'send-new': SIGN_IN.sendNewCode,
  'send-sms-again': SIGN_IN.sendSmsAgain,
};

const WAIT: Record<WaitReason, MessageRef> = {
  first: SIGN_IN.waitFirst,
  again: SIGN_IN.waitAgain,
  short: SIGN_IN.waitShort,
  cap: SIGN_IN.capResendReason,
  locked: SIGN_IN.lockedResendReason,
};

const FOOT: Record<FootLine, MessageRef> = {
  'auth-error': SIGN_IN.authErrorFoot,
  locked: SIGN_IN.lockedFoot,
  cap: SIGN_IN.capFoot,
  'not-sent': SIGN_IN.notSentFoot,
  call: SIGN_IN.callFoot,
  'tries-left': SIGN_IN.triesLeft,
  'only-some-phones': SIGN_IN.onlySomePhones,
  'code-works-for': SIGN_IN.codeWorksFor,
  'wait-stops': SIGN_IN.waitStopsOnFailure,
};

/** The facts a sentence fills in — the numbers that move, and the number as the reader sees it. */
export interface SignInFacts {
  readonly cooldownLeft: number;
  readonly triesLeft: number;
  readonly phoneShown: string;
}

/** The one word the two doors say differently: what a verified code leads to (`SCR-M01-02`). */
export interface SignInLabels {
  readonly verify?: MessageRef;
}

/** Every string a code frame draws; `null` where the frame has no such part. */
export interface SignInWords {
  readonly title: string;
  readonly sub: string;
  readonly block: {
    readonly tone: FrameTone;
    readonly title: string;
    readonly body: string;
  } | null;
  readonly helper: string;
  readonly codeError: string | null;
  readonly primary: string | null;
  readonly resend: string | null;
  readonly wait: string | null;
  readonly call: { readonly label: string; readonly note: string } | null;
  readonly foot: string | null;
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
    phone: facts.phoneShown,
  };
  const t = (message: MessageRef) => translate(message, values);
  const { title, block } = FRAME[frame.kind];
  const { resend } = frame;
  return {
    title: t(title),
    sub: t(SUB[frame.sub]),
    block: block === null ? null : { tone: block.tone, title: t(block.title), body: t(block.body) },
    helper: frame.helper === null ? '' : t(HELPER[frame.helper]),
    codeError: frame.codeError === null ? null : t(CODE_ERROR[frame.codeError]),
    primary: frame.primary === null ? null : t(primaryOf(frame.primary.label, labels)),
    resend: resend?.kind === 'live' ? t(RESEND[resend.label]) : null,
    wait: resend?.kind === 'wait' ? t(WAIT[resend.reason]) : null,
    call: frame.callOffered
      ? { label: t(SIGN_IN.getCodeByCall), note: t(SIGN_IN.weCallNote) }
      : null,
    foot: frame.foot === null ? null : t(FOOT[frame.foot]),
  };
}

function primaryOf(label: PrimaryLabel, labels: SignInLabels): MessageRef {
  return label === 'verify' && labels.verify !== undefined ? labels.verify : PRIMARY[label];
}
