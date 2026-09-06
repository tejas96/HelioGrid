import type { MinorUnits } from '../money/minor-units';
import { minorUnits } from '../money/minor-units';

/**
 * `pack.payment-rails` — how money reaches the platform, and how money reaches a tenant
 * (`F1-18`). Two flows in one key, in the row's own order: (a) platform billing, the mandate
 * ladder and the caps that shape it; (b) tenant collections, the payment-mode vocabulary;
 * (c) the market's reference adapters; (d) what the market's law demands of payment data.
 *
 * This is DATA. Rail policy lives here and in the market's adapter layer, never in generic
 * product behavior — no requirement, no screen and no branch anywhere names a payment provider
 * (`F1-04`, `M11-05`), so swapping a vendor is an adapter change. Every market's own word here
 * (`UPI AutoPay`, `Razorpay`, `RBI`) is a VALUE, never a field name and never a line of copy.
 *
 * The folder is `rails/` and not `payments/`: this is the market's RAILS. A tenant's payment
 * ledger is `M11`'s and holds none of this.
 */

/**
 * How a market's platform-billing ladder is banded (`F1-18`a). Self-serve is BOUGHT through the
 * product; enterprise is SOLD. A band groups tiers by how they are bought, which is what decides
 * the rail — so this is market-neutral, and no market's own tier name appears on it.
 *
 * Two bands, not the four tier names of `BM-11`: a tier is a capacity rung and a band is a
 * purchase route, and the map between them needs the tier names, so it lands with them
 * (`T-FCORE-012`).
 */
export const TIER_BANDS = ['self_serve', 'enterprise'] as const;

export type TierBand = (typeof TIER_BANDS)[number];

/**
 * How often a subscription is collected (`BM-13`). Declared here because `F1-18` keys the ladder
 * on it and this is the first slice that reads one (Law 9); `pack.price-book` prices these same
 * two cycles and imports this vocabulary rather than spelling it a second time (`T-FCORE-010`).
 */
export const BILLING_CYCLES = ['monthly', 'yearly'] as const;

export type BillingCycle = (typeof BILLING_CYCLES)[number];

/**
 * One standing authority the gateway debits on a schedule (`F1-18`a). The market's own value,
 * validated as an open set (`F1-09`) — never a closed enumeration baked into the product.
 *
 * The cap sits ON the type because it is the rail's own constraint: two places for one number
 * would let a cap and the rail it binds drift apart the first time a regulator moves one.
 */
export interface MandateType {
  /** The market's own identifier — `upi_autopay`. A value, never a field name. */
  readonly type: string;
  /** The largest single debit this rail carries. `null` where the rail caps nothing. */
  readonly perDebitCap: MinorUnits | null;
}

/**
 * A period collected by standing authority: the rail tried first, and the rails tried in order
 * when it cannot be established.
 */
export interface MandateRoute {
  readonly collection: 'mandate';
  readonly primary: string;
  /** Tried in order after the primary. Empty where the market declares no fallback. */
  readonly fallbacks: readonly string[];
}

/**
 * A period collected by one payment link raised per period, with no standing authority. Carries
 * no rail names: an invoice is settled by whatever the market's aggregator accepts, which is an
 * adapter concern. Giving it an empty fallback list would invite a caller to read one.
 */
export interface InvoiceRoute {
  readonly collection: 'invoice';
}

export type CollectionRoute = MandateRoute | InvoiceRoute;

/**
 * One way a tenant's own customer pays that tenant (`F1-18`b). The market's own value, an open
 * set like the mandate types (`F1-09`); the name a user READS is `pack.formats`' label (`F1-22`),
 * never this.
 *
 * `manual` is the behaviour-bearing half: a manual mode records money that moved outside this
 * product, so it stands whatever the rail's state, while a rail mode needs a working adapter and
 * can be unavailable (`M11-20`).
 */
export interface PaymentMode {
  readonly mode: string;
  readonly manual: boolean;
}

/**
 * What the product needs a rail to DO (`F1-18`c). Vendor-neutral by construction: a capability
 * is the requirement, and a market names who serves it in v1. The port each capability is
 * expressed as belongs to `M07`; this is the market's half — who, not how.
 *
 * The four `F1-18` enumerates, and no fifth invented here.
 */
export const RAIL_CAPABILITIES = [
  'subscription_billing',
  'payment_links',
  'otp_delivery',
  'telephony',
] as const;

export type RailCapability = (typeof RAIL_CAPABILITIES)[number];

/** A market whose law imposes nothing on where payment data lives. Declared, never absent. */
export interface NoLocalisationConstraint {
  readonly imposed: false;
}

export interface LocalisationConstraint {
  readonly imposed: true;
  /** The regime's own name — `RBI` in India. A value, never a field name. */
  readonly regime: string;
  /**
   * How the market meets it. `aggregator_holds_instruments` is satisfaction BY CONSTRUCTION: a
   * licensed aggregator in the market holds every payment instrument and every tenant rupee, so
   * this product stores nothing the rule governs and no residency choice reaches it. A market
   * satisfying it another way adds a member here, and every consumer's switch stops compiling.
   */
  readonly satisfiedBy: 'aggregator_holds_instruments';
}

export interface PaymentRailsPack {
  /** `F1-18`a — the mandate vocabulary, and the per-debit cap each rail carries. */
  readonly mandateTypes: readonly MandateType[];
  /**
   * `F1-18`a — how each band × cycle is collected. Every combination is written out: a third
   * band or a third cycle is then a compile error rather than a quiet `undefined` that reads as
   * "no route", the same law `pack.calling-rules` holds `requiredByClass` to.
   */
  readonly ladder: Record<TierBand, Record<BillingCycle, CollectionRoute>>;
  /** `F1-18`b — what a tenant may record a collection as. Manual modes always among them. */
  readonly paymentModes: readonly PaymentMode[];
  /** `F1-18`c — the market's reference implementation per capability. Empty where it has none. */
  readonly adapters: Record<RailCapability, readonly string[]>;
  /** `F1-18`d — the market's payment-data constraint and how the market satisfies it. */
  readonly localisation: LocalisationConstraint | NoLocalisationConstraint;
}

/**
 * `F1-40` — the UPI AutoPay per-debit ceiling, ₹15,000 in paise. The number that SHAPES the IN
 * ladder: every monthly tier price sits under it and every yearly total, tax included, runs past
 * it, which is why yearly is an invoice and not a mandate. It is authored as the rail's cap
 * rather than restated as a rule, so a regulator raising it is a pack-data update taking the
 * next pack version (`F1-11`) and nothing else.
 */
const UPI_AUTOPAY_PER_DEBIT_CAP = minorUnits(1_500_000);

/**
 * India (`F1-40`–`F1-43`). A reader checks this table against the PRD rows rather than trusting
 * the code.
 */
export const IN_PAYMENT_RAILS: PaymentRailsPack = {
  /**
   * `F1-41` — the two validated types. e-NACH is NOT among them: the row places it on the
   * Enterprise/invoice route, and `F1-40` bands Enterprise onto an invoice, so e-NACH is a rail
   * an Enterprise invoice is settled on — the aggregator's business — and never a standing
   * authority this product establishes. Authoring it as a mandate type would build a route no
   * row asks for.
   */
  mandateTypes: [
    { type: 'upi_autopay', perDebitCap: UPI_AUTOPAY_PER_DEBIT_CAP },
    /** `F1-40` — the fallback carries no cap of its own; the card's own limit is the issuer's. */
    { type: 'card_emandate', perDebitCap: null },
  ],
  ladder: {
    self_serve: {
      /** `F1-40` — UPI AutoPay primary, card e-mandate fallback. Collected at conversion, never at signup. */
      monthly: { collection: 'mandate', primary: 'upi_autopay', fallbacks: ['card_emandate'] },
      /**
       * `F1-40` — every yearly total, 18% GST included (`F1-28`, and the rate is read there,
       * never restated), runs past the cap: the entry tier alone is ₹19,990 + GST = ₹23,588. So
       * a year is one payment link, and renewal is a fresh one.
       */
      yearly: { collection: 'invoice' },
    },
    /** `F1-40` — Enterprise is invoiced in either cycle; `BM-41` sells it on an annual contract. */
    enterprise: { monthly: { collection: 'invoice' }, yearly: { collection: 'invoice' } },
  },
  /**
   * `F1-42` — four manual modes and one rail mode. The link rail is an accelerator, never a
   * dependency: cash is still king in EPC, so a tenant with no connected account collects on
   * every other mode and loses only link-minting (`M11-20`).
   */
  paymentModes: [
    { mode: 'upi', manual: true },
    { mode: 'neft', manual: true },
    { mode: 'cheque', manual: true },
    { mode: 'cash', manual: true },
    { mode: 'payment_link', manual: false },
  ],
  /**
   * `F1-43` — the v1 reference implementations. Telephony carries two because the IN voice stack
   * is two vendors on one lane: Exotel carries the call and Sarvam the speech. `M07` splits the
   * lane into ports when it defines them; this names who serves it here.
   */
  adapters: {
    subscription_billing: ['Razorpay'],
    payment_links: ['Razorpay'],
    otp_delivery: ['MSG91'],
    telephony: ['Exotel', 'Sarvam'],
  },
  /**
   * `F1-43` — RBI payment-data localisation, satisfied by construction. A licensed Indian
   * aggregator holds every instrument and every tenant rupee; this platform touches neither, so
   * there is no store to localise and no residency decision to make.
   */
  localisation: { imposed: true, regime: 'RBI', satisfiedBy: 'aggregator_holds_instruments' },
};
