import type { TranslatedText } from '@heliogrid/contracts';
/**
 * The words the company profile's setup life draws (`SCR-M01-05`), picked by state from
 * `COMPANY_PROFILE`. The component picks no word by state; it draws what this returns. The tax
 * label, the bank-routing label and the format line arrive as facts, in the reader's language.
 */
import {
  COMPANY_PROFILE_PARTS,
  type CompanyLetterhead,
  type CompanyProfileLife,
  type CompanyProfilePart,
  type CompanyProfileStanding,
  type ReadKind,
  type StandingMark,
  standingMark,
  TENANT_SEGMENTS,
  type TenantSegment,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { type CompanyLetterheadWords, companyLetterheadWords } from './company-letterhead-words';
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
import { settingsRowName } from './settings';
import { KWP, SETUP_WHAT_YOU_SELL, TENANT_SEGMENT_WORD } from './setup-what-you-sell';
import { SIGN_IN } from './sign-in';

export interface CompanyProfilePartWords {
  readonly key: CompanyProfilePart;
  readonly title: TranslatedText;
  readonly standing: TranslatedText;
  readonly mark: StandingMark;
}

export interface CompanyProfileOption {
  readonly value: TenantSegment;
  readonly title: TranslatedText;
  readonly description: TranslatedText;
}

/** Every word the setup life draws. A `null` is a line or an act the state does not have. */
export interface CompanyProfileWords {
  readonly title: TranslatedText;
  readonly lede: TranslatedText;
  readonly parts: readonly CompanyProfilePartWords[];
  readonly identity: { readonly companyName: TranslatedText; readonly fromSignup: TranslatedText };
  readonly address: {
    readonly street: TranslatedText;
    readonly streetExample: TranslatedText;
    readonly city: TranslatedText;
    readonly fromSignup: TranslatedText;
    readonly postalCode: TranslatedText;
    readonly postalCodeExample: TranslatedText;
    readonly purpose: TranslatedText;
  };
  readonly tax: {
    readonly label: TranslatedText;
    /** The market's format in one line: the field's help, and its error when `error` repeats it. */
    readonly format: string;
    readonly error: string | null;
    /** What was checked and what was not (`F8-03`) — printed whole. */
    readonly checked: TranslatedText;
  };
  readonly bank: {
    readonly bankName: TranslatedText;
    readonly bankNameExample: TranslatedText;
    readonly accountHolder: TranslatedText;
    readonly accountNumber: TranslatedText;
    readonly accountNumberExample: TranslatedText;
    readonly routing: string;
    readonly routingExample: TranslatedText;
    readonly checked: TranslatedText;
    readonly purpose: TranslatedText;
  };
  readonly declarations: {
    readonly group: TranslatedText;
    readonly options: readonly CompanyProfileOption[];
    readonly sizeLabel: TranslatedText;
    readonly unit: string;
    readonly sizeHint: TranslatedText;
    /** Where the size comes from — beside its tier. */
    readonly sizeSource: TranslatedText;
  };
  /** The wide screen's preview: only what the fields hold; a `null` or an empty line is drawn as nothing. */
  readonly letterhead: CompanyLetterheadWords;
  /** The logo's capture area; none until a screen can upload one. */
  readonly logo: CompanyLogoCapture | null;
  /** The busy region's name while the record loads. */
  readonly loading: TranslatedText | null;
  /** The profile could not be read: the message in the list's place; a way on in setup alone. */
  readonly unread: {
    readonly title: TranslatedText;
    readonly line: TranslatedText;
    readonly retry: TranslatedText;
    readonly onward: TranslatedText | null;
    readonly onwardSpoken: TranslatedText | null;
  } | null;
  /** The act and what stands at it; none when the profile could not be read — `unread` holds both ways. */
  readonly act: {
    readonly primary: TranslatedText;
    readonly primarySpoken: TranslatedText;
    /** Why the primary cannot be pressed yet. */
    readonly waiting: TranslatedText | null;
    /** The way on without saving, after a failed save alone. */
    readonly secondary: TranslatedText | null;
    readonly secondarySpoken: TranslatedText | null;
    /** The failed save, said once, at the act. */
    readonly alert: TranslatedText | null;
    /** The one line at the act: a consequence read before it. */
    readonly line: TranslatedText | null;
  } | null;
}

/**
 * `read` — the read is still out, it answered, or it failed; `saveFailed` — the last save failed. `skipped` —
 * the step was skipped and the owner is back. `arrivedUndeclared` — the profile was read without
 * the two answers of the step before. `standings` — domain's `companyProfileStanding` for
 * each part. `open` — the part that is open. The three pack facts arrive in the reader's language.
 */
export interface CompanyProfileWordFacts {
  /** Setup, the corridor's step; settings, the same profile behind `More`, with nowhere onward. */
  readonly life: CompanyProfileLife;
  readonly read: ReadKind;
  readonly saveFailed: boolean;
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
  const { read, standings, city, taxIdLabel, taxFormat, bankRoutingLabel } = facts;
  const fromSignup = translate(COMPANY_PROFILE.fromSignup);
  const checked = translate(COMPANY_PROFILE.formatChecked);
  return {
    title:
      facts.life === 'settings'
        ? settingsRowName(translate, 'company_profile')
        : translate(COMPANY_PROFILE.title),
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
    letterhead: companyLetterheadWords(translate, read === 'ready', facts.letterhead, taxIdLabel),
    logo: facts.logo === null ? null : companyLogoCapture(translate, facts.logo),
    loading: read === 'loading' ? translate(COMPANY_PROFILE.loading) : null,
    unread: read === 'failed' ? unreadWords(translate, facts.life) : null,
    act: read === 'failed' ? null : actWords(translate, facts),
  };
}

function unreadWords(
  translate: Translator['t'],
  life: CompanyProfileLife,
): NonNullable<CompanyProfileWords['unread']> {
  const onward = life === 'setup';
  return {
    title: translate(COMPANY_PROFILE.unreadTitle),
    line: translate(COMPANY_PROFILE.unreadLine),
    retry: translate(SIGN_IN.tryAgain),
    onward: onward ? translate(COMPANY_PROFILE.onward) : null,
    onwardSpoken: onward ? translate(COMPANY_PROFILE.onwardUnreadSpoken) : null,
  };
}

function actWords(
  translate: Translator['t'],
  facts: CompanyProfileWordFacts,
): NonNullable<CompanyProfileWords['act']> {
  const { saveFailed } = facts;
  // Settings is in no corridor: after a failed save there is nowhere onward to go without it.
  const onward = saveFailed && facts.life === 'setup';
  const [primary, primarySpoken] = primaryAct(facts);
  return {
    primary: translate(primary),
    primarySpoken: translate(primarySpoken),
    waiting: facts.read === 'loading' ? translate(COMPANY_PROFILE.stillLoading) : null,
    secondary: onward ? translate(COMPANY_PROFILE.onward) : null,
    secondarySpoken: onward ? translate(COMPANY_PROFILE.onwardUnsavedSpoken) : null,
    alert: saveFailed ? translate(COMPANY_PROFILE.notSaved) : null,
    line: actLine(translate, facts),
  };
}

/** The primary and its spoken name: settings always saves changes; setup retries a failed save. */
function primaryAct(facts: CompanyProfileWordFacts): readonly [MessageRef, MessageRef] {
  if (facts.life === 'settings') {
    return [COMPANY_PROFILE.saveChanges, COMPANY_PROFILE.saveChangesSpoken];
  }
  return facts.saveFailed
    ? [SIGN_IN.tryAgain, COMPANY_PROFILE.retrySaveSpoken]
    : [COMPANY_PROFILE.save, COMPANY_PROFILE.saveSpoken];
}

/**
 * One lede, and the settings life's is always its own. In setup a failed save of the step before
 * outranks a skip, since it names what is missing. Only a profile that was read says either —
 * until then nothing is known to be missing, and a failed save here is the alert's alone. The step
 * before is named only while its answers are still missing as they were read: an answer the owner
 * took out on this screen was saved there.
 */
function lede(facts: CompanyProfileWordFacts): MessageRef {
  if (facts.life === 'settings') return COMPANY_PROFILE.settingsLede;
  if (facts.read !== 'ready' || facts.saveFailed) return COMPANY_PROFILE.lede;
  if (facts.arrivedUndeclared && facts.standings.declarations === 'not_declared') {
    return COMPANY_PROFILE.ledeNotSaved;
  }
  return facts.skipped ? COMPANY_PROFILE.ledeSkipped : COMPANY_PROFILE.lede;
}

/** Only a profile that was read keeps a line; an undeclared value's cost outranks the re-seed scope. */
function actLine(
  translate: Translator['t'],
  facts: CompanyProfileWordFacts,
): TranslatedText | null {
  if (facts.read !== 'ready' || facts.saveFailed) return null;
  if (facts.standings.declarations === 'not_declared') {
    return translate(COMPANY_PROFILE.marketDefaults);
  }
  return facts.open === 'declarations' ? translate(COMPANY_PROFILE.reseedScope) : null;
}
