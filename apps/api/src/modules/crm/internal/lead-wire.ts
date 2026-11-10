import type { LeadSummary, MemberRef, MonthlyBill } from '@heliogrid/contracts';
import { minorUnits } from '@heliogrid/domain';
import { minorUnitsToDecimal } from '@heliogrid/domain/server';

/** The tenant's currency as a lead read states its bill (`M02-40`): the code and its minor unit. */
export interface LeadMoney {
  readonly currencyCode: string;
  readonly minorUnitDigits: number;
}

/** One row of `leadSummaryColumns` (`crm.lead-columns.repository.ts`). */
export interface LeadSummaryRow {
  readonly id: string;
  readonly customerId: string;
  readonly name: string | null;
  readonly phoneE164: string;
  readonly city: string | null;
  readonly segment: LeadSummary['segment'];
  readonly source: LeadSummary['source'];
  readonly stage: LeadSummary['stage'];
  readonly state: LeadSummary['state'];
  readonly ownerId: string | null;
  readonly ownerName: string | null;
  readonly monthlyBillMinor: number | null;
  readonly createdAt: Date;
  readonly lastActivityAt: Date;
}

/** A member reference, or `null` where no member is named. */
export function memberRefOf(userId: string | null, name: string | null): MemberRef | null {
  return userId === null ? null : { userId, name: name ?? '' };
}

/** The bill typed from a call is `assumed` (`F8-01`); the document carries the currency. */
export function monthlyBillOf(minor: number | null, money: LeadMoney): MonthlyBill | null {
  if (minor === null) return null;
  return { amount: minorUnitsToDecimal(minorUnits(minor), money.minorUnitDigits), tier: 'assumed' };
}

/** A lead as the list, the inbox and the detail's header show it. Value is a named gap (decision 14). */
export function leadSummaryOf(row: LeadSummaryRow, money: LeadMoney): LeadSummary {
  return {
    id: row.id,
    customerId: row.customerId,
    name: row.name,
    phoneE164: row.phoneE164,
    city: row.city,
    segment: row.segment,
    source: row.source,
    stage: row.stage,
    state: row.state,
    owner: memberRefOf(row.ownerId, row.ownerName),
    monthlyBill: monthlyBillOf(row.monthlyBillMinor, money),
    value: null,
    createdAt: row.createdAt.toISOString(),
    lastActivityAt: row.lastActivityAt.toISOString(),
  };
}

/** The tenant market's currency, as the pack's formats state it (`F1-07`). */
export function moneyOf(formats: { currency: string; minorUnitDigits: number }): LeadMoney {
  return { currencyCode: formats.currency, minorUnitDigits: formats.minorUnitDigits };
}
