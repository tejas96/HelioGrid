import type { BankDetails, TaxRegistration } from '../commerce/effective-settings';
import type { TaxPack } from '../tax/pack';
import { checkTaxRegistration } from '../tax/registration';
import type { StepState } from './onboarding-steps';
import type { TenantSegment } from './segment';
import { isTypicalSystemSize, whatYouSellUnanswered } from './what-you-sell';

/** The profile's five parts, in the order the screen lists them (`SCR-M01-05`). */
export const COMPANY_PROFILE_PARTS = [
  'identity',
  'address',
  'tax',
  'bank',
  'declarations',
] as const;
export type CompanyProfilePart = (typeof COMPANY_PROFILE_PARTS)[number];

/** Where a part can stand when shut: what it holds, said in one word beside its title (`F7-12`). */
export const COMPANY_PROFILE_STANDINGS = [
  'name_only',
  'city_only',
  'not_added',
  'added',
  'answered',
  'not_declared',
  'check_format',
] as const;
export type CompanyProfileStanding = (typeof COMPANY_PROFILE_STANDINGS)[number];

/** How a standing is marked: nothing owed, something still open, or something to put right. */
export type StandingMark = 'met' | 'open' | 'owed';

const MARK_OF: Record<CompanyProfileStanding, StandingMark> = {
  name_only: 'open',
  city_only: 'open',
  not_added: 'open',
  added: 'met',
  answered: 'met',
  not_declared: 'owed',
  check_format: 'owed',
};

export function standingMark(standing: CompanyProfileStanding): StandingMark {
  return MARK_OF[standing];
}

/**
 * Bank details typed half way (`M06-17`): one to three of the four facts, kept so the owner is not
 * asked for them again. Never bank details: a document reads the whole or nothing.
 */
export type BankDetailsTyped = { readonly [Fact in keyof BankDetails]: BankDetails[Fact] | null };

const BANK_FACTS = [
  'bankName',
  'accountName',
  'accountNumber',
  'bankRoutingIdentifier',
] as const satisfies readonly (keyof BankDetails)[];

/** A half holds one to three facts: none is nothing typed, and four are bank details. */
export function isBankDetailsTyped(typed: BankDetailsTyped): boolean {
  const held = BANK_FACTS.filter((fact) => typed[fact] !== null).length;
  return held > 0 && held < BANK_FACTS.length;
}

/**
 * The profile as a device holds it until the act: every field as typed, an empty string where
 * nothing is. The name, the city and the two declarations arrive from the steps before.
 */
export interface CompanyProfileFacts {
  readonly companyName: string;
  readonly city: string;
  readonly address: string;
  readonly postalCode: string;
  /** One entry per registration field the owner typed in; the type is the market pack's. */
  readonly registrations: readonly TaxRegistration[];
  readonly bank: BankDetails;
  readonly segment: TenantSegment | null;
  readonly typicalSystemKwp: number | null;
}

/**
 * Where a part stands. The street address alone makes the address `added`; bank details are all
 * four facts or none (`M06-17`); a registration is judged by the market's format and nothing else
 * (`M01-25`).
 */
export function companyProfileStanding(
  part: CompanyProfilePart,
  facts: CompanyProfileFacts,
  tax: TaxPack,
): CompanyProfileStanding {
  switch (part) {
    case 'identity':
      return 'name_only';
    case 'address':
      return typed(facts.address) === null ? 'city_only' : 'added';
    case 'tax': {
      const read = registrationsRead(facts, tax);
      if (read.malformed) return 'check_format';
      return read.wellFormed.length > 0 ? 'added' : 'not_added';
    }
    case 'bank':
      return bankDetailsHeld(facts.bank) === null ? 'not_added' : 'added';
    case 'declarations':
      return whatYouSellUnanswered(facts).length === 0 ? 'answered' : 'not_declared';
  }
}

/** What the act sends: the profile, the registrations, then the step's outcome. */
export interface CompanyProfileSave {
  readonly profile: {
    readonly companyName: string;
    readonly city: string;
    readonly segment: TenantSegment | null;
    readonly typicalSystemKwp: number | null;
    readonly address: string | null;
    readonly postalCode: string | null;
    readonly bankDetails: BankDetails | null;
    /** Set only while `bankDetails` is not: the two are never written together. */
    readonly bankDetailsTyped: BankDetailsTyped | null;
  };
  readonly registrations: readonly TaxRegistration[];
  readonly step: StepState;
}

/**
 * What a save writes. Bank details are written whole, or as the half that is typed, never both. A
 * malformed registration is left out and stops nothing — the api would refuse the whole list for
 * it, and `M01-25` keeps the way on open. A size that is no declaration is written as none, so what
 * is stored stands as the screen says it. The step is `completed` once a part of this screen's own
 * holds a fact, and `skipped` while none does (`M01-24`).
 */
export function companyProfileSave(facts: CompanyProfileFacts, tax: TaxPack): CompanyProfileSave {
  const address = typed(facts.address);
  const postalCode = typed(facts.postalCode);
  const bankDetails = bankDetailsHeld(facts.bank);
  const registrations = registrationsRead(facts, tax).wellFormed;
  const holdsAFact =
    address !== null || postalCode !== null || bankDetails !== null || registrations.length > 0;
  return {
    profile: {
      companyName: facts.companyName.trim(),
      city: facts.city.trim(),
      segment: facts.segment,
      typicalSystemKwp: isTypicalSystemSize(facts.typicalSystemKwp) ? facts.typicalSystemKwp : null,
      address,
      postalCode,
      bankDetails,
      bankDetailsTyped: bankDetailsHalf(facts),
    },
    registrations,
    step: holdsAFact ? 'completed' : 'skipped',
  };
}

/**
 * The letterhead the profile builds, as the wide screen previews it (`SCR-M01-05`, `d-default`):
 * only what the fields hold. A fact that is `null` or empty is drawn as nothing.
 */
export interface CompanyLetterhead {
  readonly companyName: string;
  /** The street when there is one, then the city and the PIN code. */
  readonly addressLine: string;
  /** The first registration typed, and whether it reads as the market's format. */
  readonly registration: { readonly value: string; readonly wellFormed: boolean } | null;
  /** Held once all four bank facts are, as the bank part's standing is. */
  readonly bank: { readonly bankName: string; readonly accountEnding: string } | null;
}

/**
 * An account is named by its last letters and digits, whatever separates them as typed; a number
 * no longer than this shows whole.
 */
const ACCOUNT_ENDING_LENGTH = 4;
const NOT_LETTER_OR_DIGIT = /[^\p{L}\p{N}]/gu;

export function companyLetterhead(facts: CompanyProfileFacts, tax: TaxPack): CompanyLetterhead {
  const cityAndPostalCode = [typed(facts.city), typed(facts.postalCode)].filter(isHeld).join(' ');
  const bank = bankDetailsHeld(facts.bank);
  return {
    companyName: facts.companyName.trim(),
    addressLine: [typed(facts.address), typed(cityAndPostalCode)].filter(isHeld).join(', '),
    registration: registrationTyped(facts, tax),
    bank:
      bank === null
        ? null
        : {
            bankName: bank.bankName,
            accountEnding: bank.accountNumber
              .replace(NOT_LETTER_OR_DIGIT, '')
              .slice(-ACCOUNT_ENDING_LENGTH),
          },
  };
}

function registrationTyped(
  facts: CompanyProfileFacts,
  tax: TaxPack,
): CompanyLetterhead['registration'] {
  for (const { registrationType, value } of facts.registrations) {
    const trimmed = typed(value);
    if (trimmed === null) continue;
    const check = checkTaxRegistration(tax, registrationType, trimmed);
    if (check.ok) return { value: trimmed, wellFormed: true };
    if (check.reason === 'malformed') return { value: trimmed, wellFormed: false };
  }
  return null;
}

function isHeld(value: string | null): value is string {
  return value !== null;
}

function typed(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function bankFactsTyped(bank: BankDetails): BankDetailsTyped {
  return {
    bankName: typed(bank.bankName),
    accountName: typed(bank.accountName),
    accountNumber: typed(bank.accountNumber),
    bankRoutingIdentifier: typed(bank.bankRoutingIdentifier),
  };
}

function bankDetailsHeld(bank: BankDetails): BankDetails | null {
  const { bankName, accountName, accountNumber, bankRoutingIdentifier } = bankFactsTyped(bank);
  if (
    bankName === null ||
    accountName === null ||
    accountNumber === null ||
    bankRoutingIdentifier === null
  ) {
    return null;
  }
  return { bankName, accountName, accountNumber, bankRoutingIdentifier };
}

/**
 * The half a save keeps. The account holder opens holding the company name, so that name with no
 * other fact beside it is nothing the owner typed.
 */
function bankDetailsHalf(facts: CompanyProfileFacts): BankDetailsTyped | null {
  const half = bankFactsTyped(facts.bank);
  if (!isBankDetailsTyped(half)) return null;
  const others = BANK_FACTS.filter((fact) => fact !== 'accountName');
  const holderAlone = others.every((fact) => half[fact] === null);
  return holderAlone && half.accountName === facts.companyName.trim() ? null : half;
}

/**
 * The typed registrations of the types the market declares: those that read well, one per type —
 * the api refuses a list that names a type twice — and whether one does not.
 */
function registrationsRead(
  facts: CompanyProfileFacts,
  tax: TaxPack,
): { readonly wellFormed: readonly TaxRegistration[]; readonly malformed: boolean } {
  const wellFormed: TaxRegistration[] = [];
  let malformed = false;
  for (const { registrationType, value } of facts.registrations) {
    const trimmed = typed(value);
    if (trimmed === null) continue;
    const check = checkTaxRegistration(tax, registrationType, trimmed);
    if (!check.ok) malformed ||= check.reason === 'malformed';
    else if (!wellFormed.some((held) => held.registrationType === registrationType)) {
      wellFormed.push({ registrationType, value: trimmed });
    }
  }
  return { wellFormed, malformed };
}
