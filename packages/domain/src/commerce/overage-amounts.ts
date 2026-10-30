import { amountForQuantity, type MinorUnits, sumMinorUnits } from '../money/minor-units';
import { isSellable } from '../pricing/book';
import type { PriceBookPack } from '../pricing/pack';
import { fitsPerDebitCap } from '../rails/ladder';
import type { MandateType } from '../rails/pack';
import { type AddOnVerdict, billedQuantityOf, type OverageAddOn, UnbillableMeter } from './overage';
import type { TierLimit } from './tiers';
import { BILLED_LEDGER_METERS, type BilledLedgerMeter } from './usage';

/**
 * The add-ons one closed period owes (`M12-35`): each sellable per-unit meter used past the
 * company's allowance, at the book's published rate. A meter with no allowance, or an `unlimited`
 * or `custom` one, bills nothing — billing never invents a charge. A draft meter bills nothing
 * (`BM-26`). A sellable per-channel meter throws: the ledger carries no channel to price it by.
 */
export function overageAddOns(
  book: PriceBookPack,
  allowances: ReadonlyMap<BilledLedgerMeter, TierLimit>,
  ledgerTotals: ReadonlyMap<BilledLedgerMeter, number>,
): OverageAddOn[] {
  return BILLED_LEDGER_METERS.flatMap((meter) => {
    if (!isSellable(book, meter)) return [];
    const overage = book.overage[meter];
    if (overage.kind !== 'per_unit') {
      throw new UnbillableMeter(
        `${meter} sells per channel, and the ledger carries no channel to bill by`,
      );
    }
    const allowance = allowances.get(meter);
    if (typeof allowance !== 'number') return [];
    const used = billedQuantityOf(meter, ledgerTotals.get(meter) ?? 0);
    const quantity = used - allowance;
    if (quantity <= 0) return [];
    const amount = amountForQuantity(overage.rate, quantity);
    return [{ meter, used, allowance, quantity, rate: overage.rate, amount }];
  });
}

/**
 * Whether one more add-on rides the mandate's next debit (`F1-40`): the plan, the add-ons already
 * waiting there and this one, as the gateway collects them, must fit the rail's per-debit cap — a
 * debit over it fails whole, plan included. One that does not fit even beside the plan alone fits
 * no debit at all.
 */
export function addOnVerdict(
  mandate: MandateType,
  planAmount: MinorUnits,
  waiting: MinorUnits,
  addOn: MinorUnits,
): AddOnVerdict {
  if (!fitsPerDebitCap(mandate, sumMinorUnits([planAmount, addOn]))) return 'over_cap';
  return fitsPerDebitCap(mandate, sumMinorUnits([planAmount, waiting, addOn])) ? 'add' : 'wait';
}
