import { minorUnits } from '@heliogrid/domain';
import type { DocumentFigures, DocumentSubsidy } from './DocumentPreview.types';

/* The sample a settings screen previews its letterhead on. Its total and payable are STATED
   beside its lines, like any server's figures — the part sums nothing (`F4-04`). */
export const SAMPLE_MONEY: DocumentFigures & DocumentSubsidy = {
  lineItems: [
    ['Mono PERC modules 545 W × 16', minorUnits(26_160_000)],
    ['String inverter 8 kW', minorUnits(6_840_000)],
    ['Mounting structure & BOS', minorUnits(7_420_000)],
    ['Installation & commissioning', minorUnits(4_827_100)],
  ],
  total: minorUnits(45_247_100),
  subsidyAmount: minorUnits(7_800_000),
  payable: minorUnits(37_447_100),
};

/* The sample's identity travels with the sample's figures and never beside real ones: a real
   document missing a tax number prints none rather than a made-up one (`F4-04` — no device assigns
   a business identifier). */
export interface DocumentIdentity {
  companyName: string;
  taxId: string;
  address: string;
  phone: string;
  customerName: string;
  customerMeta: string;
  docNumber: string;
  docDate: string | undefined;
}
export const SAMPLE_IDENTITY: DocumentIdentity = {
  companyName: 'Suryodaya Solar Pvt Ltd',
  taxId: '27AABCS1429P1ZQ',
  address: 'Shop 14, Laxmi Complex, Baner Road, Pune 411045',
  phone: '+91 98200 41123',
  customerName: 'Rajesh Kumar',
  customerMeta: 'Kothrud, Pune · 8.4 kWp rooftop',
  docNumber: 'PRO-2026-0418',
  docDate: '2026-08-16',
};
/* The specimen's own words. A real cover prints only the words its caller passes, so none of
   these can reach a tenant's document untranslated. */
export interface DocumentWords {
  logoLabel: string;
  docTitle: string;
  subsidyLabel: string;
  sectionsTitle: string;
  tranchesTitle: string;
  termsTitle: string;
  caption: string;
  preparedForLabel: string;
  totalLabel: string;
  bandFailsNote: string;
  termsEmptyText: string | undefined;
}
export const SAMPLE_WORDS: DocumentWords = {
  logoLabel: 'tenant logo',
  docTitle: 'Solar proposal',
  subsidyLabel: 'PM Surya Ghar subsidy',
  sectionsTitle: 'What this proposal covers',
  tranchesTitle: 'Payment schedule',
  termsTitle: 'Terms & conditions',
  caption: 'Preview · customer proposal',
  preparedForLabel: 'Prepared for',
  totalLabel: 'Total',
  bandFailsNote:
    "This colour can't carry header text, so the document keeps a white header and uses it as a rule.",
  termsEmptyText: 'No terms are attached to this template yet.',
};
export const NO_WORDS: DocumentWords = {
  logoLabel: '',
  docTitle: '',
  subsidyLabel: '',
  sectionsTitle: '',
  tranchesTitle: '',
  termsTitle: '',
  caption: '',
  preparedForLabel: '',
  totalLabel: '',
  bandFailsNote: '',
  termsEmptyText: undefined,
};

export const NO_MONEY: DocumentFigures = { lineItems: [], total: '' };

export const NO_IDENTITY: DocumentIdentity = {
  companyName: '',
  taxId: '',
  address: '',
  phone: '',
  customerName: '',
  customerMeta: '',
  docNumber: '',
  docDate: undefined,
};
