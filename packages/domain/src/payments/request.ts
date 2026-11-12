import { type MinorUnits, minorUnitsToDecimal } from '../money/minor-units';

/**
 * The pay request and the receipt number — the two identifiers the server writes for money.
 *
 * A UPI request (`upi://pay`) asks for exactly what the part still owes (`M11-25`), to the
 * company's own UPI ID, so the money goes straight to the company (`M11-01`). Every UPI app opens
 * it with the amount and the note already filled in.
 */
export interface UpiRequest {
  readonly upiId: string;
  readonly payee: string;
  readonly amount: MinorUnits;
  readonly fractionDigits: number;
  readonly currency: string;
  /** What the customer's bank statement and the company's will show: the project and the part. */
  readonly note: string;
}

export function upiRequestUri(request: UpiRequest): string {
  const query = [
    `pa=${encodeURIComponent(request.upiId.trim())}`,
    `pn=${encodeURIComponent(request.payee)}`,
    `am=${minorUnitsToDecimal(request.amount, request.fractionDigits)}`,
    `cu=${encodeURIComponent(request.currency)}`,
    `tn=${encodeURIComponent(request.note)}`,
  ];
  return `upi://pay?${query.join('&')}`;
}

/** A receipt's number, from the company's own receipt counter: `RCPT-0187`. */
export function receiptNumberOf(sequence: number): string {
  return `RCPT-${String(sequence).padStart(4, '0')}`;
}
