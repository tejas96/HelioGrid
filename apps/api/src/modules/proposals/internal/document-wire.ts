import type {
  GenerateVerdictWire,
  MoneyFigure,
  ProposalDocument,
  ProposalEmiWire,
  ProposalGeneration,
  ProposalMoneyWire,
  ProposalSavingsWire,
  ProposalVersion,
} from '@heliogrid/contracts';
import {
  basisPointsToPercent,
  bestMonth,
  capacityChangedSinceEdit,
  compliantShades,
  type GenerateVerdict,
  type MinorUnits,
  type ProjectionAssumptions,
  type ProposalEmi,
  type ProposalMoney,
  type ProposalSavings,
  type ProposalVersionSnapshot,
  type QualifiedAmount,
  type VersionDiff,
  type VersionFactValue,
} from '@heliogrid/domain';
import { minorUnitsToDecimal } from '@heliogrid/domain/server';
import { type FieldSetReader, fieldSetWire } from './field-set-wire';

/*
 * The proposal's one value set as the wire carries it (`M06-50`, `F5-38`): a draft's live assembly
 * and a version's frozen snapshot go through the SAME mapping, so the builder, the document, the
 * print page and the customer's link read one shape. Our cost and the margin leave here only for a
 * reader who may see cost, and never from a version (`M06-09`).
 */

/** What the wire names of a document that its snapshot does not hold. */
export interface DocumentFacts {
  readonly number: string | null;
  readonly version: number | null;
  readonly date: Date;
  /** Short-lived addresses of the company's pictures; `null` where it has none. */
  readonly logoUrl: string | null;
  readonly coverPhotoUrl: string | null;
  /** Who prepared it, for the operator's side; absent on the customer's. */
  readonly preparedByUserId: string | null;
}

const decimal = (amount: MinorUnits, digits: number): string => minorUnitsToDecimal(amount, digits);

function figure(amount: MinorUnits, qualified: QualifiedAmount, digits: number): MoneyFigure {
  return {
    amount: decimal(amount, digits),
    tier: qualified.tier,
    standing: qualified.standing,
    freshness: qualified.freshness?.kind ?? null,
  };
}

function assumptionsWire(assumed: ProjectionAssumptions, digits: number) {
  return {
    horizonYears: assumed.horizonYears,
    ...(assumed.escalationRate === undefined
      ? {}
      : { escalationPercent: basisPointsToPercent(assumed.escalationRate) }),
    ...(assumed.interestRate === undefined
      ? {}
      : { interestPercent: basisPointsToPercent(assumed.interestRate) }),
    ...(assumed.margin === undefined
      ? {}
      : { marginPercent: basisPointsToPercent(assumed.margin) }),
    ...(assumed.incentive === undefined ? {} : { incentive: decimal(assumed.incentive, digits) }),
  };
}

/** A share in basis points as two-decimal text, its sign kept: a loss reads `-4.20`. */
function signedPercent(share: number): string {
  return share < 0 ? `-${basisPointsToPercent(-share)}` : basisPointsToPercent(share);
}

/** The money block on the wire; the margin only for a reader who may see cost (`M06-37`). */
export function moneyWire(money: ProposalMoney, reader: FieldSetReader): ProposalMoneyWire {
  const digits = reader.minorUnitDigits;
  const { figures } = money;
  return {
    currencyCode: money.currency,
    equation: money.equation.lines.map((line) => ({
      key: line.key ?? line.label,
      label: line.label,
      amount: line.amount === null ? null : decimal(line.amount, digits),
      kind: line.kind,
    })),
    taxes: money.taxes.map((tax) => ({ code: tax.code, amount: decimal(tax.amount, digits) })),
    preTax: decimal(money.preTax, digits),
    discount: decimal(money.discount, digits),
    taxAmount: decimal(money.taxAmount, digits),
    payable: figure(money.payable, figures.payable, digits),
    payableAtOrBelowZero: money.payableAtOrBelowZero,
    incentiveOffered: money.incentiveOffered,
    incentive:
      money.incentive === null || figures.incentive === null
        ? null
        : {
            scheme: money.incentive.scheme,
            figure: figure(money.incentive.amount, figures.incentive, digits),
            paidTo: money.incentive.paidTo,
          },
    netCost: figure(money.netCost, figures.netCost, digits),
    perKw:
      money.perKw === null || figures.perKw === null
        ? null
        : figure(money.perKw, figures.perKw, digits),
    tranches:
      money.tranches === null
        ? null
        : money.tranches.map((part) => ({
            label: part.label,
            percent: basisPointsToPercent(part.share),
            dueOnStage: part.dueOnStage,
            amount: decimal(part.amount, digits),
          })),
    ...(reader.seesCost
      ? {
          margin:
            money.margin === null
              ? null
              : {
                  amount: decimal(money.margin.amount, digits),
                  sharePercent:
                    money.margin.share === null ? null : signedPercent(money.margin.share),
                  belowCost: money.margin.belowCost,
                },
        }
      : {}),
  };
}

function savingsWire(savings: ProposalSavings, digits: number): ProposalSavingsWire {
  return {
    yearly: figure(savings.yearly, savings.figures.yearly, digits),
    monthly: figure(savings.monthly, savings.figures.monthly, digits),
    lifetime: figure(savings.lifetime, savings.figures.lifetime, digits),
    billWithSolar: savings.billWithSolar === null ? null : decimal(savings.billWithSolar, digits),
    cumulative: savings.cumulative.map((amount) => decimal(amount, digits)),
    paybackYears: savings.paybackYears,
    assumptions: assumptionsWire(savings.assumptions, digits),
  };
}

function emiWire(emi: ProposalEmi, digits: number): ProposalEmiWire {
  return {
    monthly: figure(emi.monthly, emi.figure, digits),
    months: emi.months,
    assumptions: assumptionsWire(emi.assumptions, digits),
  };
}

function generationWire(snapshot: LiveDocument): ProposalGeneration | null {
  const made = snapshot.generation;
  if (made === null) return null;
  const { source } = made;
  return {
    monthlyKwh: [...made.monthlyKwh],
    yearlyKwh: made.yearlyKwh,
    bestMonth: bestMonth(made.monthlyKwh),
    source:
      source === null
        ? null
        : source.kind === 'estimate'
          ? { kind: 'estimate' }
          : { kind: 'record', databases: [...source.databases] },
    grain: made.grain,
    /* `M06-10`: a figure filled from the size and the location is `estimated`, never stronger. */
    tier: 'estimated',
    capacityChangedSinceEdit: capacityChangedSinceEdit(
      snapshot.fields.performance,
      snapshot.fields.system.capacityKw,
    ),
  };
}

/** A document's value set on the wire: the live assembly of a draft, or a version's frozen record. */
export function documentWire(
  snapshot: LiveDocument,
  facts: DocumentFacts,
  reader: FieldSetReader,
): ProposalDocument {
  const digits = reader.minorUnitDigits;
  const { company, deal } = snapshot;
  return {
    number: facts.number,
    version: facts.version,
    date: facts.date.toISOString(),
    fields: fieldSetWire(snapshot.fields, reader),
    deal: {
      ...deal,
      monthlyBill: deal.monthlyBill === null ? null : decimal(deal.monthlyBill, digits),
    },
    company: {
      name: company.name,
      phoneE164: company.phoneE164,
      email: company.email,
      website: company.website,
      address: company.address,
      logoUrl: facts.logoUrl,
      coverPhotoUrl: facts.coverPhotoUrl,
      taxRegistration: company.taxRegistration,
      bankDetails: company.bankDetails,
      brandColour: company.brandColour,
      shades: company.brandColour === null ? null : compliantShades(company.brandColour),
    },
    money: moneyOrNone(snapshot, reader),
    generation: generationWire(snapshot),
    savings: snapshot.savings === null ? null : savingsWire(snapshot.savings, digits),
    emi: snapshot.emi === null ? null : emiWire(snapshot.emi, digits),
    pages: [...snapshot.pages],
    basisLine: snapshot.basisLine,
    validityDays: snapshot.validityDays,
    language: snapshot.language,
    preparedBy: { userId: facts.preparedByUserId, ...snapshot.preparedBy },
  };
}

/** A draft with no price typed holds no money block (`LiveDocument.money`). */
function moneyOrNone(snapshot: LiveDocument, reader: FieldSetReader): ProposalMoneyWire | null {
  return snapshot.money === null ? null : moneyWire(snapshot.money, reader);
}

/**
 * A draft's live assembly: a version's snapshot in every part, save that its money block is absent
 * until a price is typed — a figure with no resolved value is never counted as zero.
 */
export type LiveDocument = Omit<ProposalVersionSnapshot, 'money'> & {
  readonly money: ProposalMoney | null;
};

/** The checklist's verdict on the wire: amounts as decimals, shares as two-decimal percents. */
export function verdictWire(verdict: GenerateVerdict, digits: number): GenerateVerdictWire {
  return {
    blocks: verdict.blocks.map((block) => {
      const located = { step: block.step, fields: [...block.fields] };
      switch (block.check) {
        case 'payable_not_positive':
          return { ...located, check: block.check, payable: decimal(block.payable, digits) };
        case 'tranches_not_whole':
          return {
            ...located,
            check: block.check,
            allocatedPercent: signedPercent(block.allocated),
            remainderPercent: signedPercent(block.remainder),
          };
        default:
          return { ...block, fields: located.fields };
      }
    }),
    warnings: verdict.warnings.map((warning) =>
      warning.check === 'below_cost'
        ? {
            step: warning.step,
            fields: [...warning.fields],
            check: warning.check,
            loss: warning.loss === null ? null : decimal(warning.loss, digits),
          }
        : { ...warning, fields: [...warning.fields] },
    ),
    skipped: verdict.skipped.map((skipped) => ({ ...skipped, fields: [...skipped.fields] })),
    canGenerate: verdict.canGenerate,
  };
}

function factValueWire(value: VersionFactValue, digits: number) {
  return value.kind === 'money'
    ? { kind: value.kind, amount: decimal(value.amount, digits) }
    : { ...value };
}

/** What moved between two versions, on the wire (`M06-42`). */
export function diffWire(diff: VersionDiff, digits: number): NonNullable<ProposalVersion['diff']> {
  return {
    changes: diff.changes.map((change) => ({
      fact: change.fact,
      from: factValueWire(change.from, digits),
      to: factValueWire(change.to, digits),
    })),
    pagesUnchanged: diff.pagesUnchanged,
  };
}
