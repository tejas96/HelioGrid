import type { MinorUnits } from '../money/minor-units';
import { type MoneyScheme, taxBreakdown } from './breakdown';

/**
 * What the gateway collects for one platform sale: the book's ex-tax price plus the scheme's tax on
 * the platform sale (`BM-40`, `F1-28`), from `taxBreakdown` and no second computation.
 *
 * It is worked out at the supplier's own place. The recipient's place is captured at conversion,
 * after a plan's amount is fixed at the gateway, and for every authored book it moves only how
 * the tax splits (CGST + SGST or IGST), never the total: each IN price is whole rupees, so each
 * half-rate share is exact. The invoice (T-M12-012) splits it by the recipient's place.
 */
export function platformSaleTotal(scheme: MoneyScheme, listPrice: MinorUnits): MinorUnits {
  const place = { supplier: 'supplier', recipient: 'supplier' };
  const line = {
    taxableAmount: listPrice,
    rateBasisPoints: scheme.tax.platformSale.rateBasisPoints,
  };
  return taxBreakdown(scheme, [line], place).totalAmount;
}
