import {
  MONTHS_PER_YEAR,
  PROPOSAL_LIMITS,
  TIMELINE_PHASE_LIMIT,
  termsFitTheirPages,
} from '@heliogrid/domain';
import { z } from 'zod';
import { catalogCertificationSchema } from '../catalog';
import {
  nonNegativeAmountSchema,
  percentSchema,
  provenanceTierSchema,
  uuidSchema,
} from '../common';
import { richTextValueSchema } from '../document-content';
import { coverPictureSchema, proposalCoverSchema, trancheLineSchema } from '../document-templates';
import {
  areaGrainSchema,
  batteryChemistrySchema,
  componentLineSourceSchema,
  energyDatabaseSchema,
  inverterTypeSchema,
  panelTechnologySchema,
  proposalTypeSchema,
  systemTypeSchema,
} from './vocabulary';

/*
 * The eleven-step field set on the wire (`M06-42`) — domain's `ProposalFieldSet`, step for step,
 * with the wire's two spellings: an amount is a decimal string in the company's currency and a rate
 * a two-decimal percent. A draft's read and its edit carry the same shape; a version carries it
 * frozen. What the lead and the company own is not here (`proposalDealSchema`, `proposalCompanySchema`).
 */

const shortText = (max: number) => z.string().trim().min(1).max(max);

const companyFieldsSchema = z.object({
  proposalType: proposalTypeSchema,
  coverPicture: coverPictureSchema,
});

const maintenanceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({ kind: z.literal('free') }),
  z.object({
    kind: z.literal('years'),
    years: z
      .number()
      .int()
      .min(PROPOSAL_LIMITS.maintenanceYears.min)
      .max(PROPOSAL_LIMITS.maintenanceYears.max),
  }),
]);

/** A discount as it was typed (`M06-34`): pre-tax, a percent or an amount. */
const discountSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('percent'), percent: percentSchema }),
  z.object({ mode: z.literal('amount'), amount: nonNegativeAmountSchema }),
]);

const batteryFieldsSchema = z.object({
  capacityKwh: z.number().min(PROPOSAL_LIMITS.batteryKwh.min).max(PROPOSAL_LIMITS.batteryKwh.max),
  /** Typed including tax, as the system price is; `null` until typed. */
  costInclusive: nonNegativeAmountSchema.nullable(),
  taxPercent: percentSchema,
  chemistry: batteryChemistrySchema,
  chemistryCustom: shortText(60).nullable(),
});

const emiFieldsSchema = z.object({
  ratePercent: percentSchema,
  tenureYears: z.number().positive().max(40),
});

const systemFieldsSchema = z.object({
  /** Any positive capacity is stored; the step's typed entry holds `M06-09`'s range (`T-M06-005`). */
  capacityKw: z.number().positive().nullable(),
  systemType: systemTypeSchema,
  battery: batteryFieldsSchema.nullable(),
  maintenance: maintenanceSchema,
  commissioningIncluded: z.boolean(),
  /** The price as typed, tax included — the authority the tax is derived from (`T-M06-024`). */
  priceInclusive: nonNegativeAmountSchema.nullable(),
  taxPercent: percentSchema,
  discount: discountSchema.nullable(),
  incentiveClaimed: z.boolean(),
  emi: emiFieldsSchema.nullable(),
  /**
   * The company's own cost (`M06-37`): absent on a read for a person who may not see cost, and an
   * edit from such a person leaves what is stored as it stands.
   */
  ourCost: nonNegativeAmountSchema.nullable().optional(),
});

const monthlyFiguresSchema = z.array(z.number().nonnegative()).length(MONTHS_PER_YEAR);

/** Where an energy figure came from (`F8-08`): the source of record with its databases, or the built-in estimate. */
export const energySourceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('record'), databases: z.array(energyDatabaseSchema).min(1) }),
  z.object({ kind: z.literal('estimate') }),
]);

const performanceFieldsSchema = z.object({
  efficiencyPercent: z
    .number()
    .min(PROPOSAL_LIMITS.efficiencyPercent.min)
    .max(PROPOSAL_LIMITS.efficiencyPercent.max),
  /** What the source answered, kWh a month for 1 kWp at zero loss; set by the fill, never typed. */
  yieldPerKwp: monthlyFiguresSchema.nullable(),
  source: energySourceSchema.nullable(),
  grain: areaGrainSchema.nullable(),
  /** The person's own month figures for the whole system; `null` follows the source. */
  editedMonthlyKwh: monthlyFiguresSchema.nullable(),
  editedAtCapacityKw: z.number().positive().nullable(),
});

const financialFieldsSchema = z.object({
  tariffPerKwh: nonNegativeAmountSchema.nullable(),
  tariffRisePercent: percentSchema,
  horizonYears: z.number().int().positive().max(50),
});

export const proposalPhaseSchema = z.object({
  name: shortText(PROPOSAL_LIMITS.phaseName),
  description: shortText(PROPOSAL_LIMITS.phaseDescription),
  /** Working days; `null` where none is stated — the document then prints none. */
  durationDays: z.number().int().positive().max(365).nullable(),
});

const paymentFieldsSchema = z.object({
  /** The company's named plan the rows came from while they still match it; `null` once edited. */
  templateId: uuidSchema.nullable(),
  tranches: z.array(trancheLineSchema),
});

const componentBase = {
  brand: shortText(120),
  /** One line for the customer (`M06-29`). */
  description: shortText(PROPOSAL_LIMITS.componentDescription).nullable(),
  /** Panels and inverters only (`M06-27`). */
  count: z.number().int().positive().nullable(),
  source: componentLineSourceSchema,
  catalogItemId: uuidSchema.nullable(),
  savedPartId: uuidSchema.nullable(),
  tier: provenanceTierSchema,
  certifications: z.array(catalogCertificationSchema),
};
const printText = shortText(120).nullable();

/** One brand in one section of step 8, with what its edit sheet prints (`M06-29`). */
export const componentLineSchema = z.discriminatedUnion('category', [
  z.object({
    ...componentBase,
    category: z.literal('panel'),
    wattPeak: z.number().positive().nullable(),
    technology: panelTechnologySchema.nullable(),
    warranty: printText,
  }),
  z.object({
    ...componentBase,
    category: z.literal('inverter'),
    capacityKw: z.number().positive().nullable(),
    inverterType: inverterTypeSchema.nullable(),
    phases: z.union([z.literal(1), z.literal(3)]).nullable(),
    warranty: printText,
  }),
  z.object({
    ...componentBase,
    category: z.literal('cable'),
    cableType: printText,
    specification: printText,
    warranty: printText,
  }),
  z.object({
    ...componentBase,
    category: z.literal('electrical'),
    includes: printText,
    standard: printText,
  }),
  z.object({
    ...componentBase,
    category: z.literal('structure'),
    warranty: printText,
    weightPerKw: z.number().positive().nullable(),
    standard: printText,
  }),
  z.object({
    ...componentBase,
    category: z.literal('battery'),
    capacityKwh: z.number().positive().nullable(),
    chemistry: batteryChemistrySchema.nullable(),
    chemistryCustom: shortText(60).nullable(),
    warranty: printText,
  }),
]);
export type ComponentLineWire = z.infer<typeof componentLineSchema>;

const bankFieldsSchema = z.object({ includeInProposal: z.boolean() });

const fieldSetShape = {
  company: companyFieldsSchema,
  achievements: proposalCoverSchema,
  system: systemFieldsSchema,
  performance: performanceFieldsSchema,
  financials: financialFieldsSchema,
  timeline: z.array(proposalPhaseSchema).max(TIMELINE_PHASE_LIMIT),
  payment: paymentFieldsSchema,
  /** Every brand of every section; the three-brand limit is the server's refusal (`M06-27`). */
  components: z.array(componentLineSchema).max(60),
  terms: richTextValueSchema,
  bank: bankFieldsSchema,
};

/** Named, so each route that carries the field set references it rather than spelling its type. */
export interface ProposalFieldSetSchema extends z.ZodObject<typeof fieldSetShape> {}
export const proposalFieldSetSchema: ProposalFieldSetSchema = z.object(fieldSetShape);
export type ProposalFieldSetWire = z.infer<typeof proposalFieldSetSchema>;

/**
 * What one commit carries (`M06-25`): the steps it changed, each sent whole — a step is small, and a
 * whole step cannot be half-applied. A step left out is left as stored.
 */
const proposalFieldsEditObject = z
  .object({
    ...fieldSetShape,
    /* An edit that would run the terms past their three pages is refused (`M06-15`); a stored
       version is read as it was frozen, so the cap is the edit's alone. */
    terms: richTextValueSchema.refine(termsFitTheirPages, 'terms past their page limit'),
  })
  .partial()
  .strict();
/** Named, so each route that carries it references the name rather than spelling its whole type. */
export interface ProposalFieldsEditSchema extends ProposalFieldsEditSchemaObject {}
type ProposalFieldsEditSchemaObject = typeof proposalFieldsEditObject;
export const proposalFieldsEditSchema: ProposalFieldsEditSchema = proposalFieldsEditObject;
export type ProposalFieldsEdit = z.infer<typeof proposalFieldsEditSchema>;
