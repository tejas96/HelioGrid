import type { MinorUnits } from '../money/minor-units';
import type { StatutoryExtra, TaxPack } from './pack';

/**
 * Which scheme-tagged extras bind at a given turnover (`F1-30`). Strictly past the threshold: at
 * exactly ₹5 crore the IN e-invoicing duty has not begun. What binds stays bound and is never
 * backfilled — the invoice's duty (`M12`), judged at each financial-year close on the pack's
 * `fiscalYearStartMonth`.
 */
export function activeStatutoryExtras(
  tax: TaxPack,
  fiscalYearTurnover: MinorUnits,
): readonly StatutoryExtra[] {
  return tax.statutoryExtras.filter(
    (extra) => fiscalYearTurnover > extra.activatesWhenTurnoverExceeds,
  );
}
