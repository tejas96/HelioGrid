import type { ComponentLineWire, ProposalFieldSetWire } from '@heliogrid/contracts';
import {
  type ComponentLine,
  type DiscountFields,
  type MinorUnits,
  minorUnitsOfDecimal,
  type ProposalFieldSet,
  percentToBasisPoints,
} from '@heliogrid/domain';

/**
 * A proposal's eleven-step field set as the wire carries it — amounts as decimal text, rates as
 * two-decimal percents — read back into the shape `packages/domain` types it in, so the document's
 * parts take the server's own answer (`F8-24`). Nothing is worked out here: every figure is the
 * one the server sent, in another spelling.
 */

type SystemWire = ProposalFieldSetWire['system'];

function discountOf(
  discount: SystemWire['discount'],
  amount: (text: string) => MinorUnits,
): DiscountFields | null {
  if (discount === null) return null;
  return discount.mode === 'percent'
    ? { mode: 'percent', percent: percentToBasisPoints(discount.percent) }
    : { mode: 'amount', amount: amount(discount.amount) };
}

function systemOf(
  system: SystemWire,
  amount: (text: string) => MinorUnits,
): ProposalFieldSet['system'] {
  const orNone = (text: string | null | undefined) =>
    text === null || text === undefined ? null : amount(text);
  return {
    capacityKw: system.capacityKw,
    systemType: system.systemType,
    battery:
      system.battery === null
        ? null
        : {
            capacityKwh: system.battery.capacityKwh,
            costInclusive: orNone(system.battery.costInclusive),
            taxRate: percentToBasisPoints(system.battery.taxPercent),
            chemistry: system.battery.chemistry,
            chemistryCustom: system.battery.chemistryCustom,
          },
    maintenance: system.maintenance,
    commissioningIncluded: system.commissioningIncluded,
    priceInclusive: orNone(system.priceInclusive),
    taxRate: percentToBasisPoints(system.taxPercent),
    discount: discountOf(system.discount, amount),
    incentiveClaimed: system.incentiveClaimed,
    emi:
      system.emi === null
        ? null
        : {
            rate: percentToBasisPoints(system.emi.ratePercent),
            tenureYears: system.emi.tenureYears,
          },
    // Our cost reaches only a reader who may see it; a customer's document never carries it.
    ourCost: orNone(system.ourCost),
  };
}

/** A line reads the same on both sides: only its readonly-ness differs. */
function componentOf(line: ComponentLineWire): ComponentLine {
  return line;
}

/** The field set in domain's shape; `minorUnitDigits` is the document currency's (`F1-07`). */
export function fieldSetOfDocument(
  fields: ProposalFieldSetWire,
  minorUnitDigits: number,
): ProposalFieldSet {
  const amount = (text: string): MinorUnits => minorUnitsOfDecimal(text, minorUnitDigits);
  return {
    version: 1,
    company: fields.company,
    achievements: fields.achievements,
    system: systemOf(fields.system, amount),
    performance: {
      ...fields.performance,
      source: sourceOf(fields.performance.source),
    },
    financials: {
      tariffPerKwh:
        fields.financials.tariffPerKwh === null ? null : amount(fields.financials.tariffPerKwh),
      tariffRise: percentToBasisPoints(fields.financials.tariffRisePercent),
      horizonYears: fields.financials.horizonYears,
    },
    timeline: fields.timeline,
    payment: {
      templateId: fields.payment.templateId,
      tranches: fields.payment.tranches.map((tranche) => ({
        label: tranche.label,
        share: percentToBasisPoints(tranche.percent),
        dueOnStage: tranche.dueOnStage,
      })),
    },
    components: fields.components.map(componentOf),
    terms: fields.terms,
    bank: fields.bank,
  };
}

type SourceWire = ProposalFieldSetWire['performance']['source'];

/** The energy source as domain names it: a record always names at least one database (`F8-08`). */
export function sourceOf(source: SourceWire): ProposalFieldSet['performance']['source'] {
  if (source === null) return null;
  if (source.kind === 'estimate') return { kind: 'estimate' };
  const [first, ...rest] = source.databases;
  return first === undefined ? null : { kind: 'record', databases: [first, ...rest] };
}
