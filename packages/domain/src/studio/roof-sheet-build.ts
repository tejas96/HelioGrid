import { compassOf } from './compass';
import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { roofCrossingsOf } from './roof-crossings';
import { belongsTo, roofKindOf, roofSidesOf, standsOn } from './roof-kind';
import { type RoofFacts, roofHasWalls, roofOwnHeightM, roofShapeNow } from './roof-levels';
import type { RoofRow } from './roof-list';
import { type RoofShape, shapePickOf } from './roof-material';
import { roofNameOf } from './roof-names';
import { type NumberAt, PARAPET_CHECK_ABOVE_M, type RoofNumber } from './roof-numbers';
import { parapetNow } from './roof-open-edges';
import type { RoofKind } from './roof-parts';
import {
  floorAt,
  floorTicks,
  type RoofSheetRows,
  type SlopeWay,
  type StairsRow,
  type WayAt,
} from './roof-sheet-rows';
import { glassSideOf, lowSideOf, sideBearing } from './roof-slope-way';
import { stairsOf, stairsSidesOf } from './roof-stairs';
import { STICKS_OUT_MIN_M, sticksOutM } from './roof-sticks-out';
import { roofNumberOf } from './roof-values';
import type { RoofsWorked } from './roof-worked';

/**
 * A roof's sheet and a side's sheet from the design and what the kernel worked out of it
 * (`T-M05-002`, part e, board section 6). Each row holds what the sheet shows; a row the roof has
 * no use for is `null`, so the sheet never shows a value that means nothing here.
 */

/** The kinds a roof standing on another, or part of one, can be made into from its sheet. */
const INSIDE_KINDS: readonly RoofKind[] = [
  'stair_room',
  'upper_floor',
  'hole',
  'open_shed',
  'separate_part',
];

/** The shapes whose slope runs one way, from their low side. */
export const ONE_WAY: readonly RoofShape[] = ['shed', 'monitor', 'curved', 'butterfly'];

/** The numbers each shape adds below its slope. */
const EXTRAS: Partial<Record<RoofShape, readonly RoofNumber[]>> = {
  sawtooth: ['teeth'],
  monitor: ['raised_width', 'raised_height'],
  mansard: ['upper_slope', 'break_in'],
  gambrel: ['upper_slope', 'break_in'],
  butterfly: ['valley'],
};

/** The height slider's ends, which the floors' ticks keep within. */
export interface HeightSlide {
  readonly min: number;
  readonly max: number;
}

export const nameOf = (document: StudioDocument, index: number) =>
  roofNameOf(document, index) ?? { kind: 'roof' as const, number: index + 1 };

/** The ways a sloped roof's faces look, the biggest face first, each way once. */
function wayOf(built: NonNullable<RoofsWorked['built'][number]>): SlopeWay {
  const faces = built.faces
    .filter((face) => !face.upper)
    .slice()
    .sort((a, b) => b.areaM2 - a.areaM2);
  // Each way once, at the way its biggest face runs down.
  const ways: WayAt[] = [];
  for (const face of faces) {
    const way = compassOf(face.downDeg);
    const bearing = Math.round(((face.downDeg % 360) + 360) % 360) % 360;
    if (!ways.some((each) => each.way === way)) ways.push({ way, bearing });
  }
  const [only] = ways;
  if (ways.length === 1 && only !== undefined) return { kind: 'down', ...only };
  return { kind: 'faces', ways };
}

function heightOf(
  document: StudioDocument,
  roof: Roof,
  sloped: boolean,
  facts: RoofFacts,
  slide: HeightSlide,
): RoofSheetRows['height'] {
  const holder = standsOn(document, roof);
  if (holder !== null) {
    return { from: { kind: 'above', roof: nameOf(document, holder) }, ticks: [], floor: null };
  }
  const ticks = floorTicks(facts.plinthHeightM, facts.storeyHeightM, slide);
  const floor = floorAt(ticks, roofOwnHeightM(document, roof, facts));
  return { from: { kind: sloped ? 'low_edge' : 'ground' }, ticks, floor };
}

/** What one roof's rows read: the roof, its place, its shape, and the kernel's work on it. */
interface RowFacts {
  readonly document: StudioDocument;
  readonly index: number;
  readonly roof: Roof;
  readonly facts: RoofFacts;
  readonly shape: RoofShape;
  readonly latitude: number;
}

const numberOf = ({ document, index, facts }: RowFacts, key: RoofNumber) =>
  roofNumberOf(document, { roof: index, key } satisfies NumberAt, facts);

/** What it is, for a roof standing on another or part of one; `null` for a roof of its own. */
function kindRowOf({ document, index, roof }: RowFacts): RoofSheetRows['kind'] {
  if (belongsTo(document, roof) === null) return null;
  const kind = roofKindOf(roof);
  const guessed = kind !== 'building' && roof.kind?.setBy !== 'person';
  const sticksOut = sticksOutM(document, index) >= STICKS_OUT_MIN_M;
  const choices = INSIDE_KINDS.includes(kind) ? INSIDE_KINDS : [kind, ...INSIDE_KINDS];
  return { is: kind, choices, waits: guessed || sticksOut };
}

/**
 * The longest ridge edge of a sloped roof's faces — a shed's high edge — where its height arrow
 * stands; `null` where it has none (a pyramid).
 */
function ridgeOf(
  built: NonNullable<RoofsWorked['built'][number]>,
): NonNullable<RoofSheetRows['slope']>['ridge'] {
  let best: { from: GroundPoint; to: GroundPoint } | null = null;
  let longest = 0;
  for (const face of built.faces) {
    for (let i = 0; i < face.edges.length; i += 1) {
      const from = face.corners[i];
      const to = face.corners[(i + 1) % face.corners.length];
      if (face.edges[i] !== 'ridge' || from === undefined || to === undefined) continue;
      const length = Math.hypot(to.east - from.east, to.north - from.north);
      if (length <= longest) continue;
      longest = length;
      best = {
        from: { east: from.east, north: from.north },
        to: { east: to.east, north: to.north },
      };
    }
  }
  return best;
}

/** A sloped roof's slope, the way it runs, its ridge, and a low side against a taller wall. */
function slopeRowOf(
  row: RowFacts,
  built: NonNullable<RoofsWorked['built'][number]>,
): RoofSheetRows['slope'] {
  const { document, index, roof, facts, shape, latitude } = row;
  const number = numberOf(row, 'slope');
  if (number === null) return null;
  const low = ONE_WAY.includes(shape) ? lowSideOf(document, index, facts, latitude) : null;
  const glassSet = roofSidesOf(roof).some((side) => side.glass !== undefined);
  const glass = shape === 'sawtooth' && !glassSet ? glassSideOf(roof.corners, latitude) : null;
  const wall = low?.againstWall ?? null;
  const lowAgainst = wall === null ? null : nameOf(document, wall);
  return {
    number,
    way: wayOf(built),
    ridgeAboveM: built.topM,
    ridge: ridgeOf(built),
    lowAgainst,
    waits: lowAgainst !== null || glass?.toCheck === true,
  };
}

/** The parapet's row and its details; both `null` for a roof with no walls of its own. */
function parapetRowsOf(row: RowFacts): Pick<RoofSheetRows, 'parapet' | 'details'> {
  const { document, roof, facts } = row;
  if (!roofHasWalls(roof)) return { parapet: null, details: null };
  const parapet = parapetNow(document, roof, facts);
  const height = numberOf(row, 'parapet_height');
  const thickness = numberOf(row, 'thickness');
  if (height === null || thickness === null) return { parapet: null, details: null };
  return {
    parapet: {
      allRound: parapet.allRound,
      byPerson: parapet.byPerson,
      height,
      waits: parapet.allRound && height.value > PARAPET_CHECK_ABOVE_M,
    },
    details: { thickness, build: parapet.build, measured: parapet.lengthsMeasured },
  };
}

/** A stair room's Stairs row: its open sides, each by the way it looks, and where the stairs are. */
function stairsRowOf(
  document: StudioDocument,
  index: number,
  facts: RoofFacts,
  worked: RoofsWorked,
): StairsRow {
  const roof = document.roofs[index] as Roof;
  const stairs = stairsOf(document, worked.edges, facts.clearPathM);
  const sides = stairsSidesOf(document, worked.edges, index).map((side) => ({
    side,
    faces: compassOf(sideBearing(roof.corners, side)),
  }));
  const on =
    stairs === null
      ? null
      : stairs.roof === index
        ? stairs.side
        : stairs.outside
          ? 'outside'
          : null;
  return { sides, on, byPerson: stairs?.byPerson ?? false };
}

/** The roof's sheet, row by row. */
export function roofSheetRowsOf(
  document: StudioDocument,
  index: number,
  facts: RoofFacts,
  worked: RoofsWorked,
  row: RoofRow,
  latitude: number,
  slide: HeightSlide,
): RoofSheetRows | null {
  const roof = document.roofs[index];
  if (roof === undefined) return null;
  const shape = roofShapeNow(roof, facts);
  const at: RowFacts = { document, index, roof, facts, shape, latitude };
  const built = worked.built[index] ?? null;
  const hole = roofKindOf(roof) === 'hole';
  const kind = kindRowOf(at);
  const slope = built === null ? null : slopeRowOf(at, built);
  const { parapet, details } = parapetRowsOf(at);
  const extras = built === null ? [] : (EXTRAS[shape] ?? []).map((key) => numberOf(at, key));
  const materialWaits = row.material !== null && !row.material.confirmed;
  const crossings = roofCrossingsOf(document, index, facts);
  return {
    roof: index,
    name: row.name,
    sits: row.sits,
    areaM2: row.areaM2,
    kind,
    material: row.material,
    shape: hole
      ? null
      : { is: shape, byPerson: roof.shape?.setBy === 'person', ...shapePickOf(shape) },
    height: heightOf(document, roof, built !== null, facts, slide),
    slope,
    extras: extras.filter((each) => each !== null),
    overhang: built === null ? null : numberOf(at, 'overhang'),
    parapet,
    setback: hole ? null : numberOf(at, 'setback'),
    details,
    crossings,
    stairs: roofKindOf(roof) === 'stair_room' ? stairsRowOf(document, index, facts, worked) : null,
    waits:
      crossings.length > 0 ||
      [materialWaits, kind?.waits, slope?.waits, parapet?.waits].some((each) => each === true),
  };
}
