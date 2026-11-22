import { type DxfPair, dxfPairsOfBinary, dxfPairsOfText } from './dxf-pairs';
import type { CadBlock, CadDrawing, CadEntity, CadPoint, CadVertex } from './plan-lines';

/**
 * A DXF read into domain's CAD shapes (`T-M05-002d`), text or binary. It reads what a plan's lines
 * need — lines, polylines, arcs, circles, ellipses and placed blocks — and the drawing's
 * `$INSUNITS`; text, hatches and dimensions draw no plan line and are passed over. The device reads
 * a text DXF with it, our server a binary one.
 */

export interface DxfDrawing {
  readonly drawing: CadDrawing;
  /** The header's `$INSUNITS`, `null` when it names none. */
  readonly insunits: number | null;
}

const HALF_TURN_DEG = 180;
/** A polyline's flags: closed; a 3D mesh and a polyface, which are surfaces, never plan lines. */
const CLOSED = 1;
const MESH = 16;
const POLYFACE = 64;

/**
 * A shape drawn in an entity's own plane, seen from above. A plane whose normal points down (a
 * mirrored block, an arc drawn from below) is the mirror image across the y axis: x turns, and an
 * arc's direction turns with it.
 */
export function cadEntitySeenFromAbove(entity: CadEntity, normalZ: number): CadEntity {
  if (normalZ >= 0) return entity;
  const flip = (point: CadPoint): CadPoint => ({ x: -point.x, y: point.y });
  switch (entity.kind) {
    case 'line':
      return entity;
    case 'polyline':
      return {
        ...entity,
        vertices: entity.vertices.map((vertex) => ({ ...flip(vertex), bulge: -vertex.bulge })),
      };
    case 'arc':
      return {
        ...entity,
        centre: flip(entity.centre),
        startDeg: HALF_TURN_DEG - entity.endDeg,
        endDeg: HALF_TURN_DEG - entity.startDeg,
      };
    case 'circle':
      return { ...entity, centre: flip(entity.centre) };
    case 'ellipse':
      // Its centre and long axis are the world's already; facing down, its short axis turns, so it
      // runs the other way round: its angles turn sign.
      return { ...entity, startRad: -entity.endRad, endRad: -entity.startRad };
    case 'insert':
      return {
        ...entity,
        at: flip(entity.at),
        scale: { x: -entity.scale.x, y: entity.scale.y },
        rotationDeg: -entity.rotationDeg,
      };
  }
}

type Groups = readonly DxfPair[];

const num = (groups: Groups, code: number, fallback = 0): number => {
  const found = groups.find((pair) => pair.code === code);
  return typeof found?.value === 'number' && Number.isFinite(found.value) ? found.value : fallback;
};
const str = (groups: Groups, code: number): string => {
  const found = groups.find((pair) => pair.code === code);
  return found === undefined ? '' : String(found.value);
};
const pointOf = (groups: Groups, x: number): CadPoint => ({
  x: num(groups, x),
  y: num(groups, x + 10),
});

/** A light polyline's vertices: each 10 starts one, and the 20 and 42 after it are its own. */
function lightVertices(groups: Groups): CadVertex[] {
  const vertices: CadVertex[] = [];
  for (const { code, value } of groups) {
    if (code === 10) vertices.push({ x: Number(value), y: 0, bulge: 0 });
    const last = vertices.at(-1);
    if (last === undefined) continue;
    if (code === 20) vertices[vertices.length - 1] = { ...last, y: Number(value) };
    if (code === 42) vertices[vertices.length - 1] = { ...last, bulge: Number(value) };
  }
  return vertices;
}

/** Each entity type a plan line comes from, read from its groups in its own plane. */
const SHAPES: Readonly<
  Record<string, (groups: Groups, vertices: readonly CadVertex[]) => CadEntity | null>
> = {
  LINE: (g) => ({ kind: 'line', from: pointOf(g, 10), to: pointOf(g, 11) }),
  LWPOLYLINE: (g) => ({
    kind: 'polyline',
    vertices: lightVertices(g),
    closed: (num(g, 70) & CLOSED) !== 0,
  }),
  POLYLINE: (g, vertices) =>
    (num(g, 70) & (MESH | POLYFACE)) !== 0
      ? null
      : { kind: 'polyline', vertices, closed: (num(g, 70) & CLOSED) !== 0 },
  ARC: (g) => ({
    kind: 'arc',
    centre: pointOf(g, 10),
    radius: num(g, 40),
    startDeg: num(g, 50),
    endDeg: num(g, 51),
  }),
  CIRCLE: (g) => ({ kind: 'circle', centre: pointOf(g, 10), radius: num(g, 40) }),
  ELLIPSE: (g) => ({
    kind: 'ellipse',
    centre: pointOf(g, 10),
    majorAxis: pointOf(g, 11),
    ratio: num(g, 40, 1),
    startRad: num(g, 41),
    endRad: num(g, 42, 2 * Math.PI),
  }),
  INSERT: (g) => ({
    kind: 'insert',
    block: str(g, 2),
    at: pointOf(g, 10),
    scale: { x: num(g, 41, 1) || 1, y: num(g, 42, 1) || 1 },
    rotationDeg: num(g, 50),
  }),
};

/** One entity in domain's shapes, seen from above; `null` for one that draws no plan line. */
function shapeOf(type: string, groups: Groups, vertices: readonly CadVertex[]): CadEntity | null {
  const shape = SHAPES[type]?.(groups, vertices) ?? null;
  return shape === null ? null : cadEntitySeenFromAbove(shape, num(groups, 230, 1));
}

/** The drawing being read: where each shape goes, and the one polyline still taking vertices. */
class DrawingBeingRead {
  insunits: number | null = null;
  readonly entities: CadEntity[] = [];
  readonly blocks: Record<string, CadBlock> = {};
  private section = '';
  private block: { name: string; base: CadPoint; entities: CadEntity[] } | null = null;
  private polyline: { groups: Groups; vertices: CadVertex[] } | null = null;

  private keep(shape: CadEntity | null): void {
    if (shape !== null) (this.block?.entities ?? this.entities).push(shape);
  }

  /** The header is one run of variables with no 0 between them: each a 9 and its value. */
  private readHeader(groups: Groups): void {
    const at = groups.findIndex((pair) => pair.code === 9 && pair.value === '$INSUNITS');
    const unit = groups[at + 1];
    if (at >= 0 && typeof unit?.value === 'number') this.insunits = unit.value;
  }

  take(type: string, groups: Groups): void {
    if (type === 'SECTION') {
      this.section = str(groups, 2);
      if (this.section === 'HEADER') this.readHeader(groups);
      return;
    }
    if (type === 'ENDSEC') this.section = '';
    if (this.section === 'ENTITIES' || this.section === 'BLOCKS') this.takeEntity(type, groups);
  }

  private takeEntity(type: string, groups: Groups): void {
    switch (type) {
      case 'BLOCK':
        this.block = { name: str(groups, 2), base: pointOf(groups, 10), entities: [] };
        return;
      case 'ENDBLK':
        if (this.block !== null) {
          this.blocks[this.block.name] = { base: this.block.base, entities: this.block.entities };
        }
        this.block = null;
        return;
      case 'POLYLINE':
        this.polyline = { groups, vertices: [] };
        return;
      case 'VERTEX':
        this.polyline?.vertices.push({ ...pointOf(groups, 10), bulge: num(groups, 42) });
        return;
      case 'SEQEND':
        if (this.polyline !== null) {
          this.keep(shapeOf('POLYLINE', this.polyline.groups, this.polyline.vertices));
        }
        this.polyline = null;
        return;
      default:
        this.keep(shapeOf(type, groups, []));
    }
  }
}

/** The drawing a DXF's pairs hold: its model space, its blocks and its unit. */
export function dxfDrawingOf(pairs: readonly DxfPair[]): DxfDrawing {
  const read = new DrawingBeingRead();
  let i = 0;
  while (i < pairs.length) {
    const head = pairs[i] as DxfPair;
    const from = i + 1;
    i = from;
    while (i < pairs.length && (pairs[i] as DxfPair).code !== 0) i += 1;
    if (head.code === 0) read.take(String(head.value), pairs.slice(from, i));
  }
  return { drawing: { entities: read.entities, blocks: read.blocks }, insunits: read.insunits };
}

/** A DXF's drawing from its text, or from a binary DXF's bytes. Throws on a file that is no DXF. */
export function dxfDrawingOfFile(file: string | Uint8Array): DxfDrawing {
  const pairs = typeof file === 'string' ? dxfPairsOfText(file) : dxfPairsOfBinary(file);
  if (!pairs.some((pair) => pair.code === 0 && pair.value === 'SECTION')) {
    throw new Error('no DXF section');
  }
  return dxfDrawingOf(pairs);
}
