/**
 * The words of the company step's frames (`SCR-M01-02`): as it opens, resumed (`M01-10`), a field
 * refusing the press, writing, the company refused, and the create with no answer — authored once for both platforms
 * (Law 11), the same shape as `signInWords`. Nothing here chooses a frame: the screen says which
 * facts hold, and each sentence is looked up by its key.
 */
import type { CreateTenant } from '@heliogrid/contracts';
import type { WriteFailure } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { COMPANY_SIGNUP, companyFieldRefusal } from './company-signup';
import { SIGN_IN } from './sign-in';
import type { DoorBlockWords } from './sign-in-google';

/** The facts that pick the frame; the screen reads them from its own hook and form. */
export interface CompanySignupFrame {
  /** The person came back to a step already begun (`M01-10`). */
  readonly restored: boolean;
  /** The write is in flight. */
  readonly writing: boolean;
  /** How the last write ended without landing; `null` while it has not. */
  readonly failure: WriteFailure | null;
  /** Create company was pressed and a field refuses it: the frame answers on the fields. */
  readonly fieldRefused: boolean;
}

/** The line under a field on the step as it opens; `null` where the frame carries none. */
export interface CompanyFieldHelpers {
  readonly ownerName: string | null;
  /** The city's line, which stands only while City is empty: read it through `companyFieldWords`. */
  readonly cityWhileEmpty: string | null;
}

/**
 * The line under City (`SCR-M01-02` word plan): the step's, while City is empty or holds only
 * spaces. Under the join steer the fields carry no helpers at all.
 */
export function cityHelper(
  helpers: CompanyFieldHelpers | undefined,
  city: string,
): string | undefined {
  return city.trim() === '' ? (helpers?.cityWhileEmpty ?? undefined) : undefined;
}

/**
 * The name and the example of each company field. A `Record` over the contract's three fields, so
 * a fourth cannot arrive without its words.
 */
const COMPANY_FIELD: Record<
  keyof CreateTenant,
  { readonly label: MessageRef; readonly example: MessageRef }
> = {
  companyName: { label: COMPANY_SIGNUP.companyName, example: COMPANY_SIGNUP.companyNameExample },
  ownerName: { label: COMPANY_SIGNUP.yourName, example: COMPANY_SIGNUP.yourNameExample },
  city: { label: COMPANY_SIGNUP.city, example: COMPANY_SIGNUP.cityExample },
};

/** Every word one company field shows; `undefined` where it shows none. */
export interface CompanyFieldWords {
  readonly label: string;
  readonly placeholder: string;
  readonly helper: string | undefined;
  readonly error: string | undefined;
}

/**
 * One company field's words for what it holds now (`SCR-M01-02`, step 3 and the fields-invalid
 * state): its name, its example, the step's line under it and its answer to a press. Called by
 * the field's own binding with its own value and error, never by the step — a step that
 * re-rendered on each keystroke would drop typed characters on the phone. Under the join steer no
 * `helpers` are handed in and the fields carry no line.
 */
export function companyFieldWords(
  translate: Translator['t'],
  field: keyof CreateTenant,
  state: {
    readonly helpers: CompanyFieldHelpers | undefined;
    readonly value: string;
    readonly error: { readonly type?: string; readonly message?: string } | undefined;
  },
): CompanyFieldWords {
  return {
    label: translate(COMPANY_FIELD[field].label),
    placeholder: translate(COMPANY_FIELD[field].example),
    helper: lineUnder(field, state.helpers, state.value),
    error: companyFieldRefusal(translate, field, state.error),
  };
}

function lineUnder(
  field: keyof CreateTenant,
  helpers: CompanyFieldHelpers | undefined,
  value: string,
): string | undefined {
  if (field === 'city') return cityHelper(helpers, value);
  return field === 'ownerName' ? (helpers?.ownerName ?? undefined) : undefined;
}

/** The three values while they are written (`SCR-M01-02`, the loading state): each under its field's name. */
export function companyFacts(
  translate: Translator['t'],
  values: CreateTenant,
): readonly { readonly label: string; readonly value: string }[] {
  return [
    { label: translate(COMPANY_FIELD.companyName.label), value: values.companyName },
    { label: translate(COMPANY_FIELD.ownerName.label), value: values.ownerName },
    { label: translate(COMPANY_FIELD.city.label), value: values.city },
  ];
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
  readonly helpers: CompanyFieldHelpers;
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
    helpers: helpers(translate, frame),
  };
}

/** The step as it opens, or back from the steer: not resumed, and nothing answering a press. */
function asItOpens(frame: CompanySignupFrame): boolean {
  return !frame.restored && !frame.fieldRefused && frame.failure === null;
}

/** Both lines belong to the step as it opens; a resumed, refused or failed frame carries none. */
function helpers(t: Translator['t'], frame: CompanySignupFrame): CompanyFieldHelpers {
  if (!asItOpens(frame)) return { ownerName: null, cityWhileEmpty: null };
  return {
    ownerName: t(COMPANY_SIGNUP.firstOwner),
    cityWhileEmpty: t(COMPANY_SIGNUP.whereBased),
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
  const intro = frame.writing || frame.fieldRefused ? null : t(COMPANY_SIGNUP.threeThings);
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
