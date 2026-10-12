import type { CompanyProfileWordFacts } from '../src/copy/company-profile-words';

/** A new company's profile as its screen first holds it: nothing added, the first part open. */
export const AT_SIGNUP: CompanyProfileWordFacts = {
  status: 'ready',
  skipped: false,
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
  taxFormat: '15 characters · like 27ABCDE1234F1Z5',
  bankRoutingLabel: 'IFSC',
};

/** The same company with one part standing elsewhere. */
export const standing = (part: keyof CompanyProfileWordFacts['standings'], word: string) =>
  ({
    ...AT_SIGNUP,
    standings: { ...AT_SIGNUP.standings, [part]: word },
  }) as CompanyProfileWordFacts;
