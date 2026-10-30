import type { MinorUnits } from '../money/minor-units';
import type { MoneyScheme } from './breakdown';
import { platformInvoice } from './platform-invoice';

/**
 * What the gateway collects for one platform sale (`BM-40`, `F1-28`): the total of the invoice that
 * sale issues, so the two can never part. The book's ex-tax price, plus the scheme's tax once the
 * platform holds a registration in this market; the price alone before (`F1-29`, owner ruling
 * 2026-10-30).
 *
 * It is worked out at the supplier's own place. The recipient's place is captured at conversion,
 * after a plan's amount is fixed at the gateway, and for every authored book it moves only how the
 * tax splits (CGST + SGST or IGST), never the total: each IN price is whole rupees, so each
 * half-rate share is exact.
 */
export function platformSaleTotal(scheme: MoneyScheme, listPrice: MinorUnits): MinorUnits {
  return platformInvoice(scheme, [listPrice], null).totalAmount;
}
