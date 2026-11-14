import {
  type GenerateBlock,
  type GenerateWarning,
  REQUIRED_FIELDS,
  SKIP_REASONS,
} from '@heliogrid/domain';
import { z } from 'zod';
import { amountSchema, extensibleEnum, provenanceTierSchema } from '../common';
import { componentCategorySchema, proposalStepSchema, systemTypeSchema } from './vocabulary';

/*
 * The Generate checklist on the wire (`M06-23`, `T-M06-022`): one verdict, the same for Quick mode,
 * a duplicate and the full rail. A block stops Generate; a warning never does; a check whose input
 * is unknown says it was skipped and why. Each finding names its step and the fields to highlight.
 * Flat rows keyed by `check`, so a later check is a new value a reader falls back on, never a break.
 */

const BLOCK_CHECKS = [
  'component_missing',
  'component_count_missing',
  'battery_required',
  'payable_not_positive',
  'tax_rates_undeclared',
  'tranches_not_whole',
  'field_missing',
  'scheme_unmet',
  'tier_unfit',
] as const satisfies readonly GenerateBlock['check'][];

const WARNING_CHECKS = [
  'below_cost',
  'panel_capacity',
  'inverter_band',
  'sanctioned_load',
  'supply_phase',
] as const satisfies readonly GenerateWarning['check'][];

/* A check domain finds and the wire does not name would fail every response that carries it. */
type Unnamed<All extends string, Named extends string> = [Exclude<All, Named>] extends [never]
  ? true
  : Exclude<All, Named>;
const EVERY_CHECK_NAMED: [
  Unnamed<GenerateBlock['check'], (typeof BLOCK_CHECKS)[number]>,
  Unnamed<GenerateWarning['check'], (typeof WARNING_CHECKS)[number]>,
] = [true, true];
void EVERY_CHECK_NAMED;

const located = {
  step: proposalStepSchema,
  /** The fields the step highlights when the finding is opened. */
  fields: z.array(z.string()),
};
const phases = z.union([z.literal(1), z.literal(3)]);

/** What stops Generate. Only the facts its `check` names are present. */
export const generateBlockSchema = z.object({
  ...located,
  check: extensibleEnum(BLOCK_CHECKS),
  category: componentCategorySchema.optional(),
  brand: z.string().optional(),
  systemType: systemTypeSchema.optional(),
  /** The payable that is not above zero, as it stands — a negative is shown (`M06-36`). */
  payable: amountSchema.optional(),
  /** Two-decimal percents: what the parts add up to, and what is left — negative when over. */
  allocatedPercent: z.string().optional(),
  remainderPercent: z.string().optional(),
  field: extensibleEnum(REQUIRED_FIELDS).optional(),
  scheme: z.string().optional(),
  tier: provenanceTierSchema.optional(),
});
export type GenerateBlockWire = z.infer<typeof generateBlockSchema>;

/** What Generate says and lets pass (`M06-37`, `M06-23`); each states both figures of its check. */
export const generateWarningSchema = z.object({
  ...located,
  check: extensibleEnum(WARNING_CHECKS),
  /** The loss, for a reader who may see cost; `null` reads "below the company's cost". */
  loss: amountSchema.nullable().optional(),
  brand: z.string().optional(),
  count: z.number().optional(),
  wattPeak: z.number().optional(),
  panelKw: z.number().optional(),
  systemKw: z.number().optional(),
  panelBrand: z.string().optional(),
  inverterBrand: z.string().optional(),
  inverterKw: z.number().optional(),
  reading: z.enum(['inverter_too_small', 'inverter_too_big']).optional(),
  sanctionedLoadKw: z.number().optional(),
  inverterPhases: phases.optional(),
  supplyPhases: phases.optional(),
});
export type GenerateWarningWire = z.infer<typeof generateWarningSchema>;

export const skippedCheckSchema = z.object({
  ...located,
  check: extensibleEnum(WARNING_CHECKS),
  reason: extensibleEnum(SKIP_REASONS),
  brand: z.string().nullable(),
});

const generateVerdictObject = z.object({
  blocks: z.array(generateBlockSchema),
  warnings: z.array(generateWarningSchema),
  skipped: z.array(skippedCheckSchema),
  /** No block stands. Warnings never change this. */
  canGenerate: z.boolean(),
});
/** Named, so each route that carries it references the name rather than spelling its whole type. */
export interface GenerateVerdictSchema extends GenerateVerdictSchemaObject {}
type GenerateVerdictSchemaObject = typeof generateVerdictObject;
export const generateVerdictSchema: GenerateVerdictSchema = generateVerdictObject;
export type GenerateVerdictWire = z.infer<typeof generateVerdictSchema>;
