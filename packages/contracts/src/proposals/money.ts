import { type Freshness, MONTHS_PER_YEAR } from '@heliogrid/domain';
import { z } from 'zod';
import {
  amountSchema,
  currencyCodeSchema,
  extensibleEnum,
  nonNegativeAmountSchema,
  percentSchema,
  provenanceStandingSchema,
  provenanceTierSchema,
} from '../common';
import { projectChainStageSchema } from '../document-templates';
import { energySourceSchema } from './field-set';
import { areaGrainSchema, incentiveReceiverSchema } from './vocabulary';

/*
 * The proposal's computed value set on the wire (`M06-34`, `M06-35`, `M06-41`, `F5-38`): what the
 * server worked out once, as the builder, the document, the customer's link and Mark won all print
 * it. A device renders these figures; it never recomputes one (`F4-04`).
 */

/** Whether a computed figure is still current (`F8-13`), as domain's `Freshness` names its states. */
const FRESHNESS_KINDS = [
  'current',
  'stale',
  'recomputing',
  'unchecked',
] as const satisfies readonly Freshness['kind'][];

/**
 * A money figure with everything that renders beside it (`F8-01`, `F8-12`): its tier, its standing
 * and whether it is still current. `freshness` is `null` for a version's frozen record.
 */
export const moneyFigureSchema = z.object({
  amount: amountSchema,
  tier: provenanceTierSchema,
  standing: provenanceStandingSchema.nullable(),
  freshness: extensibleEnum(FRESHNESS_KINDS).nullable(),
});
export type MoneyFigure = z.infer<typeof moneyFigureSchema>;

/** What a projection rests on (`F8-23`): only what was assumed is present. */
export const projectionAssumptionsSchema = z.object({
  horizonYears: z.number().positive(),
  escalationPercent: percentSchema.optional(),
  interestPercent: percentSchema.optional(),
  marginPercent: percentSchema.optional(),
  incentive: nonNegativeAmountSchema.optional(),
});
export type ProjectionAssumptionsWire = z.infer<typeof projectionAssumptionsSchema>;

/** One line of the payable equation as the card prints it (`M06-35`); the words are the server's. */
const equationLineSchema = z.object({
  key: z.string(),
  label: z.string(),
  /** `null` while the line has not resolved — never read as zero. */
  amount: nonNegativeAmountSchema.nullable(),
  kind: z.enum(['add', 'deduct']),
});

/** One part of the payment plan with its amount (`splitSchedule`): the last part takes the remainder. */
export const proposalTrancheSchema = z.object({
  label: z.string(),
  percent: percentSchema,
  dueOnStage: projectChainStageSchema,
  amount: nonNegativeAmountSchema,
});
export type ProposalTranche = z.infer<typeof proposalTrancheSchema>;

const moneyShape = {
  currencyCode: currencyCodeSchema,
  equation: z.array(equationLineSchema),
  /** The scheme's components for this place of supply; empty for a company with no tax registration. */
  taxes: z.array(z.object({ code: z.string(), amount: nonNegativeAmountSchema })),
  /** What the customer pays before tax, after the discount — below zero while the discount is past the price. */
  preTax: amountSchema,
  discount: nonNegativeAmountSchema,
  /** Worked out on what the customer pays: zero, never below, once a discount is past the price (`M06-36`). */
  taxAmount: nonNegativeAmountSchema,
  /** What the customer pays the company — negative is stated, never hidden (`M06-35`). */
  payable: moneyFigureSchema,
  payableAtOrBelowZero: z.boolean(),
  /** Whether the market offers this deal an incentive at all — where step 3 shows its switch. */
  incentiveOffered: z.boolean(),
  incentive: z
    .object({ scheme: z.string(), figure: moneyFigureSchema, paidTo: incentiveReceiverSchema })
    .nullable(),
  /** What the system costs the customer once the incentive reaches them. */
  netCost: moneyFigureSchema,
  /** The payable for each kW — a check on a typed price, never printed (`T-M06-005`). */
  perKw: moneyFigureSchema.nullable(),
  /** The payment plan's amounts; `null` until its shares add up and the payable is above zero. */
  tranches: z.array(proposalTrancheSchema).nullable(),
  /**
   * The margin on the pre-tax amount (`M06-37`): present only for a reader who may see cost and
   * only once our cost is typed. `belowCost` says the price loses money.
   */
  margin: z
    .object({
      amount: amountSchema,
      sharePercent: z.string().nullable(),
      belowCost: z.boolean(),
    })
    .nullable()
    .optional(),
};

export interface ProposalMoneySchema extends z.ZodObject<typeof moneyShape> {}
export const proposalMoneySchema: ProposalMoneySchema = z.object(moneyShape);
export type ProposalMoneyWire = z.infer<typeof proposalMoneySchema>;

/** The system's generation as a document states it, with the source that fed it (`F8-08`). */
export const proposalGenerationSchema = z.object({
  monthlyKwh: z.array(z.number().nonnegative()).length(MONTHS_PER_YEAR),
  yearlyKwh: z.number().nonnegative(),
  /** January is 0. */
  bestMonth: z
    .number()
    .int()
    .min(0)
    .max(MONTHS_PER_YEAR - 1),
  source: energySourceSchema.nullable(),
  grain: areaGrainSchema.nullable(),
  tier: provenanceTierSchema,
  /** The person's figures were typed at another size (`T-M06-033`): the step offers Reset. */
  capacityChangedSinceEdit: z.boolean(),
});
export type ProposalGeneration = z.infer<typeof proposalGenerationSchema>;

/** What the system saves (`M06-11`): a projection, travelling with what it assumes (`F8-23`). */
export const proposalSavingsSchema = z.object({
  yearly: moneyFigureSchema,
  monthly: moneyFigureSchema,
  lifetime: moneyFigureSchema,
  /** The bill left after an average month's saving; `null` where the bill is not known. */
  billWithSolar: nonNegativeAmountSchema.nullable(),
  /** The saving to date at the end of each year of the horizon — the curve the net cost crosses. */
  cumulative: z.array(nonNegativeAmountSchema),
  paybackYears: z.number().nonnegative().nullable(),
  assumptions: projectionAssumptionsSchema,
});
export type ProposalSavingsWire = z.infer<typeof proposalSavingsSchema>;

/** The EMI example (`M06-40`): a projection of a typed price, never a loan offer. */
export const proposalEmiSchema = z.object({
  monthly: moneyFigureSchema,
  months: z.number().int().positive(),
  assumptions: projectionAssumptionsSchema,
});
export type ProposalEmiWire = z.infer<typeof proposalEmiSchema>;
