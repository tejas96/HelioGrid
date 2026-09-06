/**
 * `pack.payment-rails` (`F1-18`) and the rules that read it: which rail collects a subscription,
 * whether a debit fits the rail carrying it, and what a tenant may record a collection as. The
 * India instance is `IN_PAYMENT_RAILS` (`F1-40`–`F1-43`).
 *
 * The billing lifecycle is `M12`'s and the payment ledger is `M11`'s; neither is here. This
 * package supplies the market facts both of them run on.
 */
export { collectionRoute, fitsPerDebitCap, mandateType } from './ladder';
export { availablePaymentModes, paymentMode } from './modes';
export type {
  BillingCycle,
  CollectionRoute,
  InvoiceRoute,
  LocalisationConstraint,
  MandateRoute,
  MandateType,
  NoLocalisationConstraint,
  PaymentMode,
  PaymentRailsPack,
  RailCapability,
  TierBand,
} from './pack';
export { BILLING_CYCLES, IN_PAYMENT_RAILS, RAIL_CAPABILITIES, TIER_BANDS } from './pack';
