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

function roofById(document: StudioDocument, id: string | undefined, self: Roof): number | null {
  if (id === undefined || id === self.id) return null;
  const index = document.roofs.findIndex((roof) => roof.id === id);
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

/** Whether two roofs are tied: one stands on the other, is part of it, or goes with it. */
export function roofsTied(document: StudioDocument, one: number, other: number): boolean {
  const a = document.roofs[one];
  const b = document.roofs[other];
  if (a === undefined || b === undefined) return false;
  const tiedTo = (roof: Roof, to: number) =>
    standsOn(document, roof) === to || belongsTo(document, roof) === to;
  return tiedTo(a, other) || tiedTo(b, one);
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
