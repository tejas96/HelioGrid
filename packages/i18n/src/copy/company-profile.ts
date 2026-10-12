/**
 * Every message of the company profile's setup life (`SCR-M01-05`; `M01-24`, `M01-25`, `M01-31`):
 * the five parts, where each stands, every field and line, and what a failed read or save says —
 * authored once for both platforms (Law 11). `companyProfileWords` picks among them by state. The
 * tax label, the bank-routing label and the format line are the market pack's: this module names
 * no market's tax or bank identifier.
 */
import type { CompanyProfilePart, CompanyProfileStanding, TenantSegment } from '@heliogrid/domain';
import type { MessageRef } from '../runtime';

export const COMPANY_PROFILE = {
  title: /*i18n*/ { id: 'Your company profile' },
  lede: /*i18n*/ { id: 'On every proposal, invoice and customer link · asked for once' },
  ledeSkipped: /*i18n*/ { id: 'Skipped during setup · your first proposal needs it' },
  ledeNotSaved: /*i18n*/ { id: 'What you sell · not saved on the last step' },
  fromSignup: /*i18n*/ { id: 'From your signup' },
  street: /*i18n*/ { id: 'Street address' },
  streetExample: /*i18n*/ { id: 'Building, street, area' },
  postalCode: /*i18n*/ { id: 'PIN code' },
  /** An example the field shows while empty (`SCR-M01-05`, `m-address-open`); a specimen, never a value. */
  postalCodeExample: /*i18n*/ { id: '411038' },
  addressPurpose: /*i18n*/ { id: 'Shown to customers on every document' },
  optional: /*i18n*/ { id: '{label} (optional)' },
  formatChecked: /*i18n*/ {
    id: "We check the format against your market's rules — never with the issuing authority.",
  },
  bankName: /*i18n*/ { id: 'Bank name' },
  bankNameExample: /*i18n*/ { id: 'HDFC Bank' },
  accountHolder: /*i18n*/ { id: 'Account holder' },
  accountNumber: /*i18n*/ { id: 'Account number' },
  accountNumberExample: /*i18n*/ { id: 'Your current account' },
  routingExample: /*i18n*/ { id: 'HDFC0001234' },
  bankPurpose: /*i18n*/ { id: 'On your invoices · never used to move your money' },
  group: /*i18n*/ { id: 'What you mostly sell' },
  sizeHint: /*i18n*/ { id: 'The size you sell most often' },
  reseedScope: /*i18n*/ { id: 'Only new proposals reprice · sent ones keep theirs' },
  marketDefaults: /*i18n*/ { id: 'Market defaults until you set these' },
  save: /*i18n*/ { id: 'Save and continue' },
  saveSpoken: /*i18n*/ { id: 'Save your company profile and continue setting up HelioGrid' },
  loading: /*i18n*/ { id: 'Loading your company profile' },
  stillLoading: /*i18n*/ { id: 'Profile still loading' },
  unreadTitle: /*i18n*/ { id: "We couldn't load your profile" },
  unreadLine: /*i18n*/ { id: 'Our end, not yours · nothing is lost' },
  onward: /*i18n*/ { id: 'Continue without it' },
  onwardUnreadSpoken: /*i18n*/ {
    id: 'Continue setting up HelioGrid without your company profile',
  },
  notSaved: /*i18n*/ { id: 'Not saved · our end · nothing typed is lost' },
  retrySaveSpoken: /*i18n*/ { id: 'Try saving your company profile again' },
  onwardUnsavedSpoken: /*i18n*/ {
    id: 'Continue setting up HelioGrid without saving your company profile',
  },
  letterhead: /*i18n*/ { id: 'Your letterhead' },
  letterheadLogo: /*i18n*/ { id: 'Logo' },
  letterheadBank: /*i18n*/ { id: 'Bank' },
};

/**
 * The five parts as their headers name them. A closed vocabulary with the standings below: no
 * translation may give two members one word (`F3-12`) — held by `closed-vocabularies.ts`.
 */
export const COMPANY_PROFILE_PART_TITLE: Record<CompanyProfilePart, MessageRef> = {
  identity: /*i18n*/ { id: 'Logo and company name' },
  address: /*i18n*/ { id: 'Address' },
  tax: /*i18n*/ { id: 'Tax registration' },
  bank: /*i18n*/ { id: 'Bank details' },
  declarations: /*i18n*/ { id: 'What you sell' },
};

/** Where a part stands, as its header says it; `city_only` names the city signup captured. */
export const COMPANY_PROFILE_STANDING_WORD: Record<CompanyProfileStanding, MessageRef> = {
  name_only: /*i18n*/ { id: 'Name only' },
  city_only: /*i18n*/ { id: '{city} only' },
  not_added: /*i18n*/ { id: 'Not added' },
  added: /*i18n*/ { id: 'Added' },
  answered: /*i18n*/ { id: 'Answered' },
  not_declared: /*i18n*/ { id: 'Not declared' },
  check_format: /*i18n*/ { id: 'Check the format' },
};

/** Each kind's line on this screen's card; its title is the one vocabulary's (`TENANT_SEGMENT_WORD`). */
export const COMPANY_PROFILE_SEGMENT_LINE: Record<TenantSegment, MessageRef> = {
  residential: /*i18n*/ { id: 'Homes and housing societies' },
  ci: /*i18n*/ { id: 'Factories, offices, warehouses' },
  both: /*i18n*/ { id: 'You sell to either' },
};
