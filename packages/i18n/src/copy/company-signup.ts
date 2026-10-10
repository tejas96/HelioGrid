/**
 * Every sentence company signup says (`SCR-M01-02`, all states), authored once for both
 * platforms (Law 11) and translated in three languages (`F3-07`). The number and code steps are
 * the front door's (`SIGN_IN`) with these words where the doors differ; the export's frames are
 * the source, and the places the words were corrected are recorded in `T-M01-036`. The join
 * steer and the request-sent state are `T-M01-035`'s (`M01-09`).
 */
import type { CreateTenant } from '@heliogrid/contracts';
import type { MessageRef, Translator } from '../runtime';
import type { ExplainerWords } from './explainer';

export const COMPANY_SIGNUP = {
  createYourCompany: /*i18n*/ { id: 'Create your company' },
  intro: /*i18n*/ { id: 'Verify your number, then add three company details.' },
  numberHelper: /*i18n*/ { id: "We'll send a code by SMS." },
  asksLabel: /*i18n*/ { id: 'About what signup asks for' },
  asksTitle: /*i18n*/ { id: 'What signup asks for' },
  asksAccount: /*i18n*/ { id: 'Your mobile number becomes your HelioGrid account.' },
  asksNothingElse: /*i18n*/ {
    id: 'Nothing else is asked for here — no tax registration, logo, price book, team or card. Those come later, inside the product.',
  },
  alreadyOnHelioGrid: /*i18n*/ { id: 'Already on HelioGrid?' },
  signInInstead: /*i18n*/ { id: 'Sign in instead' },
  flowLabel: /*i18n*/ { id: 'Create a company' },
  stepYourNumber: /*i18n*/ { id: 'Your number' },
  stepCode: /*i18n*/ { id: 'Code' },
  stepYourCompany: /*i18n*/ { id: 'Your company' },
  verifyAndContinue: /*i18n*/ { id: 'Verify and continue' },
  codeHelper: /*i18n*/ { id: 'You can paste the whole code.' },
  codeDoesLabel: /*i18n*/ { id: 'About what the code does' },
  codeDoesTitle: /*i18n*/ { id: 'What the code does' },
  codeMakesTheAccount: /*i18n*/ {
    id: 'Verifying the code creates your account. Your company is created at the next step.',
  },
  yourCompany: /*i18n*/ { id: 'Your company' },
  threeThings: /*i18n*/ { id: "Three details, and you're in." },
  yourAccount: /*i18n*/ { id: 'Your account' },
  verified: /*i18n*/ { id: 'Verified' },
  companyName: /*i18n*/ { id: 'Company name' },
  companyNameExample: /*i18n*/ { id: 'Suryodaya Solar Solutions' },
  yourName: /*i18n*/ { id: 'Your name' },
  yourNameExample: /*i18n*/ { id: 'Rajesh Kulkarni' },
  firstOwner: /*i18n*/ { id: 'You become the first EPC owner.' },
  city: /*i18n*/ { id: 'City' },
  cityExample: /*i18n*/ { id: 'Pune' },
  whereBased: /*i18n*/ { id: "Where you're based." },
  createCompany: /*i18n*/ { id: 'Create company' },
  creatingYourCompany: /*i18n*/ { id: 'Creating your company' },
  writtenNow: /*i18n*/ { id: 'Writing these three details now.' },
  couldNotCreate: /*i18n*/ { id: 'We could not create the company' },
  nothingCreated: /*i18n*/ { id: 'Nothing was created, so trying again is safe.' },
  couldNotConfirm: /*i18n*/ { id: 'We could not confirm the company' },
  noAnswer: /*i18n*/ { id: 'We did not hear back' },
  mayHaveBeenMade: /*i18n*/ {
    id: 'Your company may have been made — trying again cannot make a second.',
  },
  errorFoot: /*i18n*/ { id: 'If it keeps failing, sign in later to carry on.' },
  knownTitle: /*i18n*/ { id: 'That number already has an account' },
  knownIntro: /*i18n*/ { id: 'Sign in to reach the company it belongs to.' },
  oneAccountLabel: /*i18n*/ { id: 'About one account per number' },
  oneAccountTitle: /*i18n*/ { id: 'One number, one account' },
  oneAccountPage: /*i18n*/ {
    id: 'One mobile number is one HelioGrid account, whichever way you come in.',
  },
  knownBlockTitle: /*i18n*/ { id: 'Signing up again would not make a second company' },
  knownBlockBody: /*i18n*/ { id: 'To join another company, ask its owner to invite you.' },
  signInWithThisNumber: /*i18n*/ { id: 'Sign in with this number' },
  useDifferentNumber: /*i18n*/ { id: 'Use a different number' },
  welcomeBack: /*i18n*/ { id: 'Welcome back — carry on' },
  resumeLine: /*i18n*/ { id: 'No company was made yet — carry on from here.' },
  joinTitle: /*i18n*/ { id: 'This company may already be here' },
  joinFound: /*i18n*/ { id: 'A workspace already exists for {company} in {city}' },
  joinSends: /*i18n*/ { id: 'Asking to join sends its owner a request to add {phone}.' },
  requestToJoin: /*i18n*/ { id: 'Request to join' },
  requestToJoinLabel: /*i18n*/ { id: 'Request to join the existing {company} workspace' },
  createAnyway: /*i18n*/ { id: 'Create a new company anyway' },
  requestFailedTitle: /*i18n*/ { id: 'Your request did not go through' },
  requestFailedBody: /*i18n*/ { id: 'Something on our side failed, so nothing was sent.' },
  requestMayHaveGone: /*i18n*/ { id: 'Your request may already be with the owner.' },
  sendRequestAgain: /*i18n*/ { id: 'Send the request again' },
  sentTitle: /*i18n*/ { id: 'Your request is with the owner' },
  sentBody: /*i18n*/ {
    id: 'When the owner of {company}, {city} adds you, an SMS to your number brings you straight in.',
  },
  sentAs: /*i18n*/ { id: 'Sent as' },
  changedMind: /*i18n*/ { id: 'Changed your mind, or it is not the same company?' },
  createOwnInstead: /*i18n*/ { id: 'Create your own company instead' },
} as const;

export type CompanySignupCopyKey = keyof typeof COMPANY_SIGNUP;

/**
 * The rules signup keeps off its frames, each in the `Explainer` beside the heading it explains
 * (`SCR-M01-02` word plan): what the number buys and that nothing else is asked, when the account
 * and the company are made, and that one number is one account.
 */
export interface SignupExplainers {
  readonly whatSignupAsks: ExplainerWords;
  readonly whatTheCodeDoes: ExplainerWords;
  readonly oneNumberOneAccount: ExplainerWords;
}

export function signupExplainers(translate: Translator['t']): SignupExplainers {
  return {
    whatSignupAsks: {
      label: translate(COMPANY_SIGNUP.asksLabel),
      title: translate(COMPANY_SIGNUP.asksTitle),
      pages: [translate(COMPANY_SIGNUP.asksAccount), translate(COMPANY_SIGNUP.asksNothingElse)],
    },
    whatTheCodeDoes: {
      label: translate(COMPANY_SIGNUP.codeDoesLabel),
      title: translate(COMPANY_SIGNUP.codeDoesTitle),
      pages: [translate(COMPANY_SIGNUP.codeMakesTheAccount)],
    },
    oneNumberOneAccount: {
      label: translate(COMPANY_SIGNUP.oneAccountLabel),
      title: translate(COMPANY_SIGNUP.oneAccountTitle),
      pages: [translate(COMPANY_SIGNUP.oneAccountPage)],
    },
  };
}

/**
 * Why each company detail is needed, said on the field when it is missing — never a scold
 * (`SCR-M01-02`, the fields-invalid state). A `Record` over the contract's three fields, so a
 * fourth field cannot arrive without its sentence.
 */
export const COMPANY_FIELD_NEEDED: Record<keyof CreateTenant, MessageRef> = {
  companyName: /*i18n*/ {
    id: 'A company name is needed — it goes on every proposal you send.',
  },
  ownerName: /*i18n*/ { id: "Your name is needed — you become this company's first EPC owner." },
  city: /*i18n*/ { id: 'A city is needed — it is where your company is based.' },
};

/** The refusal types that mean nothing was typed — the forms layer's own codes for an empty field. */
const MISSING_VALUE = new Set(['too_small', 'invalid_type']);

/**
 * What a company field says under itself when Create company is pressed: a missing detail says
 * why it is needed, never a scold (`COMPANY_FIELD_NEEDED`); any other refusal keeps the wire's
 * words. Both platforms' fields call this, so the rule is written once (Law 11).
 */
export function companyFieldRefusal(
  translate: Translator['t'],
  field: keyof CreateTenant,
  error: { readonly type?: string; readonly message?: string } | undefined,
): string | undefined {
  if (error === undefined) return undefined;
  if (MISSING_VALUE.has(String(error.type))) return translate(COMPANY_FIELD_NEEDED[field]);
  return error.message;
}
