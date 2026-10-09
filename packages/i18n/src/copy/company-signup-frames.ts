/**
 * The words of the company step's five frames (`SCR-M01-02`): normal, resumed (`M01-10`),
 * writing, the company refused, and the create with no answer — authored once for both platforms
 * (Law 11), the same shape as `signInWords`. Nothing here chooses a frame: the screen says which
 * facts hold, and each sentence is looked up by its key.
 */
import type { WriteFailure } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { COMPANY_SIGNUP } from './company-signup';
import { SIGN_IN } from './sign-in';
import type { DoorBlockWords } from './sign-in-google';

/** The three facts that pick the frame; the screen reads them from its own hook. */
export interface CompanySignupFrame {
  /** The person came back to a step already begun (`M01-10`). */
  readonly restored: boolean;
  /** The write is in flight. */
  readonly writing: boolean;
  /** How the last write ended without landing; `null` while it has not. */
  readonly failure: WriteFailure | null;
}

export interface CompanySignupWords {
  readonly title: string;
  /** Follows the title on the normal frame only. */
  readonly intro: string | null;
  /** The primary's label: create, creating, or try again. */
  readonly primary: string;
  /** Above the held primary: what the write means while it runs, what to do if it keeps failing. */
  readonly caption: string | null;
  /** Under the heading after a write that did not land: what is known about it (`F8-36`). */
  readonly block: DoorBlockWords | null;
}

/** A write that did not land: refused, nothing was written; unanswered, it may have been. */
function failureBlock(
  t: Translator['t'],
  failure: WriteFailure | null,
  words: Record<WriteFailure, { readonly title: MessageRef; readonly body: MessageRef }>,
): DoorBlockWords | null {
  if (failure === null) return null;
  return { tone: 'danger', title: t(words[failure].title), body: t(words[failure].body) };
}

const CREATE_FAILURE = {
  failed: { title: SIGN_IN.ourSideFailed, body: COMPANY_SIGNUP.nothingCreated },
  unreached: { title: COMPANY_SIGNUP.noAnswer, body: COMPANY_SIGNUP.mayHaveBeenMade },
} as const;

const REQUEST_FAILURE = {
  failed: { title: COMPANY_SIGNUP.requestFailedTitle, body: COMPANY_SIGNUP.requestFailedBody },
  unreached: { title: COMPANY_SIGNUP.noAnswer, body: COMPANY_SIGNUP.requestMayHaveGone },
} as const;

export function companySignupWords(
  translate: Translator['t'],
  frame: CompanySignupFrame,
): CompanySignupWords {
  return {
    ...heading(translate, frame),
    primary: primaryLabel(translate, frame),
    caption: caption(translate, frame),
    block: failureBlock(translate, frame.failure, CREATE_FAILURE),
  };
}

/** The title over the fields; the intro follows it only on the normal frame. */
function heading(
  t: Translator['t'],
  frame: CompanySignupFrame,
): { title: string; intro: string | null } {
  if (frame.failure === 'failed') return { title: t(COMPANY_SIGNUP.couldNotCreate), intro: null };
  if (frame.failure === 'unreached')
    return { title: t(COMPANY_SIGNUP.couldNotConfirm), intro: null };
  if (frame.restored) return { title: t(COMPANY_SIGNUP.welcomeBack), intro: null };
  const intro = frame.writing ? null : t(COMPANY_SIGNUP.threeThings);
  return { title: t(COMPANY_SIGNUP.yourCompany), intro };
}

function primaryLabel(t: Translator['t'], frame: CompanySignupFrame): string {
  if (frame.writing) return t(COMPANY_SIGNUP.creatingYourCompany);
  return frame.failure === null ? t(COMPANY_SIGNUP.createCompany) : t(SIGN_IN.tryAgain);
}

function caption(t: Translator['t'], frame: CompanySignupFrame): string | null {
  if (frame.writing) return t(COMPANY_SIGNUP.writtenNow);
  return frame.failure === null ? null : t(COMPANY_SIGNUP.errorFoot);
}

/** The join steer's finding: the company found, and where a request goes. */
export interface JoinBlockWords {
  readonly title: string;
  readonly body: string;
}

/**
 * The join steer's primary, and the failure it carries (`M01-09`, `SCR-M01-02` decisions 23–24):
 * the request, or — after one that did not land — sending it again, with what is known said in a
 * block under the heading while the rest of the steer stays whole: refused, nothing was sent;
 * unanswered, it may already be with the owner, and nothing is promised about sending again.
 */
export function joinSteerWords(
  translate: Translator['t'],
  failure: WriteFailure | null,
): { primary: string; failure: DoorBlockWords | null } {
  const primary = failure === null ? COMPANY_SIGNUP.requestToJoin : COMPANY_SIGNUP.sendRequestAgain;
  return {
    primary: translate(primary),
    failure: failureBlock(translate, failure, REQUEST_FAILURE),
  };
}

/** A space inside a number becomes one a line never breaks at: a number is read as one token. */
const NO_BREAK_SPACE = '\u00a0';

/**
 * The join steer's finding (`M01-09`, `SCR-M01-02` decision 18): the company and its city, and
 * where a request goes — its owner, never a name. The number arrives grouped and is kept on one
 * line, so a narrow screen never breaks it after its dial code.
 */
export function joinSteerFinding(
  translate: Translator['t'],
  company: { readonly companyName: string; readonly city: string },
  groupedPhone: string,
): JoinBlockWords {
  return {
    title: translate(COMPANY_SIGNUP.joinFound, {
      company: company.companyName,
      city: company.city,
    }),
    body: translate(COMPANY_SIGNUP.joinSends, {
      phone: groupedPhone.replaceAll(' ', NO_BREAK_SPACE),
    }),
  };
}
