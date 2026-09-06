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

/**
 * What a quantity costs at a per-unit amount, rounded ONCE to the minor unit, half away from
 * zero — `applyRate`'s law (`Q83`) for the case a rate cannot express, because a quantity is not
 * a fraction of anything and runs past 100%. A subsidy ladder's `₹30,000 per kW × 2.5 kWp` is
 * this and not a rate.
 *
 * The multiplication is float because the quantity is: a system is 2.5 kWp, never a whole
 * number of anything. Rounding it here is what keeps the float out of every sum above it.
 */
export function amountForQuantity(perUnit: MinorUnits, quantity: number): MinorUnits {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new RangeError(`a quantity is a finite non-negative number, not ${String(quantity)}`);
  }
  const exact = perUnit * quantity;
  return minorUnits(Math.sign(exact) * Math.round(Math.abs(exact)));
}
