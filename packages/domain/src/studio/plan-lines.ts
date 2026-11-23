import { METRES_PER_PLAN_UNIT, PLAN_UNITS, type PlanUnit } from './own-picture';

/**
 * A CAD plan turned into the lines the studio draws (`T-M05-002d`). Each reader — the DXF reader on
 * the device, the DWG reader on our server — hands over the drawing in these few shapes, and this
 * one function makes the lines, so the two can never draw a plan differently.
 */

export interface CadPoint {
  readonly x: number;
  readonly y: number;
}

/** One vertex of a polyline; `bulge` curves the edge to the next vertex (tan of a quarter of its arc). */
export interface CadVertex extends CadPoint {
  readonly bulge: number;
}

export type CadEntity =
  | { readonly kind: 'line'; readonly from: CadPoint; readonly to: CadPoint }
  | { readonly kind: 'polyline'; readonly vertices: readonly CadVertex[]; readonly closed: boolean }
  /** Counter-clockwise from `startDeg` to `endDeg`. */
  | {
      readonly kind: 'arc';
      readonly centre: CadPoint;
      readonly radius: number;
      readonly startDeg: number;
      readonly endDeg: number;
    }
  | { readonly kind: 'circle'; readonly centre: CadPoint; readonly radius: number }
  /** `majorAxis` runs from the centre to the end of the long axis; angles in radians, counter-clockwise. */
  | {
      readonly kind: 'ellipse';
      readonly centre: CadPoint;
      readonly majorAxis: CadPoint;
      readonly ratio: number;
      readonly startRad: number;
      readonly endRad: number;
    }
  | {
      readonly kind: 'insert';
      readonly block: string;
      readonly at: CadPoint;
      readonly scale: CadPoint;
      readonly rotationDeg: number;
    };

export interface CadBlock {
  readonly base: CadPoint;
  readonly entities: readonly CadEntity[];
}

export interface CadDrawing {
  readonly entities: readonly CadEntity[];
  readonly blocks: Readonly<Record<string, CadBlock>>;
}

/** One drawn line: `[x0, y0, x1, y1, …]` in the plan's units, and whether it closes on itself. */
export interface PlanLine {
  readonly points: readonly number[];
  readonly closed: boolean;
}

export interface PlanLinesDrawn {
  readonly extent: {
    readonly west: number;
    readonly south: number;
    readonly east: number;
    readonly north: number;
  };
  readonly lines: readonly PlanLine[];
}

/** The most lines one page of a plan keeps: past it a plan is cut, never refused. */
export const PLAN_LINES_MAX = 60_000;

/** Every point is kept to a thousandth of the plan's unit: a millimetre in a plan drawn in metres. */
const KEEP = 1_000;
const kept = (value: number): number => Math.round(value * KEEP) / KEEP;

/** A curve is drawn as straight steps of at most this many degrees: a 10 m arc errs by under 4 mm. */
const STEP_DEG = 5;
/** A block inside a block inside … deeper than this is a broken file, never a house. */
const NESTING_MAX = 8;
const RADIANS = Math.PI / 180;

type Transform = (point: CadPoint) => CadPoint;
const IDENTITY: Transform = (point) => point;

function insertTransform(
  insert: Extract<CadEntity, { kind: 'insert' }>,
  base: CadPoint,
): Transform {
  const cos = Math.cos(insert.rotationDeg * RADIANS);
  const sin = Math.sin(insert.rotationDeg * RADIANS);
  return ({ x, y }) => {
    const sx = (x - base.x) * insert.scale.x;
    const sy = (y - base.y) * insert.scale.y;
    return { x: insert.at.x + sx * cos - sy * sin, y: insert.at.y + sx * sin + sy * cos };
  };
}

/** Points along an arc from `start` to `end` radians, counter-clockwise, both ends included. */
function arcPoints(centre: CadPoint, radius: number, start: number, end: number): CadPoint[] {
  // One turn at most, whatever the file says: a sweep of many turns draws the same ring.
  const turn = 2 * Math.PI;
  let sweep = (end - start) % turn;
  if (sweep <= 0) sweep += turn;
  const steps = Math.max(1, Math.ceil(sweep / (STEP_DEG * RADIANS)));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = start + (sweep * i) / steps;
    return { x: centre.x + radius * Math.cos(angle), y: centre.y + radius * Math.sin(angle) };
  });
}

/** The points of an edge from `a` to `b` bent by `bulge`, `a` left out. */
function bulgedEdge(a: CadVertex, b: CadPoint): CadPoint[] {
  if (Math.abs(a.bulge) < 1e-9) return [b];
  const chord = Math.hypot(b.x - a.x, b.y - a.y);
  if (chord === 0) return [b];
  const sweep = 4 * Math.atan(a.bulge);
  const radius = chord / (2 * Math.sin(Math.abs(sweep) / 2));
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  // The centre sits off the chord's middle, to the left of a→b for a counter-clockwise bulge.
  const offset = Math.sqrt(Math.max(0, radius * radius - (chord / 2) ** 2)) * Math.sign(a.bulge);
  const side = Math.abs(sweep) > Math.PI ? -1 : 1;
  const centre = {
    x: mid.x - (side * offset * (b.y - a.y)) / chord,
    y: mid.y + (side * offset * (b.x - a.x)) / chord,
  };
  const start = Math.atan2(a.y - centre.y, a.x - centre.x);
  const steps = Math.max(1, Math.ceil(Math.abs(sweep) / (STEP_DEG * RADIANS)));
  return Array.from({ length: steps }, (_, i) => {
    const angle = start + (sweep * (i + 1)) / steps;
    return { x: centre.x + radius * Math.cos(angle), y: centre.y + radius * Math.sin(angle) };
  }).map((point, i) => (i === steps - 1 ? b : point));
}

function polylinePoints(vertices: readonly CadVertex[], closed: boolean): CadPoint[] {
  const first = vertices[0];
  if (first === undefined) return [];
  const points: CadPoint[] = [first];
  const edges = closed ? vertices.length : vertices.length - 1;
  for (let i = 0; i < edges; i++) {
    const from = vertices[i] as CadVertex;
    const to = vertices[(i + 1) % vertices.length] as CadVertex;
    points.push(...bulgedEdge(from, to));
  }
  // A closed outline repeats no corner: its last point returns to the first by `closed`.
  if (closed && points.length > 1) points.pop();
  return points;
}

function shapeOf(entity: Exclude<CadEntity, { kind: 'insert' }>): PlanLine | null {
  let points: CadPoint[];
  let closed = false;
  switch (entity.kind) {
    case 'line':
      points = [entity.from, entity.to];
      break;
    case 'polyline':
      points = polylinePoints(entity.vertices, entity.closed);
      closed = entity.closed;
      break;
    case 'arc':
      points = arcPoints(
        entity.centre,
        entity.radius,
        entity.startDeg * RADIANS,
        entity.endDeg * RADIANS,
      );
      break;
    case 'circle':
      points = arcPoints(entity.centre, entity.radius, 0, 2 * Math.PI).slice(0, -1);
      closed = true;
      break;
    case 'ellipse': {
      const major = Math.hypot(entity.majorAxis.x, entity.majorAxis.y);
      const tilt = Math.atan2(entity.majorAxis.y, entity.majorAxis.x);
      const round = arcPoints({ x: 0, y: 0 }, 1, entity.startRad, entity.endRad);
      points = round.map(({ x, y }) => {
        const ex = x * major;
        const ey = y * major * entity.ratio;
        return {
          x: entity.centre.x + ex * Math.cos(tilt) - ey * Math.sin(tilt),
          y: entity.centre.y + ex * Math.sin(tilt) + ey * Math.cos(tilt),
        };
      });
      break;
    }
  }
  const finite = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (finite.length < 2) return null;
  return { points: finite.flatMap(({ x, y }) => [x, y]), closed: closed && finite.length >= 3 };
}

/**
 * The plan's lines, every block placed where its insert puts it, and their extent; `null` when the
 * drawing holds no line at all. At most `max` lines: a plan with more is cut, never refused.
 */
export function planLinesOf(drawing: CadDrawing, max: number): PlanLinesDrawn | null {
  const lines: PlanLine[] = [];
  const walk = (entities: readonly CadEntity[], place: Transform, depth: number): void => {
    for (const entity of entities) {
      if (lines.length >= max) return;
      if (entity.kind === 'insert') {
        const placed = blockPlaced(drawing, entity, depth);
        if (placed !== null)
          walk(placed.entities, (point) => place(placed.place(point)), depth + 1);
        continue;
      }
      const line = shapeOf(entity);
      if (line !== null) lines.push(placedLine(line, place));
    }
  };
  walk(drawing.entities, IDENTITY, 0);
  return lines.length === 0 ? null : { extent: extentOf(lines), lines };
}

/** The block an insert places, and where; `null` for a block the drawing lacks or one too deep. */
function blockPlaced(
  drawing: CadDrawing,
  insert: Extract<CadEntity, { kind: 'insert' }>,
  depth: number,
): { readonly entities: readonly CadEntity[]; readonly place: Transform } | null {
  const block = drawing.blocks[insert.block];
  if (block === undefined || depth >= NESTING_MAX) return null;
  return { entities: block.entities, place: insertTransform(insert, block.base) };
}

/** Lines read some other way — a PDF's paths — with their box; `null` for none. At most `max`. */
export function planLinesDrawnOf(lines: readonly PlanLine[], max: number): PlanLinesDrawn | null {
  if (lines.length === 0) return null;
  const kept = lines.slice(0, max);
  return { extent: extentOf(kept), lines: kept };
}

/** A line moved to where its block's inserts put it, every point kept to a thousandth. */
function placedLine(line: PlanLine, place: Transform): PlanLine {
  const placed: number[] = [];
  for (let i = 0; i < line.points.length; i += 2) {
    const at = place({ x: line.points[i] as number, y: line.points[i + 1] as number });
    placed.push(kept(at.x), kept(at.y));
  }
  return { points: placed, closed: line.closed };
}

/** The box round every line; a plan of one point or one straight line still gets room in it. */
function extentOf(lines: readonly PlanLine[]): PlanLinesDrawn['extent'] {
  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;
  for (const { points } of lines) {
    for (let i = 0; i < points.length; i += 2) {
      west = Math.min(west, points[i] as number);
      east = Math.max(east, points[i] as number);
      south = Math.min(south, points[i + 1] as number);
      north = Math.max(north, points[i + 1] as number);
    }
  }
  return {
    west,
    south,
    east: east === west ? west + 1 : east,
    north: north === south ? south + 1 : north,
  };
}

/** The `$INSUNITS` codes of the units a house is drawn in (the DXF reference's table). */
const INSUNITS: Readonly<Record<number, PlanUnit>> = { 1: 'in', 2: 'ft', 4: 'mm', 5: 'cm', 6: 'm' };

/** A DXF's or DWG's `$INSUNITS` code as a unit; `null` for "unitless" or one a house is never in. */
export function planUnitOfInsunits(code: number | null | undefined): PlanUnit | null {
  return code === null || code === undefined ? null : (INSUNITS[code] ?? null);
}

/** A building's plan spans between these many metres on its long side: a hut to a large block. */
const PLAN_SPAN_MIN_M = 3;
const PLAN_SPAN_MAX_M = 150;

/**
 * Our guess at a plan's unit from its size, for a file that names none: the first unit in which
 * its long side is a building's, mm first — a 7,790-wide house is in mm. `null` when no unit makes
 * it one.
 */
export function planUnitGuess(extent: PlanLinesDrawn['extent']): PlanUnit | null {
  const span = Math.max(extent.east - extent.west, extent.north - extent.south);
  return (
    PLAN_UNITS.find((unit) => {
      const metres = span * METRES_PER_PLAN_UNIT[unit];
      return metres >= PLAN_SPAN_MIN_M && metres <= PLAN_SPAN_MAX_M;
    }) ?? null
  );
}
