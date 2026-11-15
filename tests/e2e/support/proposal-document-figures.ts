import {
  formatMinorUnitsPlainly,
  IN_FORMATS,
  type MinorUnits,
  minorUnits,
  type ProvenanceTier,
  type QualifiedAmount,
  qualifyMinorUnits,
} from '@heliogrid/domain';

/**
 * The sample deal's amounts, as the server holds them: whole minor units, and each figure a screen
 * reads qualified with its tier (`qualifyMinorUnits`), so a spec expects the text the product prints.
 */

/** Whole rupees as paise: the server's unit. */
export const rupees = (amount: number): MinorUnits => minorUnits(amount * 100);

/** A figure as the server qualifies it: a typed price is `assumed`, a filled projection `estimated`. */
export const figure = (amount: MinorUnits, tier: ProvenanceTier): QualifiedAmount =>
  qualifyMinorUnits(IN_FORMATS, amount, {
    tier,
    energySource: null,
    freshness: null,
    projection: null,
  });

/**
 * An amount as the document prints it (`F3-21`): never rounded, and with no zero fraction — beside
 * the amounts of its own column, which share one form.
 */
export const printed = (amount: MinorUnits, beside: readonly MinorUnits[] = []): string =>
  formatMinorUnitsPlainly(IN_FORMATS, amount, beside);

export const PAYABLE = rupees(190575);
export const PRE_TAX = rupees(175000);
export const TAX = rupees(15575);
export const SUBSIDY = rupees(78000);
export const NET_COST = rupees(112575);
export const OUR_COST = rupees(140000);
export const MARGIN = rupees(35000);
export const MONTHLY_BILL = rupees(4200);
export const MONTHLY_SAVING = rupees(3487);
export const YEARLY_SAVING = rupees(41844);
