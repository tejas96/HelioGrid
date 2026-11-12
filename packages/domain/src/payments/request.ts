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

/** The chat apps a market's pay request can open in, ready to send (`M11-26`'s hand-off). */
export const REQUEST_CHATS = ['whatsapp'] as const;
export type RequestChat = (typeof REQUEST_CHATS)[number];

/**
 * The pay request opened in the customer's own chat with the message already typed — the person
 * still presses send, so the product claims no delivery (`M11-26`). Null where the market names no
 * chat app: the person shares or copies it instead.
 */
export function chatRequestUri(
  chat: RequestChat | null,
  phoneE164: string,
  message: string,
): string | null {
  if (chat === null) return null;
  return `https://wa.me/${phoneE164.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

/** A receipt's number, from the company's own receipt counter: `RCPT-0187`. */
export function receiptNumberOf(sequence: number): string {
  return `RCPT-${String(sequence).padStart(4, '0')}`;
}
