/**
 * The identifiers a person types when they record or set up a payment: the bank's reference for
 * the money (a UPI UTR, a cheque number) and the company's own UPI ID.
 */

/**
 * The reference as it is compared: spaces and dashes gone, upper case — `4321 8765 3390` and
 * `432187653390` are one payment. `null` when nothing is left.
 */
export function referenceKeyOf(typed: string): string | null {
  const key = typed.replace(/[\s-]/g, '').toUpperCase();
  return key === '' ? null : key;
}

/**
 * A UPI ID (`name@bank`): letters, digits, dot, dash and underscore before the `@`, letters after
 * it. Checks the shape only — the ₹1 test payment proves it reaches the right account.
 */
const UPI_ID = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;

export function isUpiId(typed: string): boolean {
  return UPI_ID.test(typed.trim());
}
