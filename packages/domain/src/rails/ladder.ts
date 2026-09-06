import type { MinorUnits } from '../money/minor-units';
import type {
  BillingCycle,
  CollectionRoute,
  MandateType,
  PaymentRailsPack,
  TierBand,
} from './pack';

/**
 * `F1-18`a — the platform-billing side of `pack.payment-rails`: which rail collects a
 * subscription, and whether one debit fits the rail carrying it.
 *
 * These are the only reads of the ladder, which is what keeps the market out of every caller:
 * `M12` runs the collection and this answers what to run, so no billing code branches on a
 * market or a vendor (`F1-04`, `M11-05`).
 */

/** How this band, on this cycle, is collected. Every combination is authored, so there is no miss. */
export function collectionRoute(
  rails: PaymentRailsPack,
  band: TierBand,
  cycle: BillingCycle,
): CollectionRoute {
  return rails.ladder[band][cycle];
}

/**
 * The market's declaration for a mandate type, or `null` where the market declares none — which
 * IS the open-set validation `F1-09` asks for: a type the pack does not declare is not a valid
 * type in that market, and no closed enumeration decides it.
 */
export function mandateType(rails: PaymentRailsPack, type: string): MandateType | null {
  return rails.mandateTypes.find((declared) => declared.type === type) ?? null;
}

/**
 * Whether one debit of this amount can ride this rail. A rail with no declared cap carries none,
 * so anything fits — absence is "no constraint", never a zero ceiling that refuses everything.
 */
export function fitsPerDebitCap(mandate: MandateType, amount: MinorUnits): boolean {
  return mandate.perDebitCap === null || amount <= mandate.perDebitCap;
}
