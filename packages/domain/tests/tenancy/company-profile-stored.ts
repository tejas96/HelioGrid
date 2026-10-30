import { IN_TAX, type TaxPack } from '../../src/tax/pack';
import type { CompanyProfileFacts } from '../../src/tenancy/company-profile';
import type { CompanyProfileStored } from '../../src/tenancy/company-profile-draft';

export const COMPANY = 'Suryodaya Solar Solutions Pvt Ltd';
export const WELL_FORMED = '27AAACH7409R1ZV';
export const NO_REGISTRATION_TYPE: TaxPack = { ...IN_TAX, registrationTypes: [] };
export const gst = (value: string) => ({ registrationType: 'IN_GST', value });
export const other = { registrationType: 'XX_OTHER', value: '1234' };
/** A market with a second registration type, which the screen does not draw. */
export const TWO_TYPES: TaxPack = {
  ...IN_TAX,
  registrationTypes: [
    ...IN_TAX.registrationTypes,
    {
      type: 'XX_OTHER',
      pattern: '^[0-9]{4}$',
      capturedAt: 'conversion',
      format: { en: '4 digits' },
      placeAt: null,
    },
  ],
};

/** What a device holds for a company the two steps before left: nothing of this screen's own. */
export const factsAtSignup: CompanyProfileFacts = {
  companyName: COMPANY,
  city: 'Pune',
  logoFileId: null,
  address: '',
  postalCode: '',
  registrations: [],
  bank: { bankName: '', accountName: '', accountNumber: '', bankRoutingIdentifier: '' },
  segment: 'residential',
  typicalSystemKwp: 5,
};

/** A company as the two steps before leave it: nothing of this screen's own is stored. */
export const atSignup: CompanyProfileStored = {
  profile: {
    companyName: COMPANY,
    city: 'Pune',
    segment: 'residential',
    typicalSystemKwp: 5,
    address: null,
    postalCode: null,
    bankDetails: null,
    bankDetailsTyped: null,
  },
  registrations: [],
};
export const storing = (
  profile: Partial<CompanyProfileStored['profile']>,
): CompanyProfileStored => ({
  ...atSignup,
  profile: { ...atSignup.profile, ...profile },
});

export const fourBankFacts = {
  bankName: 'HDFC Bank',
  accountName: 'S. Deshmukh',
  accountNumber: '50200012344821',
  bankRoutingIdentifier: 'HDFC0001234',
};
export const bankNameAlone = {
  bankName: 'HDFC Bank',
  accountName: null,
  accountNumber: null,
  bankRoutingIdentifier: null,
};
