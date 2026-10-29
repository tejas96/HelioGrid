import type { TranslatedText } from '@heliogrid/contracts';
/**
 * The words of company signup's two frames off the flow (`SCR-M01-02`): the number that already
 * has an account (`M01-08`) and the request sent (`M01-09`) — authored once for both platforms
 * (Law 11). Neither frame picks a word by state; each component draws what its function returns.
 */
import type { ExplainerPagerWords } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { COMPANY_SIGNUP, signupExplainers } from './company-signup';
import { type ExplainerWords, explainerPagerWords } from './explainer';
import { SIGN_IN } from './sign-in';

export interface KnownNumberWords {
  readonly title: TranslatedText;
  /** The rule behind the finding — one number, one account — beside the title. */
  readonly explainer: ExplainerWords & ExplainerPagerWords;
  readonly intro: TranslatedText;
  /** What signing up again would not do, and the way into another company. */
  readonly finding: { readonly title: TranslatedText; readonly body: TranslatedText };
  readonly phoneLabel: TranslatedText;
  /** The road into the account the number has. */
  readonly enter: TranslatedText;
  /** The road back to step 1, for another number. */
  readonly leave: TranslatedText;
}

export function knownNumberWords(translate: Translator['t']): KnownNumberWords {
  return {
    title: translate(COMPANY_SIGNUP.knownTitle),
    explainer: {
      ...signupExplainers(translate).oneNumberOneAccount,
      ...explainerPagerWords(translate),
    },
    intro: translate(COMPANY_SIGNUP.knownIntro),
    finding: {
      title: translate(COMPANY_SIGNUP.knownBlockTitle),
      body: translate(COMPANY_SIGNUP.knownBlockBody),
    },
    phoneLabel: translate(SIGN_IN.mobileNumber),
    enter: translate(COMPANY_SIGNUP.signInWithThisNumber),
    leave: translate(COMPANY_SIGNUP.useDifferentNumber),
  };
}

export interface RequestSentWords {
  readonly title: TranslatedText;
  /** Whose owner holds the request, and how the answer arrives. */
  readonly body: TranslatedText;
  /** Over the asker's name and number. */
  readonly sentAs: TranslatedText;
  /** Over the one route back to creating. */
  readonly prompt: TranslatedText;
  readonly createInstead: TranslatedText;
}

export function requestSentWords(
  translate: Translator['t'],
  company: { readonly companyName: string; readonly city: string },
): RequestSentWords {
  return {
    title: translate(COMPANY_SIGNUP.sentTitle),
    body: translate(COMPANY_SIGNUP.sentBody, { company: company.companyName, city: company.city }),
    sentAs: translate(COMPANY_SIGNUP.sentAs),
    prompt: translate(COMPANY_SIGNUP.changedMind),
    createInstead: translate(COMPANY_SIGNUP.createOwnInstead),
  };
}
