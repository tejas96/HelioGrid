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
