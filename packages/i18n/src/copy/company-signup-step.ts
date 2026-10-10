/**
 * Every word company signup's step 3 picks by what holds (`SCR-M01-02`): the plain step's frames,
 * and the join steer that takes the primary's place (`M01-09`) — authored once for both platforms
 * (Law 11). The screen says which facts hold; the step's component draws what this returns and
 * picks nothing.
 */
import type { WriteFailure } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { COMPANY_SIGNUP, type SignupStepsWords, signupStepsWords } from './company-signup';
import {
  type CompanyFieldHelpers,
  type CompanySignupFrame,
  companySignupWords,
  type JoinBlockWords,
  joinSteerFinding,
  joinSteerWords,
} from './company-signup-frames';
import type { DoorBlockWords } from './sign-in-google';

/** The facts that pick the step's frame; the screen reads them from its hooks and its form. */
export interface CompanyStepFrame extends CompanySignupFrame {
  /** The join steer over the step, or `null` on the plain step. */
  readonly steer: {
    readonly company: { readonly companyName: string; readonly city: string };
    /** The asker's own number, grouped as the market writes it. */
    readonly groupedPhone: string;
    /** How the last request ended without landing; `null` while it has not. */
    readonly failure: WriteFailure | null;
  } | null;
}

export interface CompanyStepWords {
  readonly steps: SignupStepsWords;
  readonly title: string;
  /** Follows the title on the step as it opens only. */
  readonly intro: string | null;
  /** A create or a request that did not land, under the heading: it says itself as it appears. */
  readonly block: DoorBlockWords | null;
  /** The verified number's label and chip; `null` where a block or the steer takes its place. */
  readonly account: { readonly label: string; readonly verified: string } | null;
  /** Under the account on a resumed step that has nothing else to say (`M01-10`). */
  readonly resumeLine: string | null;
  readonly caption: string | null;
  /** Create, creating or try again; under the steer the join road, named in full until a request fails. */
  readonly primary: { readonly label: string; readonly aria: string | undefined };
  /** The steer's finding and its second road; `null` on the plain step. */
  readonly steer: { readonly finding: JoinBlockWords; readonly createAnyway: string } | null;
  /** The lines under the fields, for `companyFieldWords`; under the steer the fields carry none. */
  readonly helpers: CompanyFieldHelpers | undefined;
}

/** A failure block answers a press, so it is spoken when it appears. */
function spoken(block: DoorBlockWords | null): DoorBlockWords | null {
  return block === null ? null : { ...block, announce: 'alert' };
}

export function companyStepWords(
  translate: Translator['t'],
  frame: CompanyStepFrame,
): CompanyStepWords {
  const steps = signupStepsWords(translate);
  if (frame.steer !== null) return { steps, ...underTheSteer(translate, frame.steer) };
  const words = companySignupWords(translate, frame);
  return {
    steps,
    title: words.title,
    intro: words.intro,
    block: spoken(words.block),
    account:
      words.block === null
        ? {
            label: translate(COMPANY_SIGNUP.yourAccount),
            verified: translate(COMPANY_SIGNUP.verified),
          }
        : null,
    resumeLine:
      frame.restored && frame.failure === null ? translate(COMPANY_SIGNUP.resumeLine) : null,
    caption: words.caption,
    primary: { label: words.primary, aria: undefined },
    steer: null,
    helpers: words.helpers,
  };
}

/** The steer keeps the fields and replaces everything said around them. */
function underTheSteer(
  translate: Translator['t'],
  steer: NonNullable<CompanyStepFrame['steer']>,
): Omit<CompanyStepWords, 'steps'> {
  const road = joinSteerWords(translate, steer.failure);
  return {
    title: translate(COMPANY_SIGNUP.joinTitle),
    intro: null,
    block: spoken(road.failure),
    account: null,
    resumeLine: null,
    caption: null,
    primary: {
      label: road.primary,
      aria:
        road.failure === null
          ? translate(COMPANY_SIGNUP.requestToJoinLabel, { company: steer.company.companyName })
          : undefined,
    },
    steer: {
      finding: joinSteerFinding(translate, steer.company, steer.groupedPhone),
      createAnyway: translate(COMPANY_SIGNUP.createAnyway),
    },
    helpers: undefined,
  };
}
