import { type MinorUnits, minorUnits } from '../money/minor-units';
import type { Benchmark, PriceBookPack, TierBookRow, WorstCaseCogs } from './pack';

/**
 * The India book — the source-derived first instance (`F1-60`, `F1-61`, `BM-41`). Every number
 * below is IN-market data, in paise, ex-GST (`F1-28`); the generic model carries none of it.
 *
 * A reader checks this table against `BM-41` rather than trusting the code. Nothing here was
 * derived: the tier anchors are the owner's, the caps and bundles are the source's, and the
 * benchmarks are recorded with their provenance so a competitor repricing stales the book
 * instead of silently invalidating it (`BM-39`).
 *
 * Which rail collects which cycle is NOT here. `BM-41` points at the IN mandate ladder, and that
 * ladder is `pack.payment-rails`' (`F1-40`) — read it through `tierBand()`. Restating a route
 * here would give one collection two homes.
 */

/** `BM-41` — the three self-serve rungs, monthly and yearly, ex-GST. */
const STARTER_MONTHLY = minorUnits(199_900);
const STARTER_YEARLY = minorUnits(1_999_000);
const GROWTH_MONTHLY = minorUnits(399_900);
const GROWTH_YEARLY = minorUnits(3_999_000);
const PRO_MONTHLY = minorUnits(999_900);

/**
 * `BM-41` — ₹99,999, and NOT the ₹99,990 that ten months of `PRO_MONTHLY` would give. The source's
 * own book carries the ₹9 difference and it is carried as-is: `BM-13`'s pay-ten-get-twelve is the
 * SIZING principle, and the authored row is the price. Correcting it here would be this suite
 * inventing a price the owner did not set.
 */
const PRO_YEARLY = minorUnits(9_999_900);

/** `BM-41` — Enterprise is custom; this is the anchor the conversation opens at, per month. */
const ENTERPRISE_ANCHOR = minorUnits(2_499_900);

/**
 * `BM-17`, `BM-26`, `Q1` — where every worst-case unit cost in this book came from, and why not
 * one of them is verified.
 *
 * The owner ruled `BM-17`'s floor read BACKWARDS: a published rate already implies the highest
 * cost its unit may carry — the rate divided by 1.4 — and that ceiling IS the worst case until
 * the vendor rate cards land. So each figure below is the largest cost its own rate can survive,
 * taken to the whole paise below the ceiling.
 *
 * The consequence is stated rather than hidden: four of the six rows clear the floor by nothing
 * at all, so a real cost even a paisa above its ceiling makes that row invalid. That is the
 * ruling's own shape, not a defect — `metersBelowCogsFloor` is what will say so, and the rate
 * cards are `Q1`'s revisit trigger.
 */
function rateImpliedCeiling(amount: MinorUnits): WorstCaseCogs {
  return { amount, source: RATE_IMPLIED_CEILING };
}

const RATE_IMPLIED_CEILING =
  'owner ruling — the highest cost this rate can carry under BM-17, pending rate-card verification';

const STARTER: TierBookRow = {
  price: { kind: 'listed', perCycle: { monthly: STARTER_MONTHLY, yearly: STARTER_YEARLY } },
  capacity: {
    designCeilingKw: 50,
    creationsPerCycle: { proposals: 30, active_projects: 10 },
    /* `BM-41` — no voice bundle on Starter: minutes are pay-as-you-go, which is a bundle of 0
       and an overage rate, not a missing row. Tracked seats likewise start at 0 (`Q17`). */
    meterBundles: {
      voice_minutes: 0,
      ai_roof_detections: 30,
      marketing_sends: 500,
      tracked_field_seats: 0,
    },
    storageGb: 10,
  },
};

const GROWTH: TierBookRow = {
  price: { kind: 'listed', perCycle: { monthly: GROWTH_MONTHLY, yearly: GROWTH_YEARLY } },
  capacity: {
    designCeilingKw: 500,
    creationsPerCycle: { proposals: 300, active_projects: 'unlimited' },
    meterBundles: {
      voice_minutes: 0,
      ai_roof_detections: 100,
      marketing_sends: 2_000,
      tracked_field_seats: 3,
    },
    storageGb: 50,
  },
};

const PRO: TierBookRow = {
  price: { kind: 'listed', perCycle: { monthly: PRO_MONTHLY, yearly: PRO_YEARLY } },
  capacity: {
    /* `BM-41` — 5 MW, in the kW the ladder is spoken in (`BM-12`a). */
    designCeilingKw: 5_000,
    creationsPerCycle: { proposals: 1_500, active_projects: 'unlimited' },
    /* `BM-41`, `BM-14` — the 400-minute voice bundle no competitor offers at any price. */
    meterBundles: {
      voice_minutes: 400,
      ai_roof_detections: 400,
      marketing_sends: 10_000,
      tracked_field_seats: 10,
    },
    storageGb: 250,
  },
};

const ENTERPRISE: TierBookRow = {
  /* `BM-41` — quoted per month, contracted per year. The two cycles differ on purpose. */
  price: { kind: 'anchored', from: ENTERPRISE_ANCHOR, per: 'monthly', contract: 'yearly' },
  capacity: {
    /* `BM-41` — 100 MW: blocks and zones, trackers, terrain. */
    designCeilingKw: 100_000,
    creationsPerCycle: { proposals: 'unlimited', active_projects: 'unlimited' },
    meterBundles: {
      voice_minutes: 'custom',
      ai_roof_detections: 'custom',
      marketing_sends: 'custom',
      tracked_field_seats: 'custom',
    },
    storageGb: 'custom',
  },
};

/**
 * `BM-39` — Reslink India's own INR page, owner-supplied and authoritative. The rungs pair to
 * ours by capacity, which is what makes `BM-41`'s "under at every rung" claim checkable rather
 * than a slogan. Enterprise is custom on both sides, so it has no comparable rung and none is
 * invented here.
 */
const RESLINK: Benchmark = {
  competitor: 'Reslink India',
  source: 'Reslink India INR pricing page (owner-supplied)',
  readOn: '2026-08-04',
  rungs: [
    {
      label: 'Basic',
      price: minorUnits(6_000_000),
      cycle: 'yearly',
      designCeilingKw: 50,
      proposalsPerCycle: null,
    },
    {
      label: 'Pro',
      price: minorUnits(8_500_000),
      cycle: 'yearly',
      designCeilingKw: 500,
      proposalsPerCycle: 1_000,
    },
    {
      label: 'Premium',
      price: minorUnits(12_000_000),
      cycle: 'yearly',
      designCeilingKw: 5_000,
      proposalsPerCycle: null,
    },
  ],
};

/**
 * `BM-39` — ARKA prices per organisation and publishes no rungs. Recorded with an empty list
 * because the book WAS set against it: an absent benchmark and a benchmark with nothing to
 * compare are different facts, and only one of them is true here.
 */
const ARKA: Benchmark = {
  competitor: 'ARKA',
  source: 'ARKA per-organisation pricing (no published rung table)',
  readOn: '2026-08-04',
  rungs: [],
};

export const IN_PRICE_BOOK: PriceBookPack = {
  tiers: { starter: STARTER, growth: GROWTH, pro: PRO, enterprise: ENTERPRISE },
  overage: {
    /* `BM-41` — ₹6 a minute on every tier, bundled or pay-as-you-go. */
    voice_minutes: {
      kind: 'per_unit',
      rate: minorUnits(600),
      worstCaseCogs: rateImpliedCeiling(minorUnits(428)),
      draft: false,
    },
    /* `BM-41` — ₹10 a detection past the bundle. A detection that returned nothing bills nothing (`BM-19`). */
    ai_roof_detections: {
      kind: 'per_unit',
      rate: minorUnits(1_000),
      worstCaseCogs: rateImpliedCeiling(minorUnits(714)),
      draft: false,
    },
    storage: { kind: 'ceiling' },
    /*
     * `BM-41`, `Q1` — the owner's DRAFT per-channel rates. They stay draft, and the meter stays
     * unsellable, until the channel rate cards verify against worst-case unit COGS (`BM-17`,
     * `BM-26`). WhatsApp bills the upstream's conversation, not the message (`BM-21`).
     */
    marketing_sends: {
      kind: 'per_channel',
      draft: true,
      channels: [
        {
          channel: 'whatsapp',
          billableUnit: 'conversation',
          rate: minorUnits(150),
          worstCaseCogs: rateImpliedCeiling(minorUnits(107)),
        },
        {
          channel: 'sms',
          billableUnit: 'message',
          rate: minorUnits(35),
          worstCaseCogs: rateImpliedCeiling(minorUnits(25)),
        },
        {
          channel: 'email',
          billableUnit: 'message',
          rate: minorUnits(10),
          worstCaseCogs: rateImpliedCeiling(minorUnits(7)),
        },
      ],
    },
    /* `BM-41`, `Q17` — DRAFT ≈₹99 per tracked seat per month beyond the tier's allowance. */
    tracked_field_seats: {
      kind: 'per_unit',
      rate: minorUnits(9_900),
      worstCaseCogs: rateImpliedCeiling(minorUnits(7_071)),
      draft: true,
    },
  },
  /*
   * `BM-28`, `BM-41` — the trial bounds only what costs real money. The two V2 meters carry 0
   * because neither is sellable yet (`BM-26`); a trial cannot burn an allowance of a meter that
   * cannot be billed.
   */
  trialCaps: {
    meterBundles: {
      voice_minutes: 15,
      ai_roof_detections: 25,
      marketing_sends: 0,
      tracked_field_seats: 0,
    },
    storageGb: 5,
  },
  benchmarks: [RESLINK, ARKA],
  /* `BM-42` — early tenants keep launch pricing for 24 months MINIMUM. The floor is the promise;
     a longer protection is generous and allowed, a shorter one would break the guarantee. */
  priceProtectionMonths: 24,
};
