import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { movedIn } from './roof-cuts';
import { roofKindOf, standsOn } from './roof-kind';
import { type RoofFacts, roofFloorM, roofHasWalls, roofOwnHeightM, roofTopsM } from './roof-levels';
import { type FlatShape, shapeOf, shared, without } from './roof-polygons';
import type { RoofScene, ScenePrism } from './roof-scene';
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

/** The holes cut in a roof: the roofs of that kind that are part of it. */
function holesIn(document: StudioDocument, roof: Roof): Roof[] {
  return document.roofs.filter((other) => roofKindOf(other) === 'hole' && other.partOf === roof.id);
}

function prismsOf(shapes: readonly FlatShape[], solid: Omit<ScenePrism, 'outer' | 'holes'>) {
  return shapes.map((shape): ScenePrism => ({ ...solid, outer: shape.outer, holes: shape.holes }));
}

/** A flat roof's walls and top, with its holes cut through, and the floor each hole is open down to. */
function flatBody(document: StudioDocument, facts: RoofFacts, at: Standing): ScenePrism[] {
  const { roof, index, footM, topM } = at;
  const holes = holesIn(document, roof);
  const whole = [shapeOf(roof.corners)];
  const cut =
    without(
      whole,
      holes.map((hole) => shapeOf(hole.corners)),
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

/** A sloped roof's walls up to its low edge, inside its overhang, with no top of their own. */
function slopedWalls(at: Standing): ScenePrism[] {
  const over = at.roof.overhang?.metres ?? 0;
  const inside =
    over > 0
      ? movedIn(
          at.roof.corners,
          at.roof.corners.map(() => over),
        )
      : [at.roof.corners];
  // A roof whose low edge is at its foot has no wall to stand: a dormer no higher than its roof.
  if (at.topM - at.footM < SAME_M) return [];
  return inside.map(
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
  const parapets = parapetPrisms(document, at.index, facts, at.topM, stretches);
  const none = { faces: [], walls: [], levels: [] };
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
    return { ...surfaces, levels: [], prisms: [...sheet, ...stands, ...parapets] };
  }
  // A dormer's walls stand from its roof's low edge up to its own, lifted, low edge.
  const dormer = kind === 'dormer' && top !== null;
  const walled = dormer ? { ...at, topM: at.footM + top.liftM } : at;
  const body = sloped ? slopedWalls(walled) : flatBody(document, facts, at);
  return { ...surfaces, levels: [], prisms: [...body, ...parapets] };
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
  };
}
