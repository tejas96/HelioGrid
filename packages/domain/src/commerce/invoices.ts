/**
 * The platform invoice's vocabularies (`M12-44`). Each grows with the slice that issues it
 * (Law 9): `cycle` is a billing cycle's invoice, issued paid by the charge that pays it;
 * `issued` and `failed` arrive with the yearly payment link, `refunded` with the refund, and the
 * one-time `proration` kind with the upgrade (`M12-48`).
 */
export const INVOICE_KINDS = ['cycle'] as const;
export type InvoiceKind = (typeof INVOICE_KINDS)[number];

export const INVOICE_STATUSES = ['paid'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
