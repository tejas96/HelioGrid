import type { ProposalFieldSetWire, ProposalFieldsEdit } from '@heliogrid/contracts';
import {
  type BasisPoints,
  basisPointsToPercent,
  type MinorUnits,
  minorUnitsOfDecimal,
  type ProposalFieldSet,
  percentToBasisPoints,
} from '@heliogrid/domain';
import { minorUnitsToDecimal } from '@heliogrid/domain/server';
import { richTextWire, trancheLineFromWire, trancheLineWire } from '../../settings/settings.public';

/*
 * The eleven-step field set in its two spellings (`M06-42`): domain holds an amount as whole minor
 * units and a rate as whole basis points; the wire holds a decimal string and a two-decimal
 * percent. They meet here and nowhere else in this module.
 */

type SystemWire = ProposalFieldSetWire['system'];
type SystemEdit = NonNullable<ProposalFieldsEdit['system']>;

/** How this company's currency is scaled, and whether the reader may see our cost (`M06-37`). */
export interface FieldSetReader {
  readonly minorUnitDigits: number;
  readonly seesCost: boolean;
}

const amount = (value: MinorUnits | null, digits: number): string | null =>
  value === null ? null : minorUnitsToDecimal(value, digits);
const minor = (value: string | null, digits: number): MinorUnits | null =>
  value === null ? null : minorUnitsOfDecimal(value, digits);
const percent = (rate: BasisPoints): string => basisPointsToPercent(rate);

function systemWire(system: ProposalFieldSet['system'], reader: FieldSetReader): SystemWire {
  const digits = reader.minorUnitDigits;
  const { battery, discount, emi, taxRate, ourCost, priceInclusive, ...plain } = system;
  return {
    ...plain,
    battery:
      battery === null
        ? null
        : {
            capacityKwh: battery.capacityKwh,
            costInclusive: amount(battery.costInclusive, digits),
            taxPercent: percent(battery.taxRate),
            chemistry: battery.chemistry,
            chemistryCustom: battery.chemistryCustom,
          },
    priceInclusive: amount(priceInclusive, digits),
    taxPercent: percent(taxRate),
    discount:
      discount === null
        ? null
        : discount.mode === 'percent'
          ? { mode: 'percent', percent: percent(discount.percent) }
          : { mode: 'amount', amount: minorUnitsToDecimal(discount.amount, digits) },
    emi: emi === null ? null : { ratePercent: percent(emi.rate), tenureYears: emi.tenureYears },
    // Our cost is absent, never null, for a reader who may not see it (`M06-09`).
    ...(reader.seesCost ? { ourCost: amount(ourCost, digits) } : {}),
  };
}

/** The field set as the wire carries it, our cost left out for a reader who may not see cost. */
export function fieldSetWire(
  fields: ProposalFieldSet,
  reader: FieldSetReader,
): ProposalFieldSetWire {
  const digits = reader.minorUnitDigits;
  return {
    company: fields.company,
    achievements: fields.achievements,
    system: systemWire(fields.system, reader),
    performance: {
      ...fields.performance,
      yieldPerKwp: fields.performance.yieldPerKwp && [...fields.performance.yieldPerKwp],
      source:
        fields.performance.source === null
          ? null
          : fields.performance.source.kind === 'estimate'
            ? { kind: 'estimate' }
            : { kind: 'record', databases: [...fields.performance.source.databases] },
      editedMonthlyKwh: fields.performance.editedMonthlyKwh && [
        ...fields.performance.editedMonthlyKwh,
      ],
    },
    financials: {
      tariffPerKwh: amount(fields.financials.tariffPerKwh, digits),
      tariffRisePercent: percent(fields.financials.tariffRise),
      horizonYears: fields.financials.horizonYears,
    },
    timeline: fields.timeline.map((phase) => ({ ...phase })),
    payment: {
      templateId: fields.payment.templateId,
      tranches: fields.payment.tranches.map(trancheLineWire),
    },
    components: fields.components.map((line) => ({
      ...line,
      certifications: line.certifications.map((held) => ({ ...held })),
    })),
    terms: richTextWire(fields.terms),
    bank: fields.bank,
  };
}

function systemFromWire(
  stored: ProposalFieldSet['system'],
  sent: SystemEdit,
  reader: FieldSetReader,
): ProposalFieldSet['system'] {
  const digits = reader.minorUnitDigits;
  const { battery, discount, emi, taxPercent, ourCost, priceInclusive, ...plain } = sent;
  return {
    ...plain,
    battery:
      battery === null
        ? null
        : {
            capacityKwh: battery.capacityKwh,
            costInclusive: minor(battery.costInclusive, digits),
            taxRate: percentToBasisPoints(battery.taxPercent),
            chemistry: battery.chemistry,
            chemistryCustom: battery.chemistryCustom,
          },
    priceInclusive: minor(priceInclusive, digits),
    taxRate: percentToBasisPoints(taxPercent),
    discount:
      discount === null
        ? null
        : discount.mode === 'percent'
          ? { mode: 'percent', percent: percentToBasisPoints(discount.percent) }
          : { mode: 'amount', amount: minorUnitsOfDecimal(discount.amount, digits) },
    emi:
      emi === null
        ? null
        : { rate: percentToBasisPoints(emi.ratePercent), tenureYears: emi.tenureYears },
    // An edit from a person who may not see cost leaves what is stored as it stands (`M06-37`).
    ourCost: reader.seesCost && ourCost !== undefined ? minor(ourCost, digits) : stored.ourCost,
  };
}

/**
 * The stored field set with the steps one commit sent laid over it (`M06-25`): a step sent is
 * taken whole, a step left out stays as stored.
 */
export function fieldSetWithEdit(
  stored: ProposalFieldSet,
  edit: ProposalFieldsEdit,
  reader: FieldSetReader,
): ProposalFieldSet {
  const digits = reader.minorUnitDigits;
  return {
    version: stored.version,
    company: edit.company ?? stored.company,
    achievements: edit.achievements ?? stored.achievements,
    system:
      edit.system === undefined
        ? stored.system
        : systemFromWire(stored.system, edit.system, reader),
    performance:
      edit.performance === undefined
        ? stored.performance
        : {
            ...edit.performance,
            // What the source answered is set by the fill alone, never typed (`T-M06-033`).
            yieldPerKwp: stored.performance.yieldPerKwp,
            source: stored.performance.source,
            grain: stored.performance.grain,
          },
    financials:
      edit.financials === undefined
        ? stored.financials
        : {
            tariffPerKwh: minor(edit.financials.tariffPerKwh, digits),
            tariffRise: percentToBasisPoints(edit.financials.tariffRisePercent),
            horizonYears: edit.financials.horizonYears,
          },
    timeline: edit.timeline ?? stored.timeline,
    payment:
      edit.payment === undefined
        ? stored.payment
        : {
            templateId: edit.payment.templateId,
            tranches: edit.payment.tranches.map(trancheLineFromWire),
          },
    components: edit.components ?? stored.components,
    terms: edit.terms ?? stored.terms,
    bank: edit.bank ?? stored.bank,
  };
}

/** Every amount an edit typed, with its field path — what the minor-unit check walks. */
export function amountsTyped(edit: ProposalFieldsEdit): readonly (readonly [string, string])[] {
  const typed: [string, string | null | undefined][] = [
    ['fields.system.priceInclusive', edit.system?.priceInclusive],
    ['fields.system.ourCost', edit.system?.ourCost],
    ['fields.system.battery.costInclusive', edit.system?.battery?.costInclusive],
    [
      'fields.system.discount.amount',
      edit.system?.discount?.mode === 'amount' ? edit.system.discount.amount : null,
    ],
    ['fields.financials.tariffPerKwh', edit.financials?.tariffPerKwh],
  ];
  return typed.flatMap(([path, value]) =>
    typeof value === 'string' ? [[path, value] as const] : [],
  );
}
