import type { CompanyLetterhead } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { COMPANY_PROFILE } from './company-profile';

/** The wide screen's preview: only what the fields hold; a `null` or an empty line is drawn as nothing. */
export interface CompanyLetterheadWords {
  readonly overline: string;
  readonly logo: string;
  readonly name: string;
  readonly address: string;
  readonly taxLabel: string;
  /** The registration as typed; `owed` while it does not read as the market's format. */
  readonly tax: { readonly value: string; readonly owed: boolean } | null;
  readonly bank: string;
  readonly bankLine: string | null;
}

/** Until the profile is read nothing is known to be on it, whatever the screen was handed. */
const NOTHING_READ: CompanyLetterhead = {
  companyName: '',
  addressLine: '',
  registration: null,
  bank: null,
};

/**
 * The letterhead beside the company profile at 1536 (`d-default`, `d-settings`): domain's
 * `companyLetterhead` for what the fields hold, once the profile has been read.
 */
export function companyLetterheadWords(
  translate: Translator['t'],
  read: boolean,
  letterhead: CompanyLetterhead,
  taxIdLabel: string,
): CompanyLetterheadWords {
  const { companyName, addressLine, registration, bank } = read ? letterhead : NOTHING_READ;
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
