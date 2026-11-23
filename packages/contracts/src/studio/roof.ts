import {
  edgesCross,
  GROUND_REACH_M,
  LENGTHS_MEASURED,
  MATERIAL_NAME_MAX,
  OVERHANG_MAX_M,
  PARAPET_BUILDS,
  PARAPET_HEIGHT_MAX_M,
  PARAPET_HEIGHT_MIN_M,
  PICTURE_CHOICES,
  PROVENANCE_TIERS,
  ROOF_CORNERS_MAX,
  ROOF_CORNERS_MIN,
  ROOF_EDGE_TRUSTS,
  ROOF_HEIGHT_MAX_M,
  ROOF_HEIGHT_MIN_M,
  ROOF_TEETH_MAX,
  SETBACK_MAX_M,
  SLOPE_MAX_DEG,
  VALUE_SETTERS,
  WALL_THICKNESS_MAX_M,
  WALL_THICKNESS_MIN_M,
} from '@heliogrid/domain';
import { z } from 'zod';
import { uuidSchema } from '../common';

/**
 * One roof of a design on the wire (domain's `Roof`): its outline, and what part e stores on it —
 * what it is, what it is made of, its shape, parapet and setback, and what each side holds of its
 * own. Every reader takes part e's fields one release before any studio writes them.
 */

/** Metres east or north of the pin: a real number, within the site's reach. */
const groundMetreSchema = z.number().finite().min(-GROUND_REACH_M).max(GROUND_REACH_M);
export const groundPointSchema = z
  .object({ east: groundMetreSchema, north: groundMetreSchema })
  .strict();

/**
 * Where a value came from (domain's `ValueSource`): who set it, and its tier where that is not the
 * setter's usual one. No studio writes a tier yet; every reader takes one first.
 */
const valueSource = {
  setBy: z.enum(VALUE_SETTERS),
  tier: z.enum(PROVENANCE_TIERS).optional(),
};
const setMetres = (min: number, max: number) =>
  z.object({ metres: z.number().min(min).max(max), ...valueSource }).strict();
const setDegrees = z
  .object({ degrees: z.number().min(0).max(SLOPE_MAX_DEG), ...valueSource })
  .strict();

const roofHeightSchema = setMetres(ROOF_HEIGHT_MIN_M, ROOF_HEIGHT_MAX_M);

/**
 * A name of a set that grows — a roof's kind, its material, its shape, a side's end: a short word a
 * later studio may add. It is stored and sent back as it came, and domain reads one it does not
 * know as the set's plain member (`roofKindOf`, `roofMaterialOf`).
 */
const storedName = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/);

const parapetHeight = z.number().min(PARAPET_HEIGHT_MIN_M).max(PARAPET_HEIGHT_MAX_M);
const setbackSchema = setMetres(0, SETBACK_MAX_M);
const overhangSchema = setMetres(0, OVERHANG_MAX_M);

/** What one side of a roof holds of its own (domain's `RoofSide`); `{}` follows the roof. */
const roofSideSchema = z
  .object({
    parapet: z.boolean().optional(),
    parapetM: parapetHeight.optional(),
    parapetBuild: z.enum(PARAPET_BUILDS).optional(),
    setbackM: z.number().min(0).max(SETBACK_MAX_M).optional(),
    slopeDeg: z.number().min(0).max(SLOPE_MAX_DEG).optional(),
    eaveM: z.number().min(ROOF_HEIGHT_MIN_M).max(ROOF_HEIGHT_MAX_M).optional(),
    end: storedName.optional(),
    overhangM: z.number().min(0).max(OVERHANG_MAX_M).optional(),
    tier: z.enum(PROVENANCE_TIERS).optional(),
    low: z.enum(VALUE_SETTERS).optional(),
    glass: z.enum(VALUE_SETTERS).optional(),
    stairsAt: z
      .number()
      .min(0)
      .max(2 * GROUND_REACH_M)
      .optional(),
    stairsBy: z.enum(VALUE_SETTERS).optional(),
  })
  .strict();

const roofShapeSchema = z
  .object({
    is: storedName,
    setBy: z.enum(VALUE_SETTERS),
    turned: z.boolean().optional(),
    teeth: z
      .object({ count: z.number().int().min(1).max(ROOF_TEETH_MAX), ...valueSource })
      .strict()
      .optional(),
    upperSlope: setDegrees.optional(),
    breakIn: setMetres(0, GROUND_REACH_M).optional(),
    raisedHeight: setMetres(0, ROOF_HEIGHT_MAX_M).optional(),
    raisedWidth: setMetres(0, GROUND_REACH_M).optional(),
    valleyAt: z
      .object({ share: z.number().min(0).max(1), ...valueSource })
      .strict()
      .optional(),
  })
  .strict();

const roofMaterialSchema = z
  .object({
    type: storedName,
    name: z.string().trim().min(1).max(MATERIAL_NAME_MAX).optional(),
    fixedLike: storedName.optional(),
    setBy: z.enum(VALUE_SETTERS),
    confirmed: z.boolean(),
  })
  .strict();

const roofParapetSchema = z
  .object({
    allRound: z.boolean(),
    metres: parapetHeight,
    ...valueSource,
    build: z.enum(PARAPET_BUILDS).optional(),
    thickness: setMetres(WALL_THICKNESS_MIN_M, WALL_THICKNESS_MAX_M).optional(),
    lengthsMeasured: z.enum(LENGTHS_MEASURED).optional(),
  })
  .strict();

/**
 * One roof's outline (domain's `Roof`): its edges never cross, and each corner starts one edge.
 * `height` came after the first roofs: a roof sent or stored without it stands at the market's
 * storey height, set by the system.
 */
export const roofSchema = z
  .object({
    id: uuidSchema,
    corners: z.array(groundPointSchema).min(ROOF_CORNERS_MIN).max(ROOF_CORNERS_MAX),
    edges: z.array(z.enum(ROOF_EDGE_TRUSTS)).min(ROOF_CORNERS_MIN).max(ROOF_CORNERS_MAX),
    tracedOn: z.enum(PICTURE_CHOICES),
    height: roofHeightSchema.nullable().default(null),
    // Part e's fields: every reader takes them one release before any studio writes them, and a
    // roof stored before them carries none (`CLAUDE.md` §8, expand then contract).
    kind: z
      .object({ is: storedName, setBy: z.enum(VALUE_SETTERS) })
      .strict()
      .optional(),
    on: uuidSchema.optional(),
    partOf: uuidSchema.optional(),
    material: roofMaterialSchema.optional(),
    shape: roofShapeSchema.optional(),
    slope: setDegrees.optional(),
    overhang: overhangSchema.optional(),
    parapet: roofParapetSchema.optional(),
    setback: setbackSchema.optional(),
    sides: z.array(roofSideSchema).max(ROOF_CORNERS_MAX).optional(),
  })
  .strict()
  .refine((roof) => roof.edges.length === roof.corners.length, {
    message: 'Each corner starts one edge.',
    path: ['edges'],
  })
  .refine((roof) => roof.sides === undefined || roof.sides.length === roof.corners.length, {
    message: 'Each corner starts one side.',
    path: ['sides'],
  })
  // The crossing check walks every pair of edges: it runs only on a corner count the roof may have,
  // so an outsized body is refused by its count, not checked at length.
  .refine((roof) => roof.corners.length <= ROOF_CORNERS_MAX && !edgesCross(roof.corners), {
    message: 'The roof’s edges cross.',
    path: ['corners'],
  });

/** Every corner a design's roofs hold. */
export function cornersIn(roofs: readonly z.infer<typeof roofSchema>[]): number {
  return roofs.reduce((sum, roof) => sum + roof.corners.length, 0);
}

type RoofLink = 'on' | 'partOf';
type RoofWire = z.infer<typeof roofSchema>;

/** Whether following one link up from roof `from` never ends: a ring of roofs. */
function linkRings(
  roofs: readonly RoofWire[],
  byId: ReadonlyMap<string, number>,
  from: number,
  link: RoofLink,
): boolean {
  let at: number | undefined = from;
  // A chain longer than the design has a ring in it.
  for (let steps = 0; at !== undefined && steps <= roofs.length; steps++) {
    const next: string | undefined = roofs[at]?.[link];
    at = next === undefined ? undefined : byId.get(next);
  }
  return at !== undefined;
}

/**
 * The links that do not hold: one naming no other roof of the design, or one of a ring of roofs
 * that each stand on, or are part of, the next.
 */
export function roofLinkFaults(
  roofs: readonly RoofWire[],
): { readonly roof: number; readonly link: RoofLink }[] {
  const byId = new Map(roofs.map((roof, index) => [roof.id, index]));
  const links: readonly RoofLink[] = ['on', 'partOf'];
  return roofs.flatMap((roof, index) =>
    links
      .filter((link) => {
        const to = roof[link];
        if (to === undefined) return false;
        const target = byId.get(to);
        return target === undefined || target === index || linkRings(roofs, byId, target, link);
      })
      .map((link) => ({ roof: index, link })),
  );
}
