import { MS_PER_DAY } from '../format/zone';
import { isSellable, tierRow, trialCapacity } from '../pricing/book';
import type { PriceBookPack } from '../pricing/pack';
import type { Meter, STANDING_METER } from './meters';
import type { Tier, TierCapacity, TierLimit } from './tiers';

/**
 * Entitlements: a company's current limit per key, the one runtime gate (`M12-15`, `M12-16`).
 * The keys are `TierCapacity`'s four kinds, spelled out — no seat key, no studio key beyond the
 * design ceiling, no proposal-type key and no read or export key (`M12-17`, `M12-20`), so no
 * entitlement can ever hold data hostage.
 */
export const ENTITLEMENT_KEYS = [
  'design_ceiling_kw',
  'proposals_per_cycle',
  'active_projects',
  'voice_minutes',
  'ai_roof_detections',
  'marketing_sends',
  'tracked_field_seats',
  'storage_gb',
] as const;
export type EntitlementKey = (typeof ENTITLEMENT_KEYS)[number];

/** Where a limit comes from (`M12-16`): the paid plan, the trial, or a support grant on top of either. */
export const ENTITLEMENT_SOURCES = ['plan', 'trial', 'grant'] as const;
export type EntitlementSource = (typeof ENTITLEMENT_SOURCES)[number];

/**
 * `TierLimit`'s three cases as stored: a number, no ceiling, or negotiated. Both words are kept so
 * "no ceiling" and "negotiated" never read as one missing value.
 */
export const ENTITLEMENT_LIMIT_KINDS = ['count', 'unlimited', 'custom'] as const;
export type EntitlementLimitKind = (typeof ENTITLEMENT_LIMIT_KINDS)[number];

/** Support's two audited acts (`M12-19`, `M12-52`): a raised limit, and the trial's one extension. */
export const ENTITLEMENT_OVERRIDE_KINDS = ['goodwill_credit', 'trial_extension'] as const;
export type EntitlementOverrideKind = (typeof ENTITLEMENT_OVERRIDE_KINDS)[number];

/** `M12-52` — the one extension support may give a trial, once per company. */
export const TRIAL_EXTENSION_DAYS = 7;

/** Where an extended trial ends: its own end, moved by the one extension. */
export function extendedTrialEndsAt(trialEndsAt: number): number {
  return trialEndsAt + TRIAL_EXTENSION_DAYS * MS_PER_DAY;
}

export interface Entitlement {
  readonly key: EntitlementKey;
  readonly limit: TierLimit;
  readonly source: EntitlementSource;
}

/** One goodwill credit: a whole amount added to one key's count. */
export interface EntitlementCredit {
  readonly key: EntitlementKey;
  readonly amount: number;
}

type PerCycleMeter = Exclude<Meter, typeof STANDING_METER>;

/** Each per-cycle meter's key. A `Record`, so a sixth meter fails to compile here. */
const METER_KEY: Record<PerCycleMeter, EntitlementKey> = {
  voice_minutes: 'voice_minutes',
  ai_roof_detections: 'ai_roof_detections',
  marketing_sends: 'marketing_sends',
  tracked_field_seats: 'tracked_field_seats',
};

/**
 * The limits the book gives a company: the trial's caps (`tier` null — `BM-28`) or its paid tier's
 * capacity. A meter the book does not sell yet gets a bundle of 0 (`BM-26`): an unsellable meter
 * issues no allowance. A paid tier the book has no row for is a broken deployment, said loudly.
 */
export function bookEntitlements(book: PriceBookPack, tier: Tier | null): Entitlement[] {
  const capacity = tier === null ? trialCapacity(book) : paidCapacity(book, tier);
  const source: EntitlementSource = tier === null ? 'trial' : 'plan';
  const meters = (Object.keys(METER_KEY) as PerCycleMeter[]).map((meter) => ({
    key: METER_KEY[meter],
    limit: isSellable(book, meter) ? capacity.meterBundles[meter] : 0,
    source,
  }));
  return [
    { key: 'design_ceiling_kw', limit: capacity.designCeilingKw, source },
    { key: 'proposals_per_cycle', limit: capacity.creationsPerCycle.proposals, source },
    { key: 'active_projects', limit: capacity.creationsPerCycle.active_projects, source },
    ...meters,
    { key: 'storage_gb', limit: capacity.storageGb, source },
  ];
}

function paidCapacity(book: PriceBookPack, tier: Tier): TierCapacity {
  const row = tierRow(book, tier);
  if (row === null) throw new Error(`the book sells no ${tier} row to take limits from`);
  return row.capacity;
}

/**
 * `M12-19` — the limits once support's credits are added. A credit raises a counted limit; a key
 * with no ceiling, or a negotiated one, has no number to raise, so `creditRefusal` refuses it
 * before it is ever written.
 */
export function withCredits(
  base: readonly Entitlement[],
  credits: readonly EntitlementCredit[],
): Entitlement[] {
  return base.map((entitlement) => {
    const added = credits
      .filter((credit) => credit.key === entitlement.key)
      .reduce((sum, credit) => sum + credit.amount, 0);
    if (added === 0 || typeof entitlement.limit !== 'number') return entitlement;
    return { key: entitlement.key, limit: entitlement.limit + added, source: 'grant' };
  });
}

/** Why a credit cannot be written on this limit, or `null` when it can. */
export function creditRefusal(limit: TierLimit, amount: number): string | null {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return `a credit is a whole amount above zero, not ${amount}`;
  }
  if (limit === 'unlimited') return 'a limit with no ceiling has no number to raise';
  if (limit === 'custom') return 'a negotiated limit has no number to raise';
  return null;
}

/** A limit as stored: its kind, and its number for a count. */
export function storedLimit(limit: TierLimit): {
  kind: EntitlementLimitKind;
  value: number | null;
} {
  return typeof limit === 'number' ? { kind: 'count', value: limit } : { kind: limit, value: null };
}

/** A stored limit read back. A `count` row always carries its number (the table's check). */
export function limitOf(kind: EntitlementLimitKind, value: number | null): TierLimit {
  if (kind !== 'count') return kind;
  if (value === null) throw new Error('a count limit stored without its number');
  return value;
}
