/**
 * The words of the company step's four frames (`SCR-M01-02`): normal, resumed (`M01-10`),
 * writing, and the company not created — authored once for both platforms (Law 11), the same
 * shape as `signInWords`. Nothing here chooses a frame: the screen says which three facts hold,
 * and each sentence is looked up by its key.
 */
import type { Translator } from '../runtime';
import { COMPANY_SIGNUP } from './company-signup';
import { SIGN_IN } from './sign-in';

/** The three facts that pick the frame; the screen reads them from its own hook. */
export interface CompanySignupFrame {
  /** The person came back to a step already begun (`M01-10`). */
  readonly restored: boolean;
  /** The write is in flight. */
  readonly writing: boolean;
  /** The last write was refused, and nothing was created. */
  readonly failed: boolean;
}

export interface CompanySignupWords {
  readonly title: string;
  /** Follows the title on the normal frame only. */
  readonly intro: string | null;
  /** The primary's label: create, creating, or try again. */
  readonly primary: string;
  /** Under the primary: what the write means while it runs, what a refusal did not do. */
  readonly caption: string | null;
}

export function companySignupWords(
  translate: Translator['t'],
  frame: CompanySignupFrame,
): CompanySignupWords {
  return {
    ...heading(translate, frame),
    primary: primaryLabel(translate, frame),
    caption: caption(translate, frame),
  };
}

/** The title over the fields; the intro follows it only on the normal frame. */
function heading(
  t: Translator['t'],
  frame: CompanySignupFrame,
): { title: string; intro: string | null } {
  if (frame.failed) return { title: t(COMPANY_SIGNUP.couldNotCreate), intro: null };
  if (frame.restored) return { title: t(COMPANY_SIGNUP.welcomeBack), intro: null };
  const intro = frame.writing ? null : t(COMPANY_SIGNUP.threeThings);
  return { title: t(COMPANY_SIGNUP.yourCompany), intro };
}

function primaryLabel(t: Translator['t'], frame: CompanySignupFrame): string {
  if (frame.writing) return t(COMPANY_SIGNUP.creatingYourCompany);
  return frame.failed ? t(SIGN_IN.tryAgain) : t(COMPANY_SIGNUP.createCompany);
}

function caption(t: Translator['t'], frame: CompanySignupFrame): string | null {
  if (frame.writing) return t(COMPANY_SIGNUP.writtenNow);
  return frame.failed ? t(COMPANY_SIGNUP.errorFoot) : null;
}

/** A statement block's words — the steer's finding, or the request that did not go through. */
export interface JoinBlockWords {
  readonly title: string;
  readonly body: string;
}

/**
 * The join steer's primary, and the failure it carries (`M01-09`, `SCR-M01-02` decision 25): the
 * request, or — after one that did not go through, with nothing sent — sending it again, with the
 * failure said in a block under the heading while the rest of the steer stays whole.
 */
export function joinSteerWords(
  translate: Translator['t'],
  failed: boolean,
): { primary: string; failure: JoinBlockWords | null } {
  if (!failed) return { primary: translate(COMPANY_SIGNUP.requestToJoin), failure: null };
  return {
    primary: translate(COMPANY_SIGNUP.sendRequestAgain),
    failure: {
      title: translate(COMPANY_SIGNUP.requestFailedTitle),
      body: translate(COMPANY_SIGNUP.requestFailedBody),
    },
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
