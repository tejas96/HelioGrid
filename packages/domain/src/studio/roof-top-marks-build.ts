import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { handFacesOf } from './roof-built';
import type { BuiltFace } from './roof-faces';
import { handFacesKept } from './roof-hand-faces';
import { roofKindOf, standsOn } from './roof-kind';
import { type RoofFacts, roofOwnHeightM, roofShapeNow } from './roof-levels';
import { roofNameOf } from './roof-names';
import { type EdgeStretch, parapetNow } from './roof-open-edges';
import { lowSideOf } from './roof-slope-way';
import { sticksOutFarthest } from './roof-sticks-out';
import type { NoWallWhy, RoofTopMark, SideDot, SideStretchMark } from './roof-top-marks';
import type { RoofsWorked } from './roof-worked';

/** The top view's marks for every roof, from what the kernel worked out for the design. */

/** A slope's arrow is this long at most, and no longer than a third of its face across, in metres. */
const ARROW_M = 1.6;
const ARROW_OF_FACE = 3;
const RADIANS = Math.PI / 180;

const along = (from: GroundPoint, to: GroundPoint, share: number): GroundPoint => ({
  east: from.east + (to.east - from.east) * share,
  north: from.north + (to.north - from.north) * share,
});

const HALF = 0.5;
const QUARTER = 0.25;
/** A dot nearer the side's middle than this share of the side would sit on the side's +. */
const PLUS_ROOM = 0.15;

/** A side's dot: at the middle of its longest stretch with a wall, else of its longest stretch. */
function dotOf(from: GroundPoint, to: GroundPoint, stretches: readonly EdgeStretch[]): SideDot {
  const longest = (among: readonly EdgeStretch[]) =>
    among.reduce<EdgeStretch | null>(
      (best, each) => (best === null || each.to - each.from > best.to - best.from ? each : best),
      null,
    );
  const walled = longest(stretches.filter((stretch) => stretch.wall));
  const at = walled ?? longest(stretches) ?? { from: 0, to: 1 };
  const middle = (at.from + at.to) / 2;
  // The side's own middle holds its +, which adds a corner: a dot that would sit on it sits a
  // quarter of the way along its stretch.
  const clear = Math.abs(middle - HALF) >= PLUS_ROOM;
  const share = clear ? middle : at.from + (at.to - at.from) * QUARTER;
  return { at: along(from, to, share), wall: walled !== null };
}

/** A short line down a face through its middle, the way it slopes. */
function slopeOf(face: BuiltFace): { from: GroundPoint; to: GroundPoint } {
  const count = face.corners.length || 1;
  const middle = {
    east: face.corners.reduce((sum, corner) => sum + corner.east, 0) / count,
    north: face.corners.reduce((sum, corner) => sum + corner.north, 0) / count,
  };
  const half = Math.min(ARROW_M, Math.sqrt(face.areaM2) / ARROW_OF_FACE) / 2;
  const down = { east: Math.sin(face.downDeg * RADIANS), north: Math.cos(face.downDeg * RADIANS) };
  return {
    from: { east: middle.east - down.east * half, north: middle.north - down.north * half },
    to: { east: middle.east + down.east * half, north: middle.north + down.north * half },
  };
}

/** The kinds that stand on another roof and say their height on it. */
const SAYS_ABOVE = ['stair_room', 'upper_floor', 'open_shed'];

/** A one-way roof's low side against a taller roof's wall: the middle of that side, and the roof. */
function lowAgainstOf(
  document: StudioDocument,
  facts: RoofFacts,
  roof: Roof,
  index: number,
  latitude: number,
): RoofTopMark['lowAgainst'] {
  if (!ONE_WAY.includes(roofShapeNow(roof, facts))) return null;
  const low = lowSideOf(document, index, facts, latitude);
  if (low.againstWall === null) return null;
  const from = roof.corners[low.side] as GroundPoint;
  const to = roof.corners[(low.side + 1) % roof.corners.length] as GroundPoint;
  const name = roofNameOf(document, low.againstWall) ?? {
    kind: 'roof' as const,
    number: low.againstWall + 1,
  };
  return { at: along(from, to, 1 / 2), roof: name };
}

/** The shapes whose slope runs one way, from a low side. */
const ONE_WAY: readonly string[] = ['shed', 'monitor', 'curved', 'butterfly'];

function markOf(
  document: StudioDocument,
  facts: RoofFacts,
  worked: RoofsWorked,
  roof: Roof,
  index: number,
  latitude: number,
): RoofTopMark {
  const kind = roofKindOf(roof);
  const edges = worked.edges[index] ?? [];
  const ends = (side: number) => ({
    from: roof.corners[side] as GroundPoint,
    to: roof.corners[(side + 1) % roof.corners.length] as GroundPoint,
  });
  const sides = edges.map((stretches, side) => {
    const { from, to } = ends(side);
    return stretches.map(
      (stretch): SideStretchMark => ({
        from: along(from, to, stretch.from),
        to: along(from, to, stretch.to),
        wall: stretch.wall,
      }),
    );
  });
  const taken = edges.flatMap((stretches, side) =>
    stretches.flatMap((stretch): NoWallWhy[] => {
      const { state, other } = stretch;
      if ((state !== 'shared' && state !== 'under') || other === null) return [];
      const { from, to } = ends(side);
      const name = roofNameOf(document, other) ?? { kind: 'roof', number: other + 1 };
      return [{ at: along(from, to, (stretch.from + stretch.to) / 2), why: state, other, name }];
    }),
  );
  const out = sticksOutFarthest(document, index);
  // An Any-shape roof's faces drawn by hand show while they are drawn, each with its arrow, before
  // the roof stands in them; once they cover it they are what the kernel built.
  const kept = roofShapeNow(roof, facts) === 'any' ? handFacesKept(roof) : [];
  const hand = handFacesOf(roof, kept, facts);
  const stands = SAYS_ABOVE.includes(kind) && standsOn(document, roof) !== null;
  return {
    kind,
    name: roofNameOf(document, index) ?? { kind: 'roof', number: index + 1 },
    sides,
    dots: edges.map((stretches, side) => dotOf(ends(side).from, ends(side).to, stretches)),
    aboveM: stands ? roofOwnHeightM(document, roof, facts) : null,
    sticksOutM: out.metres,
    sticksOutAt: out.at,
    faces: hand.map((face) => face.corners.map(({ east, north }) => ({ east, north }))),
    slopes: (hand.length > 0 ? hand : (worked.built[index]?.faces ?? [])).map(slopeOf),
    // A roof with no parapet of its own has none to lose: there is nothing to say why.
    noWall: parapetNow(document, roof, facts).allRound ? (taken[0] ?? null) : null,
    setback: worked.setbacks[index] ?? [],
    lowAgainst: lowAgainstOf(document, facts, roof, index, latitude),
  };
}

export function roofTopMarksOf(
  document: StudioDocument,
  facts: RoofFacts,
  worked: RoofsWorked,
  /** The site's latitude: which way a one-way slope first faces. */
  latitude = 0,
): RoofTopMark[] {
  return document.roofs.map((roof, index) =>
    markOf(document, facts, worked, roof, index, latitude),
  );
}
