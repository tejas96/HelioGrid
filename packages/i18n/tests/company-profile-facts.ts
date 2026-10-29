import type { CompanyProfileWordFacts } from '../src/copy/company-profile-words';
import { packWords } from '../src/runtime';

/** A new company's profile as its screen first holds it: nothing added, the first part open. */
export const AT_SIGNUP: CompanyProfileWordFacts = {
  life: 'setup',
  read: 'ready',
  saveFailed: false,
  skipped: false,
  arrivedUndeclared: false,
  standings: {
    identity: 'name_only',
    address: 'city_only',
    tax: 'not_added',
    bank: 'not_added',
    declarations: 'answered',
  },
  open: 'identity',
  city: 'Pune',
  taxIdLabel: 'GSTIN',
  taxFormat: packWords({ en: '15 characters · like 27ABCDE1234F1Z5' }, 'en'),
  bankRoutingLabel: packWords({ en: 'IFSC' }, 'en'),
  letterhead: {
    companyName: 'Suryodaya Solar Solutions Pvt Ltd',
    addressLine: 'Pune',
    registration: null,
    bank: null,
  },
  logo: null,
};

/** The same company with one part standing elsewhere. */
export const standing = (part: keyof CompanyProfileWordFacts['standings'], word: string) =>
  ({
    ...AT_SIGNUP,
    standings: { ...AT_SIGNUP.standings, [part]: word },
  }) as CompanyProfileWordFacts;
