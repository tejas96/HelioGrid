/**
 * An amount as a whole number of the document currency's minor unit — paise under INR
 * (`F1-07`). The generic value the product computes with: a currency's own units are never
 * named on it, and the currency is stamped once, on the document root, never per amount.
 *
 * A brand, so a rupee figure cannot be handed in where paise are due: `minorUnits()` is the
 * only door in and it refuses a fraction. Everything downstream is integer arithmetic, which is
 * what makes sums reconcile to the minor unit by construction (`M11-08`).
 */
declare const MINOR_UNITS: unique symbol;

export type MinorUnits = number & { readonly [MINOR_UNITS]: 'money' };

/** A whole number of minor units, negative for a credit. Anything else is an authoring error. */
export function minorUnits(amount: number): MinorUnits {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError(`an amount is a whole number of minor units, not ${String(amount)}`);
  }
  return amount as MinorUnits;
}

/** A total is the sum of its parts, and a total past the safe range is refused, never rounded. */
export function sumMinorUnits(amounts: readonly MinorUnits[]): MinorUnits {
  let total = 0;
  for (const amount of amounts) total += amount;
  return minorUnits(total);
}
