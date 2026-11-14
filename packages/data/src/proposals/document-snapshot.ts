import {
  type MoneyFigure,
  type ProjectionAssumptionsWire,
  type ProposalDocument,
  type ProposalEmiWire,
  type ProposalMoneyWire,
  type ProposalSavingsWire,
  UI_SOURCE_LOCALE,
} from '@heliogrid/contracts';
import {
  type EnergySource,
  type FormatPack,
  type MinorUnits,
  minorUnits,
  minorUnitsOfDecimal,
  type ProjectionAssumptions,
  type ProposalDraftValueSet,
  type ProposalEmi,
  type ProposalMoney,
  type ProposalSavings,
  type ProposalVersionSnapshot,
  percentToBasisPoints,
  type QualifiedAmount,
  qualifyMinorUnits,
  UNCHECKED,
  uiLanguageOfTag,
} from '@heliogrid/domain';
import { fieldSetOfDocument, sourceOf } from './document-fields';

/**
 * The proposal document's one value set (`F5-38`, `M06-50`) as the document's parts take it: the
 * wire's `ProposalDocument` read back into `packages/domain`'s snapshot, so the builder's stage,
 * the reader, the print page and the customer's link all hand `ProposalBlocks` and `ProposalPage`
 * the same thing. A figure is the server's own, relabelled with the market's format — never worked
 * out again here (`F4-04`).
 */

interface Reading {
  readonly formats: FormatPack;
  readonly amount: (text: string) => MinorUnits;
}

function assumptionsOf(wire: ProjectionAssumptionsWire, read: Reading): ProjectionAssumptions {
  return {
    horizonYears: wire.horizonYears,
    ...(wire.escalationPercent === undefined
      ? {}
      : { escalationRate: percentToBasisPoints(wire.escalationPercent) }),
    ...(wire.interestPercent === undefined
      ? {}
      : { interestRate: percentToBasisPoints(wire.interestPercent) }),
    ...(wire.marginPercent === undefined
      ? {}
      : { margin: percentToBasisPoints(wire.marginPercent) }),
    ...(wire.incentive === undefined ? {} : { incentive: read.amount(wire.incentive) }),
  };
}

/** What stands beside a figure wherever it prints: the projection it is, the source it drew on. */
interface Beside {
  readonly projection: ProjectionAssumptions | null;
  readonly energySource: EnergySource | null;
}
const PLAIN: Beside = { projection: null, energySource: null };

/**
 * A wire figure as a screen reads it. A version's figures are a record (`freshness: null`); a
 * draft's that the server did not call current read as never compared, so none reads final (`F8-12`).
 */
function figureOf(figure: MoneyFigure, read: Reading, beside: Beside = PLAIN): QualifiedAmount {
  return figureAt(read.amount(figure.amount), figure, read, beside);
}

function figureAt(
  amount: MinorUnits,
  like: Pick<MoneyFigure, 'tier' | 'standing' | 'freshness'>,
  read: Reading,
  beside: Beside = PLAIN,
): QualifiedAmount {
  const current = like.freshness === null || like.freshness === 'current';
  const base = {
    tier: like.tier,
    energySource: beside.energySource,
    freshness: current ? null : UNCHECKED,
  };
  if (beside.projection === null) {
    const standing = like.standing === null ? {} : { standing: like.standing };
    return qualifyMinorUnits(read.formats, amount, { ...base, ...standing, projection: null });
  }
  /* A projection is never `confirmed` (`F8-23`): the server does not send one so, and none is kept. */
  const claimed = like.standing === null || like.standing === 'confirmed' ? null : like.standing;
  return qualifyMinorUnits(read.formats, amount, {
    ...base,
    ...(claimed === null ? {} : { standing: claimed }),
    projection: beside.projection,
  });
}

/**
 * The equation's lines as the server sent them. Its two sub-totals are those lines added up again
 * only so the shape is whole — no part prints them; the payable is the server's own figure.
 */
function equationOf(wire: ProposalMoneyWire, read: Reading): ProposalMoney['equation'] {
  const lines = wire.equation.map((line) => ({
    key: line.key,
    label: line.label,
    kind: line.kind,
    amount: line.amount === null ? null : read.amount(line.amount),
  }));
  const totalOf = (kind: 'add' | 'deduct') =>
    minorUnits(
      lines.reduce((sum, line) => (line.kind === kind ? sum + (line.amount ?? 0) : sum), 0),
    );
  const payable = read.amount(wire.payable.amount);
  const deductions = totalOf('deduct');
  const unresolved = lines.filter((line) => line.amount === null).map((line) => line.key);
  return {
    lines,
    gross: totalOf('add'),
    deductions,
    payable,
    zeroOrBelow: deductions > 0 && payable <= 0,
    unresolved,
    reconciliation: null,
    payableStandsUp: unresolved.length === 0,
  };
}

function marginOf(wire: ProposalMoneyWire, read: Reading): ProposalMoney['margin'] {
  const margin = wire.margin ?? null;
  if (margin === null) return null;
  return {
    amount: read.amount(margin.amount),
    share: margin.sharePercent === null ? null : percentToBasisPoints(margin.sharePercent),
    belowCost: margin.belowCost,
  };
}

/** The money block in domain's shape (`M06-34`, `M06-35`). */
export function proposalMoneyOf(wire: ProposalMoneyWire, formats: FormatPack): ProposalMoney {
  const read: Reading = {
    formats,
    amount: (text) => minorUnitsOfDecimal(text, formats.minorUnitDigits),
  };
  const payable = read.amount(wire.payable.amount);
  const discount = read.amount(wire.discount);
  const taxAmount = read.amount(wire.taxAmount);
  const margin = marginOf(wire, read);
  const incentive =
    wire.incentive === null
      ? null
      : {
          scheme: wire.incentive.scheme,
          amount: read.amount(wire.incentive.figure.amount),
          paidTo: wire.incentive.paidTo,
        };
  return {
    currency: wire.currencyCode,
    equation: equationOf(wire, read),
    taxes: wire.taxes.map((tax) => ({ code: tax.code, amount: read.amount(tax.amount) })),
    preTax: read.amount(wire.preTax),
    discount,
    taxAmount,
    payable,
    payableAtOrBelowZero: wire.payableAtOrBelowZero,
    incentiveOffered: wire.incentiveOffered,
    incentive,
    netCost: read.amount(wire.netCost.amount),
    margin,
    perKw: wire.perKw === null ? null : read.amount(wire.perKw.amount),
    tranches:
      wire.tranches === null
        ? null
        : wire.tranches.map((tranche) => ({
            label: tranche.label,
            share: percentToBasisPoints(tranche.percent),
            dueOnStage: tranche.dueOnStage,
            amount: read.amount(tranche.amount),
          })),
    figures: {
      payable: figureOf(wire.payable, read),
      taxAmount: figureAt(taxAmount, wire.payable, read),
      discount: discount === 0 ? null : figureAt(discount, wire.payable, read),
      incentive: wire.incentive === null ? null : figureOf(wire.incentive.figure, read),
      netCost: figureOf(wire.netCost, read),
      perKw: wire.perKw === null ? null : figureOf(wire.perKw, read),
      margin: margin === null ? null : figureAt(margin.amount, wire.payable, read),
    },
  };
}

function savingsOf(
  wire: ProposalSavingsWire,
  read: Reading,
  energySource: EnergySource | null,
): ProposalSavings {
  const assumptions = assumptionsOf(wire.assumptions, read);
  const beside: Beside = { projection: assumptions, energySource };
  return {
    yearly: read.amount(wire.yearly.amount),
    monthly: read.amount(wire.monthly.amount),
    billWithSolar: wire.billWithSolar === null ? null : read.amount(wire.billWithSolar),
    lifetime: read.amount(wire.lifetime.amount),
    cumulative: wire.cumulative.map(read.amount),
    paybackYears: wire.paybackYears,
    assumptions,
    figures: {
      yearly: figureOf(wire.yearly, read, beside),
      monthly: figureOf(wire.monthly, read, beside),
      lifetime: figureOf(wire.lifetime, read, beside),
    },
  };
}

function emiOf(wire: ProposalEmiWire, read: Reading): ProposalEmi {
  const assumptions = assumptionsOf(wire.assumptions, read);
  return {
    monthly: read.amount(wire.monthly.amount),
    months: wire.months,
    assumptions,
    figure: figureOf(wire.monthly, read, { projection: assumptions, energySource: null }),
  };
}

/**
 * The document as the pages draw it, or `null` while a draft has no price typed — a figure with no
 * resolved value is never read as zero, so there is no money block to hand a page yet.
 */
export function proposalSnapshotOf(
  document: ProposalDocument,
  formats: FormatPack,
): ProposalVersionSnapshot | null {
  const valueSet = proposalValueSetOf(document, formats);
  return valueSet.money === null ? null : { ...valueSet, money: valueSet.money };
}

/**
 * The draft's value set as it stands, its money `null` until a price is typed — what the cover
 * draws before step 3 (`M06-51`); every other page takes `proposalSnapshotOf`.
 */
export function proposalValueSetOf(
  document: ProposalDocument,
  formats: FormatPack,
): ProposalDraftValueSet {
  const read: Reading = {
    formats,
    amount: (text) => minorUnitsOfDecimal(text, formats.minorUnitDigits),
  };
  const source = document.generation === null ? null : sourceOf(document.generation.source);
  const { company, deal } = document;
  return {
    fields: fieldSetOfDocument(document.fields, formats.minorUnitDigits),
    deal: {
      ...deal,
      monthlyBill: deal.monthlyBill === null ? null : read.amount(deal.monthlyBill),
    },
    company: {
      name: company.name,
      phoneE164: company.phoneE164,
      email: company.email,
      website: company.website,
      address: company.address,
      // The picture travels as a short-lived address (`proposalPageFactsOf`), never as a file id.
      logoFileId: null,
      taxRegistration: company.taxRegistration,
      bankDetails: company.bankDetails,
      brandColour: company.brandColour,
    },
    money: document.money === null ? null : proposalMoneyOf(document.money, formats),
    generation:
      document.generation === null
        ? null
        : {
            monthlyKwh: document.generation.monthlyKwh,
            yearlyKwh: document.generation.yearlyKwh,
            source,
            grain: document.generation.grain,
          },
    savings: document.savings === null ? null : savingsOf(document.savings, read, source),
    emi: document.emi === null ? null : emiOf(document.emi, read),
    pages: document.pages,
    basisLine: document.basisLine,
    validityDays: document.validityDays,
    // A language a newer server has learned reads in the source language here (`F3-05`).
    language: uiLanguageOfTag(document.language) ?? UI_SOURCE_LOCALE,
    preparedBy: { name: document.preparedBy.name, phoneE164: document.preparedBy.phoneE164 },
  };
}

export { type ProposalPageFactsRead, proposalPageFactsOf } from './document-page-facts';
