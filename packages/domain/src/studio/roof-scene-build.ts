import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { roofOverhangM } from './roof-built';
import { facesHeightAt, movedIn } from './roof-cuts';
import type { BuiltFace } from './roof-faces';
import { carvedOutOf, roofKindOf, roofSidesOf, standsOn } from './roof-kind';
import { type RoofFacts, roofFloorM, roofHasWalls, roofOwnHeightM, roofTopsM } from './roof-levels';
import { roofSkinOf } from './roof-look';
import type { EdgeStretch } from './roof-open-edges';
import { type FlatShape, shapeOf, shared, without } from './roof-polygons';
import type { RoofScene, ScenePrism, SceneWall } from './roof-scene';
import { parapetPrisms } from './roof-scene-parapets';
import { type SlopedTop, slopedTops } from './roof-scene-slopes';
import { pointInside } from './roof-shape';
import { type RoofsWorked, roofsWorked } from './roof-worked';

/**
 * The 3D model of a design's roofs (`T-M05-002`, part e), built from what the kernel knows: each
 * roof stands on the top of the roof under it; a hole is open down to the floor below, with its
 * walls; an open shed is a sheet on posts; a sloped roof wears its faces, with a wall under each
 * gable end; parapets stand side by side, split where a side splits.
 */

/** An open shed's sheet and its posts, in metres. */
const SHEET_M = 0.06;
const POST_M = 0.12;
/** A post stands this far in from the shed's corner, so it stands inside a parapet under it. */
const POST_IN_M = 0.3;
/** Heights this close are one, in metres. */
const SAME_M = 1e-3;

interface Standing {
  readonly roof: Roof;
  readonly index: number;
  readonly footM: number;
  readonly topM: number;
}

function prismsOf(shapes: readonly FlatShape[], solid: Omit<ScenePrism, 'outer' | 'holes'>) {
  return shapes.map((shape): ScenePrism => ({ ...solid, outer: shape.outer, holes: shape.holes }));
}

/**
 * A flat roof's walls and top, with its holes and separate parts cut out, and the floor each hole
 * is open down to.
 */
function flatBody(document: StudioDocument, facts: RoofFacts, at: Standing): ScenePrism[] {
  const { roof, index, footM, topM } = at;
  const carved = carvedOutOf(document, roof);
  const holes = carved.filter((part) => roofKindOf(part) === 'hole');
  const whole = [shapeOf(roof.corners)];
  const cut =
    without(
      whole,
      carved.map((part) => shapeOf(part.corners)),
    ) ?? whole;
  const body = prismsOf(cut, { roof: index, part: 'body', footM, topM, top: 'roof' });
  const floors = holes.flatMap((hole) => {
    const floorM = roofFloorM(document, document.roofs.indexOf(hole), facts);
    if (floorM - footM < SAME_M) return [];
    const ground = shared([shapeOf(hole.corners)], whole) ?? [];
    return prismsOf(ground, { roof: index, part: 'floor', footM, topM: floorM, top: 'plain' });
  });
  return [...body, ...floors];
}

/**
 * A sloped roof's walls up to its low edge, inside its overhang, with no top of their own. A side
 * that another roof meets has no overhang: the wall stands at the outline there, against that
 * roof. A roof too small to keep its overhang keeps its walls at its outline.
 */
function slopedWalls(
  at: Standing,
  facts: RoofFacts,
  stretches: readonly (readonly EdgeStretch[])[],
  faces: readonly BuiltFace[],
): { readonly prisms: ScenePrism[]; readonly walls: SceneWall[] } {
  const own = roofOverhangM(at.roof, facts);
  const sides = roofSidesOf(at.roof);
  const overs = at.roof.corners.map((_, side) => {
    const met = (stretches[side] ?? []).some(
      (each) => each.state !== 'open' && each.other !== null,
    );
    return met ? 0 : (sides[side]?.overhangM ?? own);
  });
  const moved = overs.some((over) => over > 0) ? movedIn(at.roof.corners, overs) : [];
  const inside = moved.length > 0 ? moved : [at.roof.corners];
  // A roof whose low edge is at its foot has no wall to stand: a dormer no higher than its roof.
  if (at.topM - at.footM < SAME_M) return { prisms: [], walls: [] };
  const walls = raisedEaveWalls(at, inside, faces);
  const prisms = inside.map(
    (outer): ScenePrism => ({
      roof: at.index,
      part: 'body',
      outer,
      holes: [],
      footM: at.footM,
      topM: at.topM,
      top: 'none',
    }),
  );
  return { prisms, walls };
}

/** Two directions this close to parallel, as the sine of the angle between them, run the same way. */
const PARALLEL = 1e-3;

/** The edge of the walls' ring that stands under a side: parallel to it and nearest its middle. */
function wallLineUnder(
  ring: readonly GroundPoint[],
  from: GroundPoint,
  to: GroundPoint,
): readonly [GroundPoint, GroundPoint] | null {
  const along = Math.hypot(to.east - from.east, to.north - from.north);
  const middle = { east: (from.east + to.east) / 2, north: (from.north + to.north) / 2 };
  let best: readonly [GroundPoint, GroundPoint] | null = null;
  let nearest = Number.POSITIVE_INFINITY;
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length] as GroundPoint;
    const length = Math.hypot(b.east - a.east, b.north - a.north);
    const cross =
      ((to.east - from.east) * (b.north - a.north) - (to.north - from.north) * (b.east - a.east)) /
      (along * length || 1);
    const far = Math.hypot(
      (a.east + b.east) / 2 - middle.east,
      (a.north + b.north) / 2 - middle.north,
    );
    if (Math.abs(cross) < PARALLEL && far < nearest) {
      nearest = far;
      best = [a, b];
    }
  });
  return best;
}

/**
 * The walls under a sloped roof's raised eaves (G010): where a side's eave stands above the roof's
 * low edge, its wall rises from that edge up to the face over it, on the line the walls stand on.
 */
function raisedEaveWalls(
  at: Standing,
  rings: readonly (readonly GroundPoint[])[],
  faces: readonly BuiltFace[],
): SceneWall[] {
  const corners = at.roof.corners;
  return roofSidesOf(at.roof).flatMap((side, i): SceneWall[] => {
    const raised = side.eaveM ?? 0;
    const ring = rings[0];
    if (raised < SAME_M || ring === undefined) return [];
    const line = wallLineUnder(
      ring,
      corners[i] as GroundPoint,
      corners[(i + 1) % corners.length] as GroundPoint,
    );
    if (line === null) return [];
    const [from, to] = line;
    const up = (point: GroundPoint) => at.topM + (facesHeightAt(faces, point) ?? raised);
    return [
      { roof: at.index, kind: 'end', from, to, footM: at.topM, fromTopM: up(from), toTopM: up(to) },
    ];
  });
}

/** A post's square on the plan, round a point. */
function postAt(point: GroundPoint): GroundPoint[] {
  const half = POST_M / 2;
  return [
    { east: point.east - half, north: point.north - half },
    { east: point.east + half, north: point.north - half },
    { east: point.east + half, north: point.north + half },
    { east: point.east - half, north: point.north + half },
  ];
}

/**
 * An open shed's posts: one in from each corner, down to the roof it stands on where the post
 * stands on that roof, else down to the ground.
 */
function posts(document: StudioDocument, at: Standing, underTopM: number): ScenePrism[] {
  const under = standsOn(document, at.roof);
  const below = under === null ? null : (document.roofs[under] ?? null);
  const inside = movedIn(
    at.roof.corners,
    at.roof.corners.map(() => POST_IN_M),
  )[0];
  return (inside ?? at.roof.corners).map((point): ScenePrism => {
    const onRoof = below !== null && pointInside(point, below.corners);
    return {
      roof: at.index,
      part: 'post',
      outer: postAt(point),
      holes: [],
      footM: onRoof ? underTopM : 0,
      topM: at.topM,
      top: 'plain',
    };
  });
}

/** One roof's solids and surfaces. A hole draws nothing of its own but its parapets. */
function roofParts(
  document: StudioDocument,
  facts: RoofFacts,
  worked: RoofsWorked,
  at: Standing,
  /** Its faces and standing walls where it slopes, and how far a dormer's low edge is lifted. */
  top: SlopedTop | null,
): RoofScene {
  const kind = roofKindOf(at.roof);
  const stretches = worked.edges[at.index] ?? [];
  const faces = top === null ? [] : (worked.built[at.index]?.faces ?? []);
  const parapets = parapetPrisms(document, at.index, facts, at.topM, stretches, faces);
  const none = { faces: [], walls: [], levels: [], skins: [] };
  if (kind === 'hole') return { ...none, prisms: parapets };
  const sloped = top !== null;
  const surfaces = { faces: top?.faces ?? [], walls: top?.walls ?? [] };
  const stands = roofHasWalls(at.roof) ? [] : posts(document, at, at.footM);
  if (!roofHasWalls(at.roof)) {
    const sheet: ScenePrism[] = sloped
      ? []
      : [
          {
            roof: at.index,
            part: 'sheet',
            outer: at.roof.corners,
            holes: [],
            footM: at.topM - SHEET_M,
            topM: at.topM,
            top: 'roof',
          },
        ];
    return { ...surfaces, levels: [], skins: [], prisms: [...sheet, ...stands, ...parapets] };
  }
  // A dormer's walls stand from its roof's low edge up to its own, lifted, low edge.
  const dormer = kind === 'dormer' && top !== null;
  const walled = dormer ? { ...at, topM: at.footM + top.liftM } : at;
  if (!sloped)
    return {
      ...surfaces,
      levels: [],
      skins: [],
      prisms: [...flatBody(document, facts, at), ...parapets],
    };
  const body = slopedWalls(walled, facts, stretches, faces);
  const walls = [...surfaces.walls, ...body.walls];
  return {
    faces: surfaces.faces,
    walls,
    levels: [],
    skins: [],
    prisms: [...body.prisms, ...parapets],
  };
}

/** Where each roof stands and where its top is, above the ground. */
function levelsOf(document: StudioDocument, facts: RoofFacts): RoofScene['levels'] {
  const tops = roofTopsM(document, facts);
  return document.roofs.map((roof, index) => {
    const topM = tops[index] ?? 0;
    const hole = roofKindOf(roof) === 'hole';
    return { footM: hole ? topM : topM - roofOwnHeightM(document, roof, facts), topM };
  });
}

/** The whole design as the 3D scene draws it. */
export function roofSceneOf(
  document: StudioDocument,
  facts: RoofFacts,
  worked: RoofsWorked = roofsWorked(document, facts),
): RoofScene {
  const levels = levelsOf(document, facts);
  const tops = slopedTops(document, worked, levels);
  const parts = document.roofs.map((roof, index) => {
    const { footM, topM } = levels[index] as RoofScene['levels'][number];
    const at = { roof, index, footM, topM };
    return roofParts(document, facts, worked, at, tops[index] ?? null);
  });
  return {
    prisms: parts.flatMap((part) => part.prisms),
    faces: parts.flatMap((part) => part.faces),
    walls: parts.flatMap((part) => part.walls),
    levels,
    skins: document.roofs.map((roof) => roofSkinOf(roof, document.flatRoofs)),
  };
}
