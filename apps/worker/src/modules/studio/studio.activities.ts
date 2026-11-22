import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import type { CadPlanRead, CadPlanReadActivities } from '@heliogrid/contracts/workflows';
import {
  type CadDrawing,
  type CadEntity,
  cadEntitySeenFromAbove,
  dxfDrawingOfFile,
  PLAN_LINES_MAX,
  planLinesOf,
  planUnitGuess,
  planUnitOfInsunits,
} from '@heliogrid/domain';
import type { DwgEntity } from '@mlightcad/libredwg-web';

/**
 * The CAD reader (`T-M05-002d`): a DWG read by LibreDWG built for WebAssembly, or a DXF saved in
 * binary read by domain's own DXF reader, turned into the plan's lines by domain's one converter
 * (`planLinesOf`), and PUT to the signed address the api handed out. LibreDWG is GPL: it runs on
 * our server alone and never ships to a device. Its DXF import is not used: it loses block names.
 *
 * A fresh reader per plan: its memory is the plan's, and it is let go with it, so one large file
 * never leaves this process holding its size. Retried by Temporal and safe to retry: the lines go
 * under the picture's one key, where a second PUT replaces the first.
 */

/** A store that has not answered within this is stuck; Temporal retries the read. */
const STORE_TIMEOUT_MS = 60_000;
const HALF_TURN_DEG = 180;
const DEGREES = HALF_TURN_DEG / Math.PI;
/** DWG marks a closed light polyline with bit 512, an old-style polyline with bit 1. */
const LWPOLYLINE_CLOSED = 512;
const POLYLINE_CLOSED = 1;
/** The reader's WebAssembly sits beside its package's code: `dist/…` and `wasm/` share a folder. */
const WASM_DIR = `${join(dirname(require.resolve('@mlightcad/libredwg-web')), '..', 'wasm')}/`;

type Point = { readonly x: number; readonly y: number };
const flat = ({ x, y }: Point) => ({ x, y });

/**
 * One LibreDWG entity in domain's shapes, seen from above; `null` for one that draws no line. An
 * ellipse facing down keeps its world points and turns its angles (`cadEntitySeenFromAbove`).
 */
function cadEntityOf(entity: DwgEntity): CadEntity | null {
  const shape = planeShapeOf(entity);
  const normal = (entity as { extrusionDirection?: { z?: number } }).extrusionDirection;
  // A missing or zero normal is the default one, straight up.
  const normalZ = normal?.z === undefined || normal.z === 0 ? 1 : normal.z;
  return shape === null ? null : cadEntitySeenFromAbove(shape, normalZ);
}

/** One LibreDWG entity in its own plane. */
function planeShapeOf(entity: DwgEntity): CadEntity | null {
  const e = entity as DwgEntity & Record<string, unknown>;
  switch (entity.type) {
    case 'LINE':
      return { kind: 'line', from: flat(e.startPoint as Point), to: flat(e.endPoint as Point) };
    case 'LWPOLYLINE':
    case 'POLYLINE2D': {
      const vertices = (e.vertices as (Point & { bulge?: number })[]).map((vertex) => ({
        x: vertex.x,
        y: vertex.y,
        bulge: vertex.bulge ?? 0,
      }));
      const bit = entity.type === 'LWPOLYLINE' ? LWPOLYLINE_CLOSED : POLYLINE_CLOSED;
      const closed = ((e.flag as number) & bit) !== 0;
      return { kind: 'polyline', vertices, closed };
    }
    case 'ARC':
      return {
        kind: 'arc',
        centre: flat(e.center as Point),
        radius: e.radius as number,
        startDeg: (e.startAngle as number) * DEGREES,
        endDeg: (e.endAngle as number) * DEGREES,
      };
    case 'CIRCLE':
      return { kind: 'circle', centre: flat(e.center as Point), radius: e.radius as number };
    case 'ELLIPSE':
      return {
        kind: 'ellipse',
        centre: flat(e.center as Point),
        majorAxis: flat(e.majorAxisEndPoint as Point),
        ratio: e.axisRatio as number,
        startRad: e.startAngle as number,
        endRad: e.endAngle as number,
      };
    case 'INSERT':
      return {
        kind: 'insert',
        block: e.name as string,
        at: flat(e.insertionPoint as Point),
        scale: { x: (e.xScale as number) || 1, y: (e.yScale as number) || 1 },
        rotationDeg: (e.rotation as number) * DEGREES,
      };
    default:
      return null;
  }
}

const shapesOf = (entities: readonly DwgEntity[]): CadEntity[] =>
  entities.flatMap((entity) => {
    const shape = cadEntityOf(entity);
    return shape === null ? [] : [shape];
  });

/**
 * The plan's drawing and its `$INSUNITS`; `null` when the file cannot be read. LibreDWG answers
 * even for a file it could not read: one with no block at all — every drawing holds its model
 * space — is such a file.
 */
async function drawingOf(
  bytes: Uint8Array,
  contentType: 'image/vnd.dwg' | 'image/vnd.dxf',
): Promise<{ readonly drawing: CadDrawing; readonly insunits: number | null } | null> {
  if (contentType === 'image/vnd.dxf') return dxfDrawingOfFile(bytes);
  // Its ES module, loaded when first needed: the package's CommonJS build cannot start its reader.
  const { Dwg_File_Type, LibreDwg } = await import('@mlightcad/libredwg-web');
  const reader = await LibreDwg.create(WASM_DIR);
  const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const data = reader.dwg_read_data(copy as ArrayBuffer, Dwg_File_Type.DWG);
  if (data === undefined || data === 0) return null;
  try {
    const database = reader.convert(data);
    const records = database.tables.BLOCK_RECORD.entries;
    if (records.length === 0) return null;
    const blocks: Record<string, CadDrawing['blocks'][string]> = {};
    for (const record of records) {
      blocks[record.name] = { base: flat(record.basePoint), entities: shapesOf(record.entities) };
    }
    const insunits = (database.header as { INSUNITS?: number }).INSUNITS ?? null;
    return { drawing: { entities: shapesOf(database.entities), blocks }, insunits };
  } finally {
    reader.dwg_free(data);
  }
}

async function readCadPlan({
  sourceUrl,
  contentType,
  put,
}: Parameters<CadPlanReadActivities['readCadPlan']>[0]): Promise<CadPlanRead> {
  // biome-ignore lint/style/noRestrictedGlobals: the ban is on calling OUR wire, which is packages/data's; this is the object store's own signed address, and no typed client exists for it
  const answer = await fetch(sourceUrl, {
    redirect: 'error',
    signal: AbortSignal.timeout(STORE_TIMEOUT_MS),
  });
  if (!answer.ok) throw new Error(`the store answered ${answer.status} for the plan`);
  const read = await drawingOf(new Uint8Array(await answer.arrayBuffer()), contentType).catch(
    () => null,
  );
  if (read === null) return { kind: 'refused', refusal: 'broken' };
  const drawn = planLinesOf(read.drawing, PLAN_LINES_MAX);
  if (drawn === null) return { kind: 'refused', refusal: 'no_lines' };
  const body = Buffer.from(JSON.stringify({ page: 1, extent: drawn.extent, lines: drawn.lines }));
  // biome-ignore lint/style/noRestrictedGlobals: the ban is on calling OUR wire, which is packages/data's; this is the object store's own signed address, and no typed client exists for it
  const stored = await fetch(put.url, {
    method: 'PUT',
    headers: { ...put.headers },
    body,
    redirect: 'error',
    signal: AbortSignal.timeout(STORE_TIMEOUT_MS),
  });
  if (!stored.ok) throw new Error(`the store refused the plan's lines: ${stored.status}`);
  return {
    kind: 'lines',
    byteSize: body.length,
    checksumSha256: createHash('sha256').update(body).digest('base64'),
    unit: planUnitOfInsunits(read.insunits),
    unitGuess: planUnitGuess(drawn.extent),
  };
}

export const cadPlanActivities: CadPlanReadActivities = { readCadPlan };
