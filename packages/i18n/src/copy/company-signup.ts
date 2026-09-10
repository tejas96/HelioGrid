/**
 * Every sentence company signup says (`SCR-M01-02`, all states), authored once for both
 * platforms (Law 11) and translated in three languages (`F3-07`). The number and code steps are
 * the front door's (`SIGN_IN`) with these words where the doors differ; the export's frames are
 * the source, and the places the words were corrected are recorded in `T-M01-036`. The join
 * steer's words arrive with `T-M01-035`.
 */
import type { CreateTenant } from '@heliogrid/contracts';
import type { MessageRef } from '../runtime';

export const COMPANY_SIGNUP = {
  createYourCompany: /*i18n*/ { id: 'Create your company' },
  intro: /*i18n*/ {
    id: 'Your mobile number becomes your HelioGrid account. Two steps to verify it, then three details about your company — that is the whole signup.',
  },
  nothingElse: /*i18n*/ {
    id: 'Nothing else is asked for here — no tax registration, no logo, no price book, no team, no card.',
  },
  alreadyOnHelioGrid: /*i18n*/ { id: 'Already on HelioGrid?' },
  signInInstead: /*i18n*/ { id: 'Sign in instead' },
  flowLabel: /*i18n*/ { id: 'Create a company' },
  stepYourNumber: /*i18n*/ { id: 'Your number' },
  stepCode: /*i18n*/ { id: 'Code' },
  stepYourCompany: /*i18n*/ { id: 'Your company' },
  verifyAndContinue: /*i18n*/ { id: 'Verify and continue' },
  codeMakesTheAccount: /*i18n*/ {
    id: 'Verifying the code makes the account. The company itself is created by the next step, and until then nothing has been written down.',
  },
  yourCompany: /*i18n*/ { id: 'Your company' },
  threeThings: /*i18n*/ {
    id: "Three things, and you're in. Everything else comes later, inside the product.",
  },
  yourAccount: /*i18n*/ { id: 'Your account' },
  verified: /*i18n*/ { id: 'Verified' },
  companyName: /*i18n*/ { id: 'Company name' },
  companyNameExample: /*i18n*/ { id: 'Suryodaya Solar Solutions' },
  yourName: /*i18n*/ { id: 'Your name' },
  yourNameExample: /*i18n*/ { id: 'Rajesh Kulkarni' },
  firstOwner: /*i18n*/ { id: "You become this company's first EPC owner." },
  city: /*i18n*/ { id: 'City' },
  cityExample: /*i18n*/ { id: 'Pune' },
  whereBased: /*i18n*/ { id: "Where you're based." },
  createCompany: /*i18n*/ { id: 'Create company' },
  creatingYourCompany: /*i18n*/ { id: 'Creating your company' },
  writtenNow: /*i18n*/ {
    id: 'These three are being written now, so they are facts rather than fields for the moment — nothing can change under the write, and nothing is greyed out to say so.',
  },
  couldNotCreate: /*i18n*/ { id: 'We could not create the company' },
  nothingCreated: /*i18n*/ {
    id: 'Nothing was created, so trying again cannot make two companies. Your number is still verified and your three details are still here.',
  },
  errorFoot: /*i18n*/ {
    id: 'No error code reaches a field user. If it keeps failing, signing in later with this number returns you to exactly this step.',
  },
  knownTitle: /*i18n*/ { id: 'That number already has an account' },
  knownIntro: /*i18n*/ {
    id: 'Signing in takes you to the company it belongs to. One number is one account, whichever door it walks in through.',
  },
  knownBlockTitle: /*i18n*/ { id: 'Signing up again would not make a second company' },
  knownBlockBody: /*i18n*/ {
    id: 'If your company already has a workspace and you want your own login inside it, ask its owner to invite you — that keeps one company, one workspace.',
  },
  signInWithThisNumber: /*i18n*/ { id: 'Sign in with this number' },
  useDifferentNumber: /*i18n*/ { id: 'Use a different number' },
  welcomeBack: /*i18n*/ { id: 'Welcome back — carry on' },
  resumeLine: /*i18n*/ {
    id: 'Your number is verified and no company was created — so there is nothing to redo and no second workspace waiting to be cleaned up.',
  },
} as const;

export type CompanySignupCopyKey = keyof typeof COMPANY_SIGNUP;

/**
 * Why each company detail is needed, said on the field when it is missing — never a scold
 * (`SCR-M01-02`, the fields-invalid state). A `Record` over the contract's three fields, so a
 * fourth field cannot arrive without its sentence.
 */
export const COMPANY_FIELD_NEEDED: Record<keyof CreateTenant, MessageRef> = {
  companyName: /*i18n*/ {
    id: 'A company name is needed — it goes on every quote and proposal you send.',
  },
  ownerName: /*i18n*/ { id: "Your name is needed — you become this company's first EPC owner." },
  city: /*i18n*/ { id: 'A city is needed — it is where your company is based.' },
};
