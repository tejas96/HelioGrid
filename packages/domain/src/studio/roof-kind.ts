import type { ProvenanceTier } from '../format/qualified';
import type { Roof, StudioDocument } from './document';
import {
  ROOF_KINDS,
  type RoofKind,
  type RoofSide,
  type ValueSetter,
  type ValueSource,
} from './roof-parts';

/**
 * Reading what part e stores on a roof (`T-M05-002`, part e). Every reader here is forgiving, so a
 * design saved by any open studio still opens whole: a kind this build does not know is a building,
 * a link to a roof that is gone means standing on the ground, and a side list that does not match
 * the corners means no side has anything of its own.
 */

const TIER_OF: Record<ValueSetter, ProvenanceTier> = { system: 'assumed', person: 'estimated' };

/** A value's tier: its own where it carries one, else its setter's usual (`T-M05-002`, *Values*). */
export function tierOf(source: ValueSource): ProvenanceTier {
  return source.tier ?? TIER_OF[source.setBy];
}

export function isRoofKind(name: string): name is RoofKind {
  return (ROOF_KINDS as readonly string[]).includes(name);
}

/** What a roof is: its stored kind where this build knows it, else a building. */
export function roofKindOf(roof: Roof): RoofKind {
  const is = roof.kind?.is;
  return is !== undefined && isRoofKind(is) ? is : 'building';
}

/** Each list of roofs' places by id, worked out once: a design's roofs are never changed in place. */
const PLACES = new WeakMap<readonly Roof[], ReadonlyMap<string, number>>();

/** Where the roof with this id sits in the design — the first, where two share it; −1 when none does. */
export function roofPlaceOf(document: StudioDocument, id: string | undefined): number {
  if (id === undefined) return -1;
  let places = PLACES.get(document.roofs);
  if (places === undefined) {
    const found = new Map<string, number>();
    document.roofs.forEach((roof, index) => {
      if (!found.has(roof.id)) found.set(roof.id, index);
    });
    places = found;
    PLACES.set(document.roofs, places);
  }
  return places.get(id) ?? -1;
}

function roofById(document: StudioDocument, id: string | undefined, self: Roof): number | null {
  if (id === undefined || id === self.id) return null;
  const index = roofPlaceOf(document, id);
  return index < 0 ? null : index;
}

/** The roof this one stands on, by its place in the design; `null` on the ground. */
export function standsOn(document: StudioDocument, roof: Roof): number | null {
  return roofById(document, roof.on, roof);
}

/**
 * The roof this one belongs to — it moves, copies and goes with it: the roof it is part of, else
 * the one it stands on; `null` for a roof of its own.
 */
export function belongsTo(document: StudioDocument, roof: Roof): number | null {
  return roofById(document, roof.partOf, roof) ?? standsOn(document, roof);
}

/**
 * Every roof that goes with roof `index`, itself first: what stands on it or is part of it, and
 * what goes with those in turn. A design whose links run in a ring ends where it began.
 */
export function roofWithItsParts(document: StudioDocument, index: number): readonly number[] {
  const found = [index];
  for (let at = 0; at < found.length; at++) {
    const owner = found[at];
    document.roofs.forEach((roof, i) => {
      if (!found.includes(i) && belongsTo(document, roof) === owner) found.push(i);
    });
  }
  return found;
}

const NO_SIDE: RoofSide = {};

/**
 * What each side holds of its own, one entry for each corner. A stored list of another length was
 * written against other corners: it reads as no entry at all, never as entries on the wrong sides.
 */
export function roofSidesOf(roof: Roof): readonly RoofSide[] {
  const { sides, corners } = roof;
  return sides !== undefined && sides.length === corners.length
    ? sides
    : corners.map(() => NO_SIDE);
}
