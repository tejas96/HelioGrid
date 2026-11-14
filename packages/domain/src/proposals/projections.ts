import type { EnergySource } from '../format/energy-source';
import type { Freshness } from '../format/freshness';
import type { FormatPack } from '../format/pack';
import type { ProjectionAssumptions } from '../format/projection';
import { type QualifiedAmount, qualifyMinorUnits } from '../format/qualified';
import type { BasisPoints } from '../money/basis-points';
import {
  amountForQuantity,
  type MinorUnits,
  minorUnits,
  sumMinorUnits,
  wholeMajorUnits,
} from '../money/minor-units';
import { MONTHS_PER_YEAR } from './energy';
import type { EmiFields, FinancialFields, MonthlyFigures } from './field-set';

/**
 * A proposal's projections (`M06-11`, `M06-40`, `F8-23`): what the system saves, when it pays for
 * itself, and what an EMI would be. Each is a projection — never money owed, earned or promised —
 * and travels with the assumptions it rests on. Server-only: every figure here is worked out.
 */

export interface SavingsInput {
  readonly formats: FormatPack;
  /** The system's kWh for each month (`systemMonthlyKwh`). */
  readonly monthlyKwh: MonthlyFigures;
  readonly source: EnergySource | null;
  readonly financials: FinancialFields & { readonly tariffPerKwh: MinorUnits };
  /** The lead's monthly bill; `null` where it is not known, and then nothing caps the saving. */
  readonly monthlyBill: MinorUnits | null;
  /** What one exported unit earns (`formats.proposal.exportRatePerKwh`). */
  readonly exportRatePerKwh: MinorUnits;
  /** What the system costs the customer once the incentive reaches them. */
  readonly netCost: MinorUnits;
  /** The incentive the net cost already counts; `null` for none. */
  readonly incentive: MinorUnits | null;
  readonly freshness: Freshness | null;
}

export interface ProposalSavings {
  readonly yearly: MinorUnits;
  /** A twelfth of the year — the figure the customer reads first. */
  readonly monthly: MinorUnits;
  /** The bill left after an average month's saving; `null` where the bill is not known. */
  readonly billWithSolar: MinorUnits | null;
  /** The saving summed over the horizon, the tariff rising each year. */
  readonly lifetime: MinorUnits;
  /** The saving to date at the end of each year of the horizon — the curve the net cost crosses. */
  readonly cumulative: readonly MinorUnits[];
  /** Years until the saving to date reaches the net cost; `null` where nothing is saved. */
  readonly paybackYears: number | null;
  readonly assumptions: ProjectionAssumptions;
  readonly figures: {
    readonly yearly: QualifiedAmount;
    readonly monthly: QualifiedAmount;
    readonly lifetime: QualifiedAmount;
  };
}

/**
 * One month's saving (`T-M06-033`): the units used on site at the tariff, the rest at the export
 * rate, and never more than the bill where the bill is known — a system cannot save what was never
 * being paid.
 */
function monthSaving(input: SavingsInput, kwh: number): MinorUnits {
  const { tariffPerKwh } = input.financials;
  if (input.monthlyBill === null || tariffPerKwh <= 0) return amountForQuantity(tariffPerKwh, kwh);
  const usedOnSite = Math.min(kwh, input.monthlyBill / tariffPerKwh);
  const earned = sumMinorUnits([
    amountForQuantity(tariffPerKwh, usedOnSite),
    amountForQuantity(input.exportRatePerKwh, kwh - usedOnSite),
  ]);
  return earned > input.monthlyBill ? input.monthlyBill : earned;
}

/** `1 + r + r² + …` over `years` terms: what a yearly figure growing at `rise` adds up to. */
function growthSum(rise: BasisPoints, years: number): number {
  let sum = 0;
  for (let year = 0; year < years; year += 1) sum += (1 + rise / 10_000) ** year;
  return sum;
}

/**
 * Years until the growing saving has paid the net cost back: whole years passed, plus the part of
 * the year it is reached in. `null` where nothing is saved or the horizon ends first.
 */
function paybackYearsOf(
  netCost: MinorUnits,
  yearly: MinorUnits,
  rise: BasisPoints,
  horizonYears: number,
): number | null {
  if (yearly <= 0) return null;
  if (netCost <= 0) return 0;
  let paid = 0;
  for (let year = 0; year < horizonYears; year += 1) {
    const thisYear = yearly * (1 + rise / 10_000) ** year;
    if (paid + thisYear >= netCost) return year + (netCost - paid) / thisYear;
    paid += thisYear;
  }
  return null;
}

/** What the system saves, as projections carrying their assumptions (`M06-11`, `F8-23`). */
export function proposalSavings(input: SavingsInput): ProposalSavings {
  const { tariffRise, horizonYears } = input.financials;
  const whole = (amount: number) => wholeMajorUnits(amount, input.formats.minorUnitDigits);
  /* Every figure is worked from the exact year and rounded once, so none rounds a rounded one. */
  const exactYearly = sumMinorUnits(input.monthlyKwh.map((kwh) => monthSaving(input, kwh)));
  const exactMonthly = exactYearly / MONTHS_PER_YEAR;
  const yearly = whole(exactYearly);
  const monthly = whole(exactMonthly);
  const cumulative = Array.from({ length: horizonYears }, (_, year) =>
    whole(exactYearly * growthSum(tariffRise, year + 1)),
  );
  const assumptions: ProjectionAssumptions = {
    horizonYears,
    escalationRate: tariffRise,
    ...(input.incentive === null ? {} : { incentive: input.incentive }),
  };
  const figure = (amount: MinorUnits): QualifiedAmount =>
    qualifyMinorUnits(input.formats, amount, {
      /* `M06-10`, `M06-11`: a figure filled from the size and the location is `estimated`. */
      tier: 'estimated',
      projection: assumptions,
      energySource: input.source,
      freshness: input.freshness,
    });
  const lifetime = cumulative[cumulative.length - 1] ?? minorUnits(0);
  return {
    yearly,
    monthly,
    billWithSolar:
      input.monthlyBill === null ? null : whole(Math.max(0, input.monthlyBill - exactMonthly)),
    lifetime,
    cumulative,
    paybackYears: paybackYearsOf(input.netCost, exactYearly, tariffRise, horizonYears),
    assumptions,
    figures: { yearly: figure(yearly), monthly: figure(monthly), lifetime: figure(lifetime) },
  };
}

export interface ProposalEmi {
  /** The equated instalment each month. */
  readonly monthly: MinorUnits;
  readonly months: number;
  readonly assumptions: ProjectionAssumptions;
  readonly figure: QualifiedAmount;
}

/**
 * The EMI example (`M06-40`): the payable repaid in equal monthly instalments at the typed yearly
 * rate over the typed tenure. An example, never a loan offer — a labelled projection of a typed
 * price, so its tier is the price's. `null` where there is nothing to repay or no months to repay in.
 */
export function proposalEmi(
  formats: FormatPack,
  payable: MinorUnits,
  emi: EmiFields,
  freshness: Freshness | null,
): ProposalEmi | null {
  const months = Math.round(emi.tenureYears * MONTHS_PER_YEAR);
  if (payable <= 0 || months <= 0) return null;
  const monthlyRate = emi.rate / 10_000 / MONTHS_PER_YEAR;
  const growth = (1 + monthlyRate) ** months;
  const factor = monthlyRate === 0 ? 1 / months : (monthlyRate * growth) / (growth - 1);
  const monthly = amountForQuantity(payable, factor);
  const assumptions: ProjectionAssumptions = {
    horizonYears: emi.tenureYears,
    interestRate: emi.rate,
  };
  return {
    monthly,
    months,
    assumptions,
    figure: qualifyMinorUnits(formats, monthly, {
      tier: 'assumed',
      projection: assumptions,
      energySource: null,
      freshness,
    }),
  };
}
