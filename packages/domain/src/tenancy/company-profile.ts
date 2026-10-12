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
  };
  readonly registrations: readonly TaxRegistration[];
  readonly step: StepState;
}

/**
 * What a save writes. A malformed registration is left out and stops nothing — the api would
 * refuse the whole list for it, and `M01-25` keeps the way on open. A size that is no declaration
 * is written as none, so what is stored stands as the screen says it. The step is `completed` once
 * a part of this screen's own holds a fact, and `skipped` while none does (`M01-24`).
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
    },
    registrations,
    step: holdsAFact ? 'completed' : 'skipped',
  };
}

function typed(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function bankDetailsHeld(bank: BankDetails): BankDetails | null {
  const bankName = typed(bank.bankName);
  const accountName = typed(bank.accountName);
  const accountNumber = typed(bank.accountNumber);
  const bankRoutingIdentifier = typed(bank.bankRoutingIdentifier);
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
