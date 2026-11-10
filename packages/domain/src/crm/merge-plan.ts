import { MERGE_FIELDS, type MergeField } from './vocabulary';

/**
 * Customer merge (`M02-59`…`M02-63`): which fields differ, the picks a person must make before the
 * merge is ready — every differing field explicitly, never guessed — and what the survivor holds
 * afterwards. The loser becomes a tombstone pointing at the survivor and is never deleted.
 */

/** One customer as the merge compares it. `primaryContactId` `null` is the customer themselves. */
export interface MergeCustomer {
  readonly customerId: string;
  readonly name: string;
  readonly city: string | null;
  readonly phoneE164: string;
  readonly primaryContactId: string | null;
  readonly contacts: readonly { readonly contactId: string; readonly phoneE164: string }[];
  /** Set once this customer is itself a tombstone. */
  readonly mergedInto: string | null;
}

export type MergeSide = 'survivor' | 'loser';
export type MergePicks = Readonly<Partial<Record<MergeField, MergeSide>>>;

/** Who the survivor's primary contact is after the merge (`M02-34`: exactly one). */
export type MergedPrimary =
  | { readonly kind: 'survivor_self' }
  | { readonly kind: 'contact'; readonly contactId: string }
  /** The contact the loser's own number becomes on the survivor. */
  | { readonly kind: 'loser_phone_contact' };

export interface MergePlan {
  readonly survivorId: string;
  readonly loserId: string;
  readonly name: string;
  readonly city: string | null;
  readonly primary: MergedPrimary;
  /**
   * The loser's own number as a new contact on the survivor, so dedupe still finds it (RFC decision
   * 3); `null` when the survivor already holds that number or a moving contact carries it.
   */
  readonly loserPhoneContact: { readonly phoneE164: string; readonly name: string } | null;
  /** Each field that differed and the side kept — what the timeline and the audit record (`M02-61`). */
  readonly choices: readonly { readonly field: MergeField; readonly kept: MergeSide }[];
}

export type MergePlanResult =
  | { readonly kind: 'refused'; readonly refusal: 'same_customer' | 'already_merged' }
  | { readonly kind: 'needs_picks'; readonly unpicked: readonly MergeField[] }
  | { readonly kind: 'ready'; readonly plan: MergePlan };

/** A city as compared: outer spaces aside, and blank the same as none. */
function cityOf(customer: MergeCustomer): string | null {
  const city = customer.city?.trim() ?? '';
  return city === '' ? null : city;
}

function primaryPhoneOf(customer: MergeCustomer): string {
  const primary = customer.contacts.find(
    (contact) => contact.contactId === customer.primaryContactId,
  );
  return primary?.phoneE164 ?? customer.phoneE164;
}

const DIFFERS: Readonly<Record<MergeField, (a: MergeCustomer, b: MergeCustomer) => boolean>> = {
  name: (a, b) => a.name.trim() !== b.name.trim(),
  city: (a, b) => cityOf(a) !== cityOf(b),
  primary_contact: (a, b) => primaryPhoneOf(a) !== primaryPhoneOf(b),
};

/** The fields the two customers disagree on — the rows the compare step asks a pick for. */
export function mergeDifferences(survivor: MergeCustomer, loser: MergeCustomer): MergeField[] {
  return MERGE_FIELDS.filter((field) => DIFFERS[field](survivor, loser));
}

/**
 * The survivor's primary after the merge. Kept from the loser, it is the loser's primary contact,
 * which moves over with the loser's contacts — or, when the loser was their own primary, whichever
 * contact of either carries the loser's number, since the loser's contacts move to the survivor.
 */
function mergedPrimaryOf(
  survivor: MergeCustomer,
  loser: MergeCustomer,
  kept: MergeSide,
): MergedPrimary {
  const from = kept === 'survivor' ? survivor : loser;
  if (from.primaryContactId !== null) return { kind: 'contact', contactId: from.primaryContactId };
  if (kept === 'survivor' || loser.phoneE164 === survivor.phoneE164) {
    return { kind: 'survivor_self' };
  }
  const held = [...survivor.contacts, ...loser.contacts].find(
    (contact) => contact.phoneE164 === loser.phoneE164,
  );
  return held === undefined
    ? { kind: 'loser_phone_contact' }
    : { kind: 'contact', contactId: held.contactId };
}

function loserPhoneContactOf(
  survivor: MergeCustomer,
  loser: MergeCustomer,
): MergePlan['loserPhoneContact'] {
  const held = [
    survivor.phoneE164,
    ...[...survivor.contacts, ...loser.contacts].map((c) => c.phoneE164),
  ];
  return held.includes(loser.phoneE164) ? null : { phoneE164: loser.phoneE164, name: loser.name };
}

/**
 * The merge, once every differing field has its pick; a pick for a field that agrees is ignored.
 * Refused for one customer merged with itself, or with a tombstone.
 */
export function planMerge(
  survivor: MergeCustomer,
  loser: MergeCustomer,
  picks: MergePicks,
): MergePlanResult {
  if (survivor.customerId === loser.customerId)
    return { kind: 'refused', refusal: 'same_customer' };
  if (survivor.mergedInto !== null || loser.mergedInto !== null) {
    return { kind: 'refused', refusal: 'already_merged' };
  }
  const differing = mergeDifferences(survivor, loser);
  const unpicked = differing.filter((field) => picks[field] === undefined);
  if (unpicked.length > 0) return { kind: 'needs_picks', unpicked };
  /* A field the two agree on keeps the survivor's own value, whatever was picked for it. */
  const kept = (field: MergeField): MergeSide =>
    differing.includes(field) ? (picks[field] ?? 'survivor') : 'survivor';
  const sideOf = (field: MergeField) => (kept(field) === 'survivor' ? survivor : loser);
  return {
    kind: 'ready',
    plan: {
      survivorId: survivor.customerId,
      loserId: loser.customerId,
      name: sideOf('name').name,
      city: cityOf(sideOf('city')),
      primary: mergedPrimaryOf(survivor, loser, kept('primary_contact')),
      loserPhoneContact: loserPhoneContactOf(survivor, loser),
      choices: differing.map((field) => ({ field, kept: kept(field) })),
    },
  };
}

/**
 * Every table a merge writes (RFC decision 17): the two customers — the survivor's picked fields and
 * the loser's tombstone — the rows naming the loser, re-pointed to the survivor, and the two ledgers
 * it appends one entry to. Bookings, tasks, files and notices name a lead, whose id survives, so they
 * move with it unwritten. The timeline is append-only, so no activity is re-pointed: the survivor's
 * stream is read through the tombstone. The api's merge test holds the transaction to this list.
 */
export const MERGE_REPOINTED_TABLES = ['contact', 'lead', 'referral', 'duplicate_link'] as const;
export const MERGE_APPENDED_LEDGERS = ['activity', 'audit_log_entry'] as const;
export const MERGE_WRITE_SET = [
  'customer',
  ...MERGE_REPOINTED_TABLES,
  ...MERGE_APPENDED_LEDGERS,
] as const;
export type MergeWriteTable = (typeof MERGE_WRITE_SET)[number];

/**
 * The tables holding a money figure, or a rate or share a figure is computed from, that a merge
 * must never write (`M02-62`). A lead's monthly bill rides `lead`, which the merge writes, so the
 * merge sets only a lead's customer and the api's test reads the bill back unchanged. Proposal,
 * tranche, payment and discount tables join this list in the change that creates them (T-M06-025,
 * T-M11-006).
 */
export const MONEY_TABLES = [
  'billing_checkout',
  'catalog_rate_entry',
  'credit_note',
  'invoice_line',
  'invoice_line_tax',
  'overage_addon',
  'plan_price',
  'price_book_rate',
  'price_book_version',
  'subscription_invoice',
  'subscription_payment',
  'tenant_catalog_override',
  'tranche_template_line',
] as const;
export type MoneyTable = (typeof MONEY_TABLES)[number];
