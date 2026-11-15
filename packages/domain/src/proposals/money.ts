import { allocationVerdict } from '../commerce/tranche-allocation';
import type { Freshness } from '../format/freshness';
import { type QualifiedAmount, qualifyMinorUnits, STATED_FIGURE_TIER } from '../format/qualified';
import { applyRate, type BasisPoints, basisPoints, proportionOf } from '../money/basis-points';
import { type PayableLine, type ResolvedPayable, resolvePayable } from '../money/equation';
import {
  amountForQuantity,
  type MinorUnits,
  minorUnits,
  sumMinorUnits,
} from '../money/minor-units';
import { type SchedulePart, splitSchedule } from '../payments/schedule';
import { subsidyAmount } from '../subsidy/amount';
import type { IncentiveReceiver, SubsidyPack } from '../subsidy/pack';
import { isIncentiveOffered } from '../subsidy/path';
import {
  type InclusiveLine,
  inclusiveTaxBreakdown,
  type MoneyScheme,
  type PlaceOfSupply,
  type TaxBreakdown,
  type TaxComponentAmount,
  taxBreakdown,
} from '../tax/breakdown';
import { placeOfArea } from '../tax/registration';
import type {
  DiscountFields,
  ProposalCompanyFacts,
  ProposalDealFacts,
  ProposalFieldSet,
} from './field-set';
import type { ProposalMoneyLineKey } from './money-lines';

/**
 * The proposal money block (`M06-34`, `M06-35`, `M06-38`, `T-M06-024`): ONE computation, on the
 * server, that the builder, the document, the customer's link, the payment plan and Mark won all
 * print. Scheme-generic — the tax rule, the incentive model and who receives it are the market
 * pack's — and whole minor units throughout, so every reader agrees to the paisa.
 *
 * The typed price INCLUDES tax and is the authority: the pre-tax figure is derived from it and the
 * tax is the difference. A discount is pre-tax, pro-rated across the system and the battery by
 * value, and the tax is then worked out again on what the customer actually pays.
 */

export interface ProposalMoneyInput {
  readonly scheme: MoneyScheme;
  readonly subsidy: SubsidyPack;
  readonly fields: Pick<ProposalFieldSet, 'system' | 'payment'>;
  readonly deal: Pick<ProposalDealFacts, 'segment' | 'area'>;
  readonly company: Pick<ProposalCompanyFacts, 'taxRegistered' | 'supplierPlace'>;
  /** What each line of the equation is called — the caller's words, in the reader's language. */
  readonly lineLabels: Readonly<Record<ProposalMoneyLineKey, string>>;
  /** Whether the figures are still current (`F8-13`); `null` for a version's frozen record. */
  readonly freshness: Freshness | null;
}

/** The incentive a proposal carries (`M06-38`): the pack's own amount, and who it is paid to. */
export interface ProposalIncentive {
  readonly scheme: string;
  readonly amount: MinorUnits;
  readonly paidTo: IncentiveReceiver;
}

/** The margin on a typed price (`M06-37`) — for holders of the cost grant alone. */
export interface ProposalMargin {
  /** The pre-tax amount the customer pays, less our cost. Tax never counts as margin. */
  readonly amount: MinorUnits;
  /** The margin as a share of that pre-tax amount, in basis points; `null` where it is zero. */
  readonly share: number | null;
  /** Priced below our cost: the loss is `amount`, negative (`M06-37` warns, never blocks). */
  readonly belowCost: boolean;
}

export interface ProposalMoney {
  readonly currency: string;
  /** The equation as a card prints it, line by line (`M06-35`). */
  readonly equation: ResolvedPayable<PayableLine>;
  /** The document-level tax breakdown (`M06-34`); empty for a company with no tax registration. */
  readonly taxes: readonly TaxComponentAmount[];
  /** What the customer pays the company before tax, after the discount. */
  readonly preTax: MinorUnits;
  readonly discount: MinorUnits;
  readonly taxAmount: MinorUnits;
  /** What the customer pays the company — the payment plan's and the Won value's figure. */
  readonly payable: MinorUnits;
  /** `payable ≤ 0` — read from the payable itself, so a zero price with no discount blocks too (`M06-36`). */
  readonly payableAtOrBelowZero: boolean;
  /** Whether the market offers this deal an incentive at all — where step 3 shows its switch. */
  readonly incentiveOffered: boolean;
  /** `null` where none is offered or the person left the incentive path. */
  readonly incentive: ProposalIncentive | null;
  /** What the system costs the customer once the incentive reaches them (`M06-35`). */
  readonly netCost: MinorUnits;
  /** `null` until our cost is typed. */
  readonly margin: ProposalMargin | null;
  /** The payable for each kW — a check on a typed price, never printed and never stored. */
  readonly perKw: MinorUnits | null;
  /** The payment plan's amounts; `null` until its shares add up and the payable is above zero. */
  readonly tranches: readonly SchedulePart[] | null;
  /** The same figures as a screen reads them, each with its tier. */
  readonly figures: ProposalMoneyFigures;
}

export interface ProposalMoneyFigures {
  readonly payable: QualifiedAmount;
  readonly taxAmount: QualifiedAmount;
  readonly discount: QualifiedAmount | null;
  readonly incentive: QualifiedAmount | null;
  readonly netCost: QualifiedAmount;
  readonly perKw: QualifiedAmount | null;
  readonly margin: QualifiedAmount | null;
}

const NO_RATE = basisPoints(0);

function placeOf(input: ProposalMoneyInput): PlaceOfSupply {
  const supplier = input.company.supplierPlace ?? '';
  const area = input.deal.area?.area;
  const recipient = area === undefined ? null : placeOfArea(input.scheme.tax, area);
  return { supplier, recipient: recipient ?? supplier };
}

/** The discount as an amount: the typed amount, or the typed percent of the pre-tax price. */
function discountAmount(discount: DiscountFields | null, listed: MinorUnits): MinorUnits {
  if (discount === null) return minorUnits(0);
  return discount.mode === 'amount' ? discount.amount : applyRate(listed, discount.percent);
}

/**
 * The breakdown of what the customer pays. With no discount the typed prices stand to the minor
 * unit; with one, each line's share of it comes off before tax and the tax is worked out on the rest.
 */
function breakdownOf(
  input: ProposalMoneyInput,
  typed: readonly InclusiveLine[],
): { readonly listed: TaxBreakdown; readonly paid: TaxBreakdown; readonly discount: MinorUnits } {
  const place = placeOf(input);
  const listed = inclusiveTaxBreakdown(input.scheme, typed, place);
  const discount = discountAmount(input.fields.system.discount, listed.taxableAmount);
  if (discount === 0) return { listed, paid: listed, discount };
  let left = discount;
  const paid = taxBreakdown(
    input.scheme,
    listed.lines.map((line, index) => {
      const isLast = index === listed.lines.length - 1;
      const share =
        isLast || listed.taxableAmount === 0
          ? isLast
            ? left
            : minorUnits(0)
          : proportionOf(discount, { parts: line.taxableAmount, ofParts: listed.taxableAmount });
      left = minorUnits(left - share);
      /* `M06-36`: past the price nothing is left to tax — the tax is zero, never a refund. */
      return {
        taxableAmount: minorUnits(Math.max(0, line.taxableAmount - share)),
        rateBasisPoints: line.rateBasisPoints,
      };
    }),
    place,
  );
  return { listed, paid, discount };
}

function incentiveOf(input: ProposalMoneyInput): {
  readonly offered: boolean;
  readonly incentive: ProposalIncentive | null;
} {
  const { subsidy, deal, fields } = input;
  const { capacityKw, systemType, incentiveClaimed } = fields.system;
  const offered =
    subsidy.offered &&
    deal.segment !== null &&
    isIncentiveOffered(subsidy, { segment: deal.segment, systemType });
  if (!offered || !subsidy.offered || deal.segment === null) return { offered, incentive: null };
  if (!incentiveClaimed || capacityKw === null) return { offered, incentive: null };
  const amount = subsidyAmount(subsidy, {
    segment: deal.segment,
    capacityKwp: capacityKw,
    region: deal.area?.area ?? null,
  });
  return { offered, incentive: { scheme: subsidy.scheme, amount, paidTo: subsidy.paidTo } };
}

function marginOf(preTax: MinorUnits, ourCost: MinorUnits | null): ProposalMargin | null {
  if (ourCost === null) return null;
  const amount = minorUnits(preTax - ourCost);
  return {
    amount,
    share: preTax === 0 ? null : Math.round((amount * 10_000) / preTax),
    belowCost: amount < 0,
  };
}

function tranchesOf(
  payable: MinorUnits,
  payment: ProposalFieldSet['payment'],
): readonly SchedulePart[] | null {
  const met = allocationVerdict(payment.tranches.map((tranche) => tranche.share)).state === 'met';
  return met && payable > 0 ? splitSchedule(payable, payment.tranches) : null;
}

/** The lines the person typed, tax included: the system, and the battery where there is one. */
function typedLines(input: ProposalMoneyInput): readonly InclusiveLine[] | null {
  const { system } = input.fields;
  const rateOf = (rate: BasisPoints): BasisPoints => (input.company.taxRegistered ? rate : NO_RATE);
  if (system.priceInclusive === null) return null;
  const typed: InclusiveLine[] = [
    { inclusiveAmount: system.priceInclusive, rateBasisPoints: rateOf(system.taxRate) },
  ];
  if (system.battery === null) return typed;
  if (system.battery.costInclusive === null) return null;
  typed.push({
    inclusiveAmount: system.battery.costInclusive,
    rateBasisPoints: rateOf(system.battery.taxRate),
  });
  return typed;
}

/** The equation as a card prints it: each line present only where it has something to say. */
function equationOf(
  input: ProposalMoneyInput,
  listed: TaxBreakdown,
  paid: TaxBreakdown,
  discount: MinorUnits,
  incentive: ProposalIncentive | null,
): ResolvedPayable<PayableLine> {
  const labels = input.lineLabels;
  /* The system is the first typed line and the battery, where there is one, the second. */
  const battery = listed.lines[1]?.taxableAmount ?? null;
  const system = minorUnits(listed.taxableAmount - (battery ?? 0));
  const lines: PayableLine[] = [{ key: 'system', label: labels.system, amount: system }];
  if (battery !== null) lines.push({ key: 'battery', label: labels.battery, amount: battery });
  if (discount !== 0) {
    lines.push({ key: 'discount', label: labels.discount, amount: discount, kind: 'deduct' });
  }
  if (input.company.taxRegistered) {
    lines.push({ key: 'tax', label: labels.tax, amount: paid.taxAmount });
  }
  /* `M06-35`: an incentive the CUSTOMER receives is never a line — it does not lower the payable. */
  if (incentive !== null && incentive.paidTo === 'company') {
    lines.push({
      key: 'incentive',
      label: labels.incentive,
      amount: incentive.amount,
      kind: 'deduct',
    });
  }
  return resolvePayable<PayableLine>({ lines });
}

function perKwOf(payable: MinorUnits, capacityKw: number | null): MinorUnits | null {
  return capacityKw !== null && capacityKw > 0 ? amountForQuantity(payable, 1 / capacityKw) : null;
}

/**
 * The money block of one proposal, or `null` while no price is typed — a figure with no resolved
 * value is never counted as zero (`money/equation.ts`). A battery with no cost typed yet makes the
 * block `null` too: the payable covers the battery, so it cannot be stated without it.
 */
export function proposalMoney(input: ProposalMoneyInput): ProposalMoney | null {
  const typed = typedLines(input);
  if (typed === null) return null;
  const { system, payment } = input.fields;
  const { listed, paid, discount } = breakdownOf(input, typed);
  /* Signed: below zero while the discount is past the price, where `paid` has nothing to tax. */
  const preTax = minorUnits(listed.taxableAmount - discount);
  const { offered, incentive } = incentiveOf(input);
  const equation = equationOf(input, listed, paid, discount, incentive);
  const payable = equation.payable;
  const toCustomer = incentive !== null && incentive.paidTo === 'customer';
  const netCost = toCustomer ? minorUnits(payable - incentive.amount) : payable;
  const margin = marginOf(preTax, system.ourCost);
  const perKw = perKwOf(payable, system.capacityKw);
  const figure = (amount: MinorUnits): QualifiedAmount =>
    qualifyMinorUnits(input.scheme.formats, amount, {
      /* `F8-21`: a typed figure with no design behind it is `assumed`, and so is all it is summed into. */
      tier: STATED_FIGURE_TIER,
      projection: null,
      energySource: null,
      freshness: input.freshness,
    });
  const orNone = (amount: MinorUnits | null | undefined): QualifiedAmount | null =>
    amount === null || amount === undefined ? null : figure(amount);
  return {
    currency: paid.currency,
    equation,
    taxes: input.company.taxRegistered ? paid.components : [],
    preTax,
    discount,
    taxAmount: paid.taxAmount,
    payable,
    payableAtOrBelowZero: payable <= 0,
    incentiveOffered: offered,
    incentive,
    netCost,
    margin,
    perKw,
    tranches: tranchesOf(payable, payment),
    figures: {
      payable: figure(payable),
      taxAmount: figure(paid.taxAmount),
      discount: orNone(discount === 0 ? null : discount),
      incentive: orNone(incentive?.amount),
      netCost: figure(netCost),
      perKw: orNone(perKw),
      margin: orNone(margin?.amount),
    },
  };
}

/** The sum a version's tranche rows must reach: the payable, to the minor unit (`M11-08`). */
export function tranchesTotal(parts: readonly SchedulePart[]): MinorUnits {
  return sumMinorUnits(parts.map((part) => part.amount));
}
