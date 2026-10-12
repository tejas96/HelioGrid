/**
 * The words the company profile's setup life draws (`SCR-M01-05`), picked by state from
 * `COMPANY_PROFILE`. The component picks no word by state; it draws what this returns. The tax
 * label, the bank-routing label and the format line arrive as facts, in the reader's language.
 */
import {
  COMPANY_PROFILE_PARTS,
  type CompanyLetterhead,
  type CompanyProfilePart,
  type CompanyProfileStanding,
  type StandingMark,
  standingMark,
  TENANT_SEGMENTS,
  type TenantSegment,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import {
  type CompanyLogoCapture,
  type CompanyLogoCaptureFacts,
  companyLogoCapture,
} from './company-logo';
import {
  COMPANY_PROFILE,
  COMPANY_PROFILE_PART_TITLE,
  COMPANY_PROFILE_SEGMENT_LINE,
  COMPANY_PROFILE_STANDING_WORD,
} from './company-profile';
import { COMPANY_SIGNUP } from './company-signup';
import { KWP, SETUP_WHAT_YOU_SELL, TENANT_SEGMENT_WORD } from './setup-what-you-sell';
import { SIGN_IN } from './sign-in';

export interface CompanyProfilePartWords {
  readonly key: CompanyProfilePart;
  readonly title: string;
  readonly standing: string;
  readonly mark: StandingMark;
}

export interface CompanyProfileOption {
  readonly value: TenantSegment;
  readonly title: string;
  readonly description: string;
}

/** Every word the setup life draws. A `null` is a line or an act the state does not have. */
export interface CompanyProfileWords {
  readonly title: string;
  readonly lede: string;
  readonly parts: readonly CompanyProfilePartWords[];
  readonly identity: { readonly companyName: string; readonly fromSignup: string };
  readonly address: {
    readonly street: string;
    readonly streetExample: string;
    readonly city: string;
    readonly fromSignup: string;
    readonly postalCode: string;
    readonly postalCodeExample: string;
    readonly purpose: string;
  };
  readonly tax: {
    readonly label: string;
    /** The market's format in one line: the field's help, and its error when `error` repeats it. */
    readonly format: string;
    readonly error: string | null;
    /** What was checked and what was not (`F8-03`) — printed whole. */
    readonly checked: string;
  };
  readonly bank: {
    readonly bankName: string;
    readonly bankNameExample: string;
    readonly accountHolder: string;
    readonly accountNumber: string;
    readonly accountNumberExample: string;
    readonly routing: string;
    readonly routingExample: string;
    readonly checked: string;
    readonly purpose: string;
  };
  readonly declarations: {
    readonly group: string;
    readonly options: readonly CompanyProfileOption[];
    readonly sizeLabel: string;
    readonly unit: string;
    readonly sizeHint: string;
    /** Where the size comes from — beside its tier. */
    readonly sizeSource: string;
  };
  /** The wide screen's preview: only what the fields hold; a `null` or an empty line is drawn as nothing. */
  readonly letterhead: {
    readonly overline: string;
    readonly logo: string;
    readonly name: string;
    readonly address: string;
    readonly taxLabel: string;
    /** The registration as typed; `owed` while it does not read as the market's format. */
    readonly tax: { readonly value: string; readonly owed: boolean } | null;
    readonly bank: string;
    readonly bankLine: string | null;
  };
  /** The logo's capture area; none until a screen can upload one. */
  readonly logo: CompanyLogoCapture | null;
  /** The busy region's name while the record loads. */
  readonly loading: string | null;
  /** The profile could not be read: the message in the list's place. */
  readonly unread: {
    readonly title: string;
    readonly line: string;
    readonly retry: string;
    readonly onward: string;
    readonly onwardSpoken: string;
  } | null;
  /** The act and what stands at it; none when the profile could not be read — `unread` holds both ways. */
  readonly act: {
    readonly primary: string;
    readonly primarySpoken: string;
    /** Why the primary cannot be pressed yet. */
    readonly waiting: string | null;
    /** The way on without saving, after a failed save alone. */
    readonly secondary: string | null;
    readonly secondarySpoken: string | null;
    /** The failed save, said once, at the act. */
    readonly alert: string | null;
    /** The one line at the act: a consequence read before it. */
    readonly line: string | null;
  } | null;
}

/**
 * `status` — the read is still out, it answered, it failed, or the last save failed. `skipped` —
 * the step was skipped and the owner is back. `arrivedUndeclared` — the profile was read without
 * the two answers of the step before. `standings` — domain's `companyProfileStanding` for
 * each part. `open` — the part that is open. The three pack facts arrive in the reader's language.
 */
export interface CompanyProfileWordFacts {
  readonly status: 'loading' | 'ready' | 'unread' | 'save-failed';
  readonly skipped: boolean;
  readonly arrivedUndeclared: boolean;
  readonly standings: Readonly<Record<CompanyProfilePart, CompanyProfileStanding>>;
  readonly open: CompanyProfilePart | null;
  readonly city: string;
  readonly taxIdLabel: string;
  readonly taxFormat: string;
  readonly bankRoutingLabel: string;
  /** Domain's `companyLetterhead` for what the fields hold. */
  readonly letterhead: CompanyLetterhead;
  readonly logo: CompanyLogoCaptureFacts | null;
}

export function companyProfileWords(
  translate: Translator['t'],
  facts: CompanyProfileWordFacts,
): CompanyProfileWords {
  const { status, standings, city, taxIdLabel, taxFormat, bankRoutingLabel } = facts;
  const fromSignup = translate(COMPANY_PROFILE.fromSignup);
  const checked = translate(COMPANY_PROFILE.formatChecked);
  return {
    title: translate(COMPANY_PROFILE.title),
    lede: translate(lede(facts)),
    parts: COMPANY_PROFILE_PARTS.map((part) => ({
      key: part,
      title: translate(COMPANY_PROFILE_PART_TITLE[part]),
      standing: translate(COMPANY_PROFILE_STANDING_WORD[standings[part]], { city }),
      mark: standingMark(standings[part]),
    })),
    identity: { companyName: translate(COMPANY_SIGNUP.companyName), fromSignup },
    address: {
      street: translate(COMPANY_PROFILE.street),
      streetExample: translate(COMPANY_PROFILE.streetExample),
      city: translate(COMPANY_SIGNUP.city),
      fromSignup,
      postalCode: translate(COMPANY_PROFILE.postalCode),
      postalCodeExample: translate(COMPANY_PROFILE.postalCodeExample),
      purpose: translate(COMPANY_PROFILE.addressPurpose),
    },
    tax: {
      label: translate(COMPANY_PROFILE.optional, { label: taxIdLabel }),
      format: taxFormat,
      error: standings.tax === 'check_format' ? taxFormat : null,
      checked,
    },
    bank: {
      bankName: translate(COMPANY_PROFILE.bankName),
      bankNameExample: translate(COMPANY_PROFILE.bankNameExample),
      accountHolder: translate(COMPANY_PROFILE.accountHolder),
      accountNumber: translate(COMPANY_PROFILE.accountNumber),
      accountNumberExample: translate(COMPANY_PROFILE.accountNumberExample),
      routing: bankRoutingLabel,
      routingExample: translate(COMPANY_PROFILE.routingExample),
      checked,
      purpose: translate(COMPANY_PROFILE.bankPurpose),
    },
    declarations: {
      group: translate(COMPANY_PROFILE.group),
      options: TENANT_SEGMENTS.map((segment) => ({
        value: segment,
        title: translate(TENANT_SEGMENT_WORD[segment]),
        description: translate(COMPANY_PROFILE_SEGMENT_LINE[segment]),
      })),
      sizeLabel: translate(SETUP_WHAT_YOU_SELL.sizeLabel),
      unit: KWP,
      sizeHint: translate(COMPANY_PROFILE.sizeHint),
      sizeSource: translate(SETUP_WHAT_YOU_SELL.declaredByYou),
    },
    letterhead: letterheadWords(translate, facts),
    logo: facts.logo === null ? null : companyLogoCapture(translate, facts.logo),
    loading: status === 'loading' ? translate(COMPANY_PROFILE.loading) : null,
    unread: status === 'unread' ? unreadWords(translate) : null,
    act: status === 'unread' ? null : actWords(translate, facts),
  };
}

/** Until the profile is read nothing is known to be on it, whatever the screen was handed. */
const NOTHING_READ: CompanyLetterhead = {
  companyName: '',
  addressLine: '',
  registration: null,
  bank: null,
};

function letterheadWords(
  translate: Translator['t'],
  { status, letterhead, taxIdLabel }: CompanyProfileWordFacts,
): CompanyProfileWords['letterhead'] {
  const { companyName, addressLine, registration, bank } =
    status === 'ready' || status === 'save-failed' ? letterhead : NOTHING_READ;
  return {
    overline: translate(COMPANY_PROFILE.letterhead),
    logo: translate(COMPANY_PROFILE.letterheadLogo),
    name: companyName,
    address: addressLine,
    taxLabel: taxIdLabel,
    tax:
      registration === null ? null : { value: registration.value, owed: !registration.wellFormed },
    bank: translate(COMPANY_PROFILE.letterheadBank),
    bankLine:
      bank === null
        ? null
        : translate(COMPANY_PROFILE.letterheadBankLine, {
            bankName: bank.bankName,
            ending: bank.accountEnding,
          }),
  };
}

function unreadWords(translate: Translator['t']): NonNullable<CompanyProfileWords['unread']> {
  return {
    title: translate(COMPANY_PROFILE.unreadTitle),
    line: translate(COMPANY_PROFILE.unreadLine),
    retry: translate(SIGN_IN.tryAgain),
    onward: translate(COMPANY_PROFILE.onward),
    onwardSpoken: translate(COMPANY_PROFILE.onwardUnreadSpoken),
  };
}

function actWords(
  translate: Translator['t'],
  facts: CompanyProfileWordFacts,
): NonNullable<CompanyProfileWords['act']> {
  const saveFailed = facts.status === 'save-failed';
  return {
    primary: translate(saveFailed ? SIGN_IN.tryAgain : COMPANY_PROFILE.save),
    primarySpoken: translate(
      saveFailed ? COMPANY_PROFILE.retrySaveSpoken : COMPANY_PROFILE.saveSpoken,
    ),
    waiting: facts.status === 'loading' ? translate(COMPANY_PROFILE.stillLoading) : null,
    secondary: saveFailed ? translate(COMPANY_PROFILE.onward) : null,
    secondarySpoken: saveFailed ? translate(COMPANY_PROFILE.onwardUnsavedSpoken) : null,
    alert: saveFailed ? translate(COMPANY_PROFILE.notSaved) : null,
    line: actLine(translate, facts),
  };
}

/**
 * One lede: a failed save of the step before outranks a skip, since it names what is missing.
 * Only a profile that was read says either — until then nothing is known to be missing, and a
 * failed save here is the alert's alone. The step before is named only while its answers are
 * still missing as they were read: an answer the owner took out on this screen was saved there.
 */
function lede(facts: CompanyProfileWordFacts): MessageRef {
  if (facts.status !== 'ready') return COMPANY_PROFILE.lede;
  if (facts.arrivedUndeclared && facts.standings.declarations === 'not_declared') {
    return COMPANY_PROFILE.ledeNotSaved;
  }
  return facts.skipped ? COMPANY_PROFILE.ledeSkipped : COMPANY_PROFILE.lede;
}

/** Only a profile that was read keeps a line; an undeclared value's cost outranks the re-seed scope. */
function actLine(translate: Translator['t'], facts: CompanyProfileWordFacts): string | null {
  if (facts.status !== 'ready') return null;
  if (facts.standings.declarations === 'not_declared') {
    return translate(COMPANY_PROFILE.marketDefaults);
  }
  return facts.open === 'declarations' ? translate(COMPANY_PROFILE.reseedScope) : null;
}
