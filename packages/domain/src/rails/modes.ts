import type { PaymentMode, PaymentRailsPack } from './pack';

/**
 * `F1-18`b — the tenant-collections side of `pack.payment-rails`: what a tenant may record a
 * customer's payment as.
 *
 * `M11` owns the payment ledger and writes the record; this answers whether the market permits
 * the mode and whether the mode is offerable right now.
 */

/**
 * The market's declaration for a payment mode, or `null` where the market declares none — the
 * open-set validation `F1-09` asks for, the same shape the mandate vocabulary is read through.
 */
export function paymentMode(rails: PaymentRailsPack, mode: string): PaymentMode | null {
  return rails.paymentModes.find((declared) => declared.mode === mode) ?? null;
}

/**
 * `F1-42` — the modes a tenant may record right now. Manual modes are in the answer whatever
 * `railAvailable` says: a rail mode needs a working adapter and a connected tenant account, a
 * manual mode is a person recording money that already moved. So a market with no rail at all,
 * or a tenant that never connected one, still collects (`M11-20`) — the rail is an accelerator,
 * never a dependency.
 *
 * The caller supplies `railAvailable` because rail reachability is not a market fact: it is this
 * tenant's account and this adapter's health, neither of which a pack knows.
 */
export function availablePaymentModes(
  rails: PaymentRailsPack,
  railAvailable: boolean,
): readonly PaymentMode[] {
  return rails.paymentModes.filter((mode) => mode.manual || railAvailable);
}
