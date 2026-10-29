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
