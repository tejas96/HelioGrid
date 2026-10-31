import type { BilledLedgerMeter, BillingCycle, Tier } from '@heliogrid/domain';
import type { MessageRef } from '../runtime';

/**
 * Every word an invoice's PDF prints (`M12-44`, `M12-45`), in the company's document language. The
 * figures, the number, the registrations and the parties arrive as they were stored; the tax codes
 * (`CGST`) and the scheme's registration name (`GSTIN`) are the pack's and print as they are.
 */
export const INVOICE_DOCUMENT = {
  /** A registered supplier's invoice carries the scheme's tax; an unregistered one's is plain (`F1-29`). */
  taxInvoice: /*i18n*/ { id: 'Tax invoice' },
  plainInvoice: /*i18n*/ { id: 'Invoice' },
  number: /*i18n*/ { id: 'Invoice number' },
  issuedOn: /*i18n*/ { id: 'Date of issue' },
  paysThrough: /*i18n*/ { id: 'Paid period ends' },
  supplier: /*i18n*/ { id: 'Supplier' },
  billedTo: /*i18n*/ { id: 'Billed to' },
  /** A registration whose pack names it no word of its own. */
  taxRegistration: /*i18n*/ { id: 'Tax registration' },
  placeOfSupply: /*i18n*/ { id: 'Place of supply' },
  serviceCode: /*i18n*/ { id: 'Service code' },
  description: /*i18n*/ { id: 'Description' },
  rate: /*i18n*/ { id: 'Tax rate' },
  amount: /*i18n*/ { id: 'Amount' },
  subtotal: /*i18n*/ { id: 'Subtotal' },
  total: /*i18n*/ { id: 'Total' },
  planLine: /*i18n*/ { id: '{tier} plan, {cycle}' },
  overageLine: /*i18n*/ { id: '{meter}: {quantity} beyond the bundle at {rate} each' },
  noTax: /*i18n*/ { id: 'No tax is charged on this invoice.' },
  supplierOfRecord: /*i18n*/ {
    id: '{supplier} is the supplier of record for this sale. The payment gateway only collects the payment.',
  },
} as const;

/** How a plan line names its cycle. */
export const INVOICE_CYCLE: Record<BillingCycle, MessageRef> = {
  monthly: /*i18n*/ { id: 'billed monthly' },
  yearly: /*i18n*/ { id: 'billed yearly' },
};

/** What an overage line bills, by its meter (`BM-16`). */
export const INVOICE_METER: Record<BilledLedgerMeter, MessageRef> = {
  voice_minutes: /*i18n*/ { id: 'Voice minutes' },
  ai_roof_detections: /*i18n*/ { id: 'AI roof detections' },
  marketing_sends: /*i18n*/ { id: 'Marketing sends' },
  tracked_field_seats: /*i18n*/ { id: 'Tracked field seats' },
};

/**
 * A tier's name, the same in every language (`BM-11`, `§04.2`: a tier label renders as-is). Plain
 * strings, never catalog messages, so no translation can rename a tier.
 */
export const TIER_LABEL: Record<Tier, string> = {
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
  enterprise: 'Enterprise',
};
