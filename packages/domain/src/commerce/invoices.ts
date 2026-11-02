/**
 * The platform invoice's vocabularies (`M12-44`). Each grows with the slice that issues it
 * (Law 9): `cycle` is a billing cycle's invoice. One a charge lands for is issued `paid`; a
 * renewal payment link's is `issued` with its link, turns `paid` when the link is paid, and
 * `failed` when it is not paid by its due moment; a first cycle paid back to its source is
 * `refunded` (`M12-47`). `proration` is an upgrade's one-time invoice for the part of the cycle
 * left (`M12-48`), issued `paid` when its link is paid.
 * Values append in the order the enum grew.
 */
export const INVOICE_KINDS = ['cycle', 'proration'] as const;
export type InvoiceKind = (typeof INVOICE_KINDS)[number];

export const INVOICE_STATUSES = ['paid', 'issued', 'failed', 'refunded'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
