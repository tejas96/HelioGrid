import type { RoofMarketFacts } from '../format/roof-facts';
import type { Roof, StudioDocument } from './document';
import { groundRoofHeightM } from './roof-height';
import { roofKindOf, standsOn } from './roof-kind';
import {
  materialStart,
  ROOF_MATERIAL_START,
  ROOF_SHAPES,
  type RoofMaterial,
  type RoofShape,
  roofMaterialOf,
} from './roof-material';

/**
 * How high each roof stands, and what it is like where nothing is stored (`T-M05-002`, part e).
 * A roof on the ground stands a plinth and a storey up; a stair room and an open shed stand the
 * market's stair-room height above their roof, an upper floor a storey above it; a hole is open
 * down to the floor below. Every such value is the system's, `assumed`, until a person sets it.
 */

/** What the market says of its roofs, with its storey height. */
export interface RoofFacts extends RoofMarketFacts {
  readonly storeyHeightM: number;
}

/** A roof's height above what it stands on, in metres: its own, or its kind's first height. */
export function roofOwnHeightM(document: StudioDocument, roof: Roof, facts: RoofFacts): number {
  if (roof.height !== null) return roof.height.metres;
  const kind = roofKindOf(roof);
  const onRoof = standsOn(document, roof) !== null;
  if (kind === 'stair_room') return facts.stairRoomHeightM;
  if (kind === 'upper_floor') return facts.storeyHeightM;
  if (kind === 'open_shed') return onRoof ? facts.stairRoomHeightM : facts.storeyHeightM;
  if (kind === 'dormer' || kind === 'hole') return 0;
  return groundRoofHeightM({ storeyHeightM: facts.storeyHeightM, roof: facts });
}

/** No chain of roofs standing on roofs is longer: a guard against links stored in a ring. */
const DEEPEST = 64;

/**
 * A roof's floor above the ground, in metres: its own height on top of the roof it stands on, and
 * that roof's on its own. A hole's floor is the floor below the roof it is part of.
 */
export function roofFloorM(document: StudioDocument, index: number, facts: RoofFacts): number {
  let total = 0;
  let at: number | null = index;
  for (let depth = 0; at !== null && depth < DEEPEST; depth++) {
    const roof = document.roofs[at];
    if (roof === undefined) break;
    total += roofOwnHeightM(document, roof, facts);
    at = standsOn(document, roof);
  }
  const roof = document.roofs[index];
  if (roof === undefined || roofKindOf(roof) !== 'hole') return total;
  const part = document.roofs.findIndex((other) => other.id === roof.partOf);
  return part < 0 ? 0 : Math.max(roofFloorM(document, part, facts) - facts.storeyHeightM, 0);
}

/** What a roof is made of: what is stored, read forgivingly, else the first material. */
export function roofMaterialNow(roof: Roof): RoofMaterial {
  return roof.material === undefined ? ROOF_MATERIAL_START : roofMaterialOf(roof.material.type);
}

/** A roof's shape: what is stored where this build knows it, else what its material starts as. */
export function roofShapeNow(roof: Roof, facts: RoofFacts): RoofShape {
  const stored = roof.shape?.is;
  const known = ROOF_SHAPES.find((shape) => shape === stored);
  return known ?? materialStart(roofMaterialNow(roof), facts).shape;
}

/** Whether a roof's top slopes: every shape but flat. */
export function roofSloped(roof: Roof, facts: RoofFacts): boolean {
  return roofShapeNow(roof, facts) !== 'flat';
}

/** Whether a roof has walls of its own down to what it stands on: an open shed stands on posts. */
export function roofHasWalls(roof: Roof): boolean {
  const kind = roofKindOf(roof);
  return kind !== 'open_shed' && kind !== 'hole';
}

/** Two floors this close in height are level, in metres. */
export const LEVEL_M = 0.05;
