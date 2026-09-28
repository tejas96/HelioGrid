import { z } from 'zod';
import {
  BATTERY_CHEMISTRIES,
  type BatteryChemistry,
  type ComponentKind,
  PANEL_TECHNOLOGIES,
  type PanelTechnology,
} from './vocabulary';

/**
 * The spec envelope each kind of catalog item carries, and the gates that refuse a physically
 * impossible one at the write, so it never reaches a picker (MS4-13, MS4-23). Ported from the POC's
 * `panels.ts`, `inverters.ts`, `batteries.ts` and `catalog.test.ts`.
 *
 * An envelope holds specs only. A price is the tenant's dated rate entry, never a spec (MS4-13,
 * MS4-23); a certification is its own row (M01-34); stock state is the item's, not the datasheet's.
 * The envelope carries its own `kind`, so a stored spec is read whole without its row.
 */

export interface PanelSpec {
  readonly kind: 'panel';
  /** Nameplate power at standard test conditions. */
  readonly watt: number;
  readonly technology: PanelTechnology;
  readonly lengthMm: number;
  readonly widthMm: number;
  readonly vocV: number;
  readonly vmpV: number;
  readonly iscA: number;
  readonly impA: number;
  /** %/°C, negative for every real module; string sizing's cold-morning Voc depends on it. */
  readonly tempCoeffVocPct: number;
  /** %/°C. Optional: without it string sizing labels its window estimated, never borrows Voc's. */
  readonly tempCoeffPmaxPct?: number;
  /** Rear output as a share of the front. Absent means the module makes no power from its back. */
  readonly bifacialityPct?: number;
  readonly warrantyYears?: number;
  readonly weightKg?: number;
}

export interface MpptWindow {
  readonly count: number;
  readonly minV: number;
  readonly maxV: number;
  readonly maxCurrentA: number;
  readonly stringsPerMppt: number;
}

export interface InverterSpec {
  readonly kind: 'inverter';
  readonly acKw: number;
  readonly phases: 1 | 3;
  readonly mppt: MpptWindow;
  readonly maxDcV: number;
  readonly efficiencyPct: number;
  readonly warrantyYears?: number;
}

export interface BatterySpec {
  readonly kind: 'battery';
  /** The energy a customer can cycle — never the nameplate, which lead-acid sells at twice this. */
  readonly usableKwh: number;
  readonly nominalV: number;
  readonly chemistry: BatteryChemistry;
  /** Continuous charge and discharge power. */
  readonly powerKw: number;
  readonly cycleLife: number;
  readonly warrantyYears?: number;
  readonly widthMm: number;
  readonly depthMm: number;
  readonly heightMm: number;
  readonly weightKg: number;
}

/**
 * Nameplate power and warranty only: v1 has no MLPE electrical model (M05's recorded non-goal),
 * so nothing reads more. A field added later is optional, or every stored row stops parsing.
 */
export interface MicroInverterSpec {
  readonly kind: 'micro_inverter';
  readonly ratedAcW: number;
  readonly warrantyYears?: number;
}

export interface OptimiserSpec {
  readonly kind: 'optimiser';
  readonly ratedInputW: number;
  readonly warrantyYears?: number;
}

/** One envelope per kind: a kind added to `COMPONENT_KINDS` fails to compile here until it has one. */
interface CatalogSpecs {
  readonly panel: PanelSpec;
  readonly inverter: InverterSpec;
  readonly battery: BatterySpec;
  readonly micro_inverter: MicroInverterSpec;
  readonly optimiser: OptimiserSpec;
}
export type CatalogSpec = CatalogSpecs[ComponentKind];

const positive = z.number().finite().positive();
const negative = z.number().finite().negative();
const count = z.number().int().positive();
const warrantyYears = positive.optional();

// Unknown keys are dropped, never refused: a spec newer code wrote must still read on a machine
// the release has not reached yet.
const PANEL_ENVELOPE = z.object({
  kind: z.literal('panel'),
  watt: positive,
  technology: z.enum(PANEL_TECHNOLOGIES),
  lengthMm: positive,
  widthMm: positive,
  vocV: positive,
  vmpV: positive,
  iscA: positive,
  impA: positive,
  tempCoeffVocPct: negative,
  tempCoeffPmaxPct: negative.optional(),
  bifacialityPct: positive.max(100).optional(),
  warrantyYears,
  weightKg: positive.optional(),
});

const INVERTER_ENVELOPE = z.object({
  kind: z.literal('inverter'),
  acKw: positive,
  phases: z.union([z.literal(1), z.literal(3)]),
  mppt: z.object({
    count,
    minV: positive,
    maxV: positive,
    maxCurrentA: positive,
    stringsPerMppt: count,
  }),
  maxDcV: positive,
  efficiencyPct: positive.lt(100),
  warrantyYears,
});

const BATTERY_ENVELOPE = z.object({
  kind: z.literal('battery'),
  usableKwh: positive,
  nominalV: positive,
  chemistry: z.enum(BATTERY_CHEMISTRIES),
  powerKw: positive,
  cycleLife: count,
  warrantyYears,
  widthMm: positive,
  depthMm: positive,
  heightMm: positive,
  weightKg: positive,
});

const MICRO_INVERTER_ENVELOPE = z.object({
  kind: z.literal('micro_inverter'),
  ratedAcW: positive,
  warrantyYears,
});

const OPTIMISER_ENVELOPE = z.object({
  kind: z.literal('optimiser'),
  ratedInputW: positive,
  warrantyYears,
});

/**
 * A gate between two fields, filed on the one that must be the larger: it `exceeds` the other, or
 * is `atLeast` it, where an equal value passes.
 */
interface FieldOrder {
  readonly field: readonly string[];
  readonly rule: 'exceeds' | 'atLeast';
  readonly than: readonly string[];
  readonly holds: boolean;
}

function fieldOrders(spec: CatalogSpec): readonly FieldOrder[] {
  switch (spec.kind) {
    case 'panel':
      return [
        {
          field: ['lengthMm'],
          rule: 'exceeds',
          than: ['widthMm'],
          holds: spec.lengthMm > spec.widthMm,
        },
        { field: ['vocV'], rule: 'exceeds', than: ['vmpV'], holds: spec.vocV > spec.vmpV },
        { field: ['iscA'], rule: 'exceeds', than: ['impA'], holds: spec.iscA > spec.impA },
      ];
    case 'inverter':
      return [
        {
          field: ['mppt', 'maxV'],
          rule: 'exceeds',
          than: ['mppt', 'minV'],
          holds: spec.mppt.maxV > spec.mppt.minV,
        },
        {
          field: ['maxDcV'],
          rule: 'atLeast',
          than: ['mppt', 'maxV'],
          holds: spec.maxDcV >= spec.mppt.maxV,
        },
      ];
    case 'battery':
    case 'micro_inverter':
    case 'optimiser':
      return [];
  }
}

/**
 * Every kind's envelope as one schema, discriminated by `kind`, so a form, a route and a stored read
 * refuse the same spec. A failed field-order gate carries no message: it carries the field it is
 * compared with, and `i18n` words it.
 */
const CATALOG_SPEC_SCHEMA: z.ZodType<CatalogSpec, z.ZodTypeDef, unknown> = z
  .discriminatedUnion('kind', [
    PANEL_ENVELOPE,
    INVERTER_ENVELOPE,
    BATTERY_ENVELOPE,
    MICRO_INVERTER_ENVELOPE,
    OPTIMISER_ENVELOPE,
  ])
  .superRefine((spec, ctx) => {
    for (const order of fieldOrders(spec)) {
      if (order.holds) continue;
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...order.field],
        params: { [order.rule]: order.than.join('.') },
      });
    }
  });

export type SpecParse =
  | { readonly ok: true; readonly spec: CatalogSpec }
  /** Each field that failed once, as a dotted path (`mppt.maxV`); empty for the envelope itself. */
  | { readonly ok: false; readonly failedFields: readonly string[] };

/** A spec read whole — from a form, a request body or a stored row. */
export function parseCatalogSpec(raw: unknown): SpecParse {
  const parsed = CATALOG_SPEC_SCHEMA.safeParse(raw);
  if (parsed.success) return { ok: true, spec: parsed.data };
  const fields = parsed.error.issues.map((issue) => issue.path.join('.'));
  return { ok: false, failedFields: [...new Set(fields)] };
}
