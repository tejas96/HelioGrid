import type { BankDetails, TaxRegistration } from '../commerce/effective-settings';
import type { PackLabel } from '../format/languages';
import type { TaxPack } from '../tax/pack';
import {
  type BankDetailsTyped,
  COMPANY_PROFILE_PARTS,
  type CompanyLetterhead,
  type CompanyProfileFacts,
  type CompanyProfilePart,
  type CompanyProfileSave,
  type CompanyProfileStanding,
  companyLetterhead,
  companyProfileSave,
  companyProfileStanding,
  standingMark,
} from './company-profile';
import type { TenantSegment } from './segment';

/**
 * The most characters each text field takes — the bound the api holds on the same fact, which the
 * contract reads from here. Typing past one would be refused by the save, and the screen has no
 * words for that refusal, so a field stops at its bound.
 */
export const COMPANY_PROFILE_FIELD_CAP = {
  companyName: 120,
  city: 80,
  address: 500,
  postalCode: 16,
  taxRegistration: 40,
  bankName: 120,
  accountName: 120,
  accountNumber: 34,
  bankRoutingIdentifier: 34,
} as const;

/** The fields a person types text into, each reported by its own name. */
export type CompanyProfileField = keyof typeof COMPANY_PROFILE_FIELD_CAP;

/**
 * What the screen holds until the act: each text field as typed, an empty string where nothing is,
 * and the two declarations of the step before, null until declared.
 */
export type CompanyProfileValues = Readonly<Record<CompanyProfileField, string>> & {
  readonly segment: TenantSegment | null;
  /** In kWp. */
  readonly typicalSystemKwp: number | null;
};

/** What the api holds when the screen opens: the profile, and the registrations beside it. */
export interface CompanyProfileStored {
  readonly profile: {
    readonly companyName: string;
    readonly city: string;
    readonly segment: TenantSegment | null;
    readonly typicalSystemKwp: number | null;
    readonly address: string | null;
    readonly postalCode: string | null;
    readonly bankDetails: BankDetails | null;
    /** Absent from an api built before the field. */
    readonly bankDetailsTyped?: BankDetailsTyped | null;
    /** Absent from an api built before the field. */
    readonly logoFileId?: string | null;
  };
  readonly registrations: readonly TaxRegistration[];
}

/**
 * The fields as the screen opens. With no bank fact stored the account holder holds the company
 * name; a stored half shows only what it holds, so a holder taken out stays out. Whole bank
 * details beside a half are read alone: only an api built before the half could leave both.
 */
export function companyProfileValuesAtRead(
  { profile, registrations }: CompanyProfileStored,
  tax: TaxPack,
): CompanyProfileValues {
  const drawn = drawnRegistrationType(tax);
  return {
    companyName: profile.companyName,
    city: profile.city,
    address: profile.address ?? '',
    postalCode: profile.postalCode ?? '',
    taxRegistration: registrations.find((held) => held.registrationType === drawn)?.value ?? '',
    ...bankAtRead(profile),
    segment: profile.segment,
    typicalSystemKwp: profile.typicalSystemKwp,
  };
}

function bankAtRead({
  companyName,
  bankDetails,
  bankDetailsTyped,
}: CompanyProfileStored['profile']) {
  if (bankDetails !== null) return bankDetails;
  if (bankDetailsTyped === null || bankDetailsTyped === undefined) {
    return { bankName: '', accountName: companyName, accountNumber: '', bankRoutingIdentifier: '' };
  }
  return {
    bankName: bankDetailsTyped.bankName ?? '',
    accountName: bankDetailsTyped.accountName ?? '',
    accountNumber: bankDetailsTyped.accountNumber ?? '',
    bankRoutingIdentifier: bankDetailsTyped.bankRoutingIdentifier ?? '',
  };
}

/** The first part, or the part that owes something in its place — it opens itself (`SCR-M01-05`). */
export function companyProfileOpenAtRead(
  stored: CompanyProfileStored,
  tax: TaxPack,
): CompanyProfilePart {
  const facts = companyProfileFacts(companyProfileValuesAtRead(stored, tax), stored, tax);
  const owing = COMPANY_PROFILE_PARTS.find(
    (part) => standingMark(companyProfileStanding(part, facts, tax)) === 'owed',
  );
  return owing ?? 'identity';
}

/** What the screen says about what it holds: where each part stands, the letterhead, the format's words. */
export interface CompanyProfileView {
  readonly standings: Readonly<Record<CompanyProfilePart, CompanyProfileStanding>>;
  readonly letterhead: CompanyLetterhead;
  /** The drawn registration's format in the market's words; none in a market that declares no type. */
  readonly taxFormat: PackLabel | null;
}

export function companyProfileView(
  values: CompanyProfileValues,
  stored: CompanyProfileStored,
  tax: TaxPack,
): CompanyProfileView {
  const facts = companyProfileFacts(values, stored, tax);
  return {
    standings: {
      identity: companyProfileStanding('identity', facts, tax),
      address: companyProfileStanding('address', facts, tax),
      tax: companyProfileStanding('tax', facts, tax),
      bank: companyProfileStanding('bank', facts, tax),
      declarations: companyProfileStanding('declarations', facts, tax),
    },
    letterhead: companyLetterhead(facts, tax),
    taxFormat: tax.registrationTypes[0]?.format ?? null,
  };
}

/**
 * What the screen holds before the profile is read, or when it could not be: no field holds a
 * value and nothing is said to be owed, since nothing is known to be missing.
 */
export const COMPANY_PROFILE_UNREAD: {
  readonly values: CompanyProfileValues;
  readonly view: CompanyProfileView;
} = {
  values: {
    companyName: '',
    city: '',
    address: '',
    postalCode: '',
    taxRegistration: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    bankRoutingIdentifier: '',
    segment: null,
    typicalSystemKwp: null,
  },
  view: {
    standings: {
      identity: 'name_only',
      address: 'city_only',
      tax: 'not_added',
      bank: 'not_added',
      declarations: 'answered',
    },
    letterhead: { companyName: '', addressLine: '', registration: null, bank: null },
    taxFormat: null,
  },
};

/** One keystroke: the field holds what was typed, up to its bound, and can be emptied. */
export function companyProfileEdited(
  values: CompanyProfileValues,
  field: CompanyProfileField,
  typed: string,
): CompanyProfileValues {
  return { ...values, [field]: typed.slice(0, COMPANY_PROFILE_FIELD_CAP[field]) };
}

/**
 * The fields as the profile's rules read them. The screen draws one registration field, for the
 * market's first type; a stored registration of another type the market declares goes back as it
 * came, because the registrations are replaced whole. A market that declares no type draws no
 * field, and what is stored is left as it is.
 */
export function companyProfileFacts(
  values: CompanyProfileValues,
  stored: CompanyProfileStored,
  tax: TaxPack,
): CompanyProfileFacts {
  const { bankName, accountName, accountNumber, bankRoutingIdentifier, taxRegistration } = values;
  const drawn = drawnRegistrationType(tax);
  return {
    companyName: values.companyName,
    city: values.city,
    logoFileId: stored.profile.logoFileId ?? null,
    address: values.address,
    postalCode: values.postalCode,
    registrations:
      drawn === null
        ? stored.registrations
        : [
            { registrationType: drawn, value: taxRegistration },
            ...stored.registrations.filter((held) => held.registrationType !== drawn),
          ],
    bank: { bankName, accountName, accountNumber, bankRoutingIdentifier },
    segment: values.segment,
    typicalSystemKwp: values.typicalSystemKwp,
  };
}

/**
 * What the act sends. A company always has a name and a city, and the api refuses an empty one, so
 * a field the owner emptied goes back as it was read. The account holder opened holding the name
 * as it was read, so that name beside no other bank fact is nothing the owner typed, whatever the
 * company is called now. A registration typed malformed is never stored, and it takes nothing
 * away either: the registrations stay as they are stored, as they do in a market that declares no
 * type and so draws no field. A registration that stays stored is a fact the profile holds, so it
 * completes the step as a typed one does.
 */
export function companyProfileSaveOf(
  values: CompanyProfileValues,
  stored: CompanyProfileStored,
  tax: TaxPack,
): CompanyProfileSave {
  const facts = companyProfileFacts(values, stored, tax);
  const save = companyProfileSave(
    {
      ...facts,
      companyName: orAsRead(facts.companyName, stored.profile.companyName),
      city: orAsRead(facts.city, stored.profile.city),
      bank: bankAsTyped(facts.bank, stored.profile.companyName),
    },
    tax,
  );
  const nothingToWrite =
    drawnRegistrationType(tax) === null ||
    companyProfileStanding('tax', facts, tax) === 'check_format';
  if (!nothingToWrite) return save;
  const kept = stored.registrations;
  return { ...save, registrations: kept, step: kept.length > 0 ? 'completed' : save.step };
}

function bankAsTyped(bank: BankDetails, nameAsRead: string): BankDetails {
  const holderAlone =
    bank.bankName.trim() === '' &&
    bank.accountNumber.trim() === '' &&
    bank.bankRoutingIdentifier.trim() === '';
  return holderAlone && bank.accountName.trim() === nameAsRead.trim()
    ? { ...bank, accountName: '' }
    : bank;
}

function orAsRead(typed: string, read: string): string {
  return typed.trim() === '' ? read : typed;
}

/** Whether a save writes the registrations: the list replaces what is stored, whatever its order. */
export function registrationsChanged(
  stored: readonly TaxRegistration[],
  next: readonly TaxRegistration[],
): boolean {
  if (stored.length !== next.length) return true;
  return next.some(
    ({ registrationType, value }) =>
      !stored.some((held) => held.registrationType === registrationType && held.value === value),
  );
}

function drawnRegistrationType(tax: TaxPack): string | null {
  return tax.registrationTypes[0]?.type ?? null;
}
