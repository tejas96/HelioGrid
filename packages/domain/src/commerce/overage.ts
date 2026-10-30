import type { MinorUnits } from '../money/minor-units';
import type { BilledLedgerMeter } from './usage';

/**
 * Overage add-ons (`M12-35`): what a company used past its allowance in one closed paid period,
 * billed at the book's published rate as add-ons on a later mandate debit. The money half is
 * `overage-amounts.ts`, on the server entry; this half is the vocabulary and the clock rules.
 */

/**
 * One add-on's life: reckoned (`pending`), claimed and sent to the gateway (`adding` — it stays
 * here when the gateway does not answer, since it may be on the debit), on the next debit
 * (`added`), on the invoice of the debit that collected it (`invoiced`), or too large for any one
 * debit the mandate can make (`over_cap`).
 */
export const OVERAGE_ADDON_STATUSES = [
  'pending',
  'adding',
  'added',
  'invoiced',
  'over_cap',
] as const;
export type OverageAddOnStatus = (typeof OVERAGE_ADDON_STATUSES)[number];

/** Days a closed period waits before it is reckoned, so the ledger's late rows land in it. */
export const OVERAGE_SETTLE_DAYS = 1;

/**
 * Days after its close a period may still be reckoned. Older periods are never billed: the first
 * run after a deploy, or after an outage, bills no company for a period long gone.
 */
export const OVERAGE_REACH_DAYS = 7;

/**
 * An add-on joins a debit only while that debit is at least this far away, so the gateway has it
 * before it raises the debit. Nearer, it waits for the debit after.
 */
export const ADD_ON_LEAD_DAYS = 2;

/**
 * Ledger units in one billed unit, for each meter that bills per unit; `null` where the billed
 * unit is not ruled yet. Voice is ledgered in seconds and billed in minutes. Sends bill per channel
 * and the ledger carries no channel; a seat-second has no ruled seat-month.
 */
const LEDGER_UNITS_PER_BILLED_UNIT: Record<BilledLedgerMeter, number | null> = {
  voice_minutes: 60,
  ai_roof_detections: 1,
  marketing_sends: null,
  tracked_field_seats: null,
};

/** A meter the book makes sellable that the product cannot bill yet: its unit or channel is not ruled. */
export class UnbillableMeter extends Error {
  override readonly name = 'UnbillableMeter';
}

/**
 * A ledger total in the unit the book prices and the usage screen shows, turned once on the total
 * and rounded down: no company pays for a minute it did not finish (`M12-35`).
 */
export function billedQuantityOf(meter: BilledLedgerMeter, ledgerTotal: number): number {
  const perBilledUnit = LEDGER_UNITS_PER_BILLED_UNIT[meter];
  if (perBilledUnit === null) {
    throw new UnbillableMeter(
      `${meter} has no ruled billed unit, so it cannot be billed or shown yet`,
    );
  }
  return Math.floor(ledgerTotal / perBilledUnit);
}

/** One meter's overage in a closed period, as the add-on and its invoice line carry it. */
export interface OverageAddOn {
  readonly meter: BilledLedgerMeter;
  /** What the company used, in billed units. */
  readonly used: number;
  readonly allowance: number;
  /** Billed units past the allowance. */
  readonly quantity: number;
  /** The book's published per-unit rate, ex-tax. */
  readonly rate: MinorUnits;
  /** `quantity × rate`, ex-tax. */
  readonly amount: MinorUnits;
}

/** Whether a waiting add-on goes to the gateway now, waits for a later debit, or fits none. */
export type AddOnVerdict = 'add' | 'wait' | 'over_cap';
