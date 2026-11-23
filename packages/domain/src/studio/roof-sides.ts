import type { Roof } from './document';
import type { GroundPoint } from './ground';
import type { RoofSide } from './roof-parts';
import { between, cornerAfter } from './roof-shape';

/**
 * A roof's side list kept right while its corners change (`T-M05-002`, part e): each side's own
 * settings stay on that side when a corner is added or removed, so a wall a person took off never
 * moves to its neighbour. A list that did not match the corners held nothing a reader would use,
 * and is dropped.
 */

/** The roof with these corners, edges and — where it holds a list that matches — sides. */
function withSides(
  roof: Roof,
  next: Pick<Roof, 'corners' | 'edges'>,
  sidesOf: (sides: readonly RoofSide[]) => readonly RoofSide[],
): Roof {
  const { sides, ...rest } = roof;
  if (sides === undefined) return { ...roof, ...next };
  if (sides.length !== roof.corners.length) return { ...rest, ...next };
  return { ...rest, ...next, sides: sidesOf(sides) };
}

/** A side's settings without the marks only one side carries: the low side, the glass, the stairs. */
function plain(side: RoofSide): RoofSide {
  const { low: _l, glass: _g, stairsAt: _a, stairsBy: _b, ...values } = side;
  return values;
}

/**
 * A corner added on side `edge`, at `at`: the side becomes two, and both keep its settings. The
 * marks one side alone carries stay on the first half; the stairs go with the half they stand on.
 */
export function roofWithCorner(
  roof: Roof,
  edge: number,
  at: GroundPoint,
  next: Pick<Roof, 'corners' | 'edges'>,
): Roof {
  return withSides(roof, next, (sides) => {
    const side = sides[edge] ?? {};
    const firstHalf = between(roof.corners[edge] as GroundPoint, at);
    const { stairsAt, stairsBy, ...first } = side;
    const onSecond = stairsAt !== undefined && stairsAt > firstHalf;
    const halves: RoofSide[] = onSecond
      ? [first, { ...plain(side), stairsAt: stairsAt - firstHalf, stairsBy }]
      : [side, plain(side)];
    return [...sides.slice(0, edge), ...halves, ...sides.slice(edge + 1)];
  });
}

/**
 * Corner `corner` removed: the side before it and the side after it join as one, which keeps the
 * settings of the side before; a mark only the side after carried moves onto the joined side.
 */
export function roofWithoutCorner(
  roof: Roof,
  corner: number,
  next: Pick<Roof, 'corners' | 'edges'>,
): Roof {
  return withSides(roof, next, (sides) => {
    const count = sides.length;
    const before = (corner - 1 + count) % count;
    const kept = sides[before] ?? {};
    const gone = sides[corner] ?? {};
    const lengthBefore = between(
      roof.corners[before] as GroundPoint,
      cornerAfter(roof.corners, before),
    );
    const stairsMove = kept.stairsAt === undefined && gone.stairsAt !== undefined;
    const joined: RoofSide = {
      ...kept,
      ...(kept.low === undefined && gone.low !== undefined ? { low: gone.low } : {}),
      ...(kept.glass === undefined && gone.glass !== undefined ? { glass: gone.glass } : {}),
      ...(stairsMove
        ? { stairsAt: (gone.stairsAt ?? 0) + lengthBefore, stairsBy: gone.stairsBy }
        : {}),
    };
    return sides.map((side, i) => (i === before ? joined : side)).filter((_, i) => i !== corner);
  });
}
