import { compassOf } from './compass';
import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { roofFormOf } from './roof-built';
import { roofCrossingsOf } from './roof-crossings';
import { gableEnds } from './roof-forms';
import { belongsTo, roofKindOf, roofSidesOf, standsOn } from './roof-kind';
import { type RoofFacts, roofHasWalls, roofOwnHeightM, roofShapeNow } from './roof-levels';
import type { RoofRow } from './roof-list';
import type { RoofShape } from './roof-material';
import { roofNameOf } from './roof-names';
import { type NumberAt, PARAPET_CHECK_ABOVE_M, type RoofNumber } from './roof-numbers';
import { parapetNow } from './roof-open-edges';
import type { RoofKind } from './roof-parts';
import {
  floorAt,
  floorTicks,
  type RoofSheetRows,
  type SideRole,
  type SideSheetRows,
  type SideWallWhy,
  type SlopeWay,
} from './roof-sheet-rows';
import { formPicksOf, glassSideOf, lowSideOf, sideBearing } from './roof-slope-way';
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
const ONE_WAY: readonly RoofShape[] = ['shed', 'monitor', 'curved', 'butterfly'];
/** The shapes whose ends are a gable end or a hip. */
const ENDED: readonly RoofShape[] = ['gable', 'hip'];

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

const nameOf = (document: StudioDocument, index: number) =>
  roofNameOf(document, index) ?? { kind: 'roof' as const, number: index + 1 };

/** The ways a sloped roof's faces look, the biggest face first, each way once. */
function wayOf(built: NonNullable<RoofsWorked['built'][number]>): SlopeWay {
  const faces = built.faces
    .filter((face) => !face.upper)
    .slice()
    .sort((a, b) => b.areaM2 - a.areaM2);
  const ways = [...new Set(faces.map((face) => compassOf(face.downDeg)))];
  const first = faces[0];
  const way = ways[0];
  if (ways.length === 1 && first !== undefined && way !== undefined) {
    return { kind: 'down', way, bearing: first.downDeg };
  }
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
    shape: hole ? null : { is: shape, byPerson: roof.shape?.setBy === 'person' },
    height: heightOf(document, roof, built !== null, facts, slide),
    slope,
    extras: extras.filter((each) => each !== null),
    overhang: built === null ? null : numberOf(at, 'overhang'),
    parapet,
    setback: hole ? null : numberOf(at, 'setback'),
    details,
    crossings,
    waits:
      crossings.length > 0 ||
      [materialWaits, kind?.waits, slope?.waits, parapet?.waits].some((each) => each === true),
  };
}

/** What a side is to its roof's shape, where the shape gives its sides a role. */
function roleOf(
  document: StudioDocument,
  index: number,
  side: number,
  facts: RoofFacts,
  latitude: number,
): SideRole | null {
  const roof = document.roofs[index] as Roof;
  const shape = roofShapeNow(roof, facts);
  if (ONE_WAY.includes(shape)) {
    return { kind: 'low', is: lowSideOf(document, index, facts, latitude).side === side };
  }
  if (shape === 'sawtooth') {
    const stored = roofSidesOf(roof).findIndex((each) => each.glass !== undefined);
    const glass = stored >= 0 ? stored : glassSideOf(roof.corners, latitude).side;
    return { kind: 'glass', is: glass === side };
  }
  if (!ENDED.includes(shape)) return null;
  const turned = roofFormOf(roof, facts, formPicksOf(document, index, facts, latitude)).turned;
  if (!gableEnds(roof.corners, turned === true).includes(side)) return null;
  const own = roofSidesOf(roof)[side]?.end;
  // A stored end this build does not know reads as the shape's own.
  const end =
    own === 'gable' ? 'gable' : own === 'hip' ? 'hip' : shape === 'gable' ? 'gable' : 'hip';
  return { kind: 'end', end };
}

/** One side's sheet: which way it looks, its parapet and its setback, and its role in the shape. */
export function sideSheetRowsOf(
  document: StudioDocument,
  index: number,
  side: number,
  facts: RoofFacts,
  worked: RoofsWorked,
  latitude: number,
): SideSheetRows | null {
  const roof = document.roofs[index];
  if (roof === undefined || side < 0 || side >= roof.corners.length) return null;
  const stretches = worked.edges[index]?.[side] ?? [];
  const on = stretches.some((stretch) => stretch.wall);
  const own = roofSidesOf(roof)[side]?.parapet;
  const taken = stretches.find((stretch) => stretch.other !== null);
  const why: SideWallWhy =
    own !== undefined
      ? { kind: 'person' }
      : taken?.other != null && taken.state !== 'open' && taken.state !== 'person'
        ? { kind: taken.state, with: nameOf(document, taken.other) }
        : { kind: 'roof' };
  const parapetHeight = on
    ? roofNumberOf(document, { roof: index, key: 'parapet_height', side }, facts)
    : null;
  const setback = roofNumberOf(document, { roof: index, key: 'setback', side }, facts);
  if (setback === null) return null;
  const role = roofHasWalls(roof) ? roleOf(document, index, side, facts, latitude) : null;
  const low = role?.kind === 'low' && role.is ? lowSideOf(document, index, facts, latitude) : null;
  const bearing = sideBearing(roof.corners, side);
  return {
    roof: index,
    side,
    name: nameOf(document, index),
    faces: compassOf(bearing),
    bearing,
    parapet: { on, why },
    parapetHeight,
    setback,
    role,
    waits:
      (parapetHeight !== null && parapetHeight.value > PARAPET_CHECK_ABOVE_M) ||
      (low?.againstWall ?? null) !== null,
  };
}
