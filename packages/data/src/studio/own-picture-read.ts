import type { DesignPictureFacts } from '@heliogrid/contracts';
import {
  CAD_PLAN_MAX_BYTES,
  type DesignPictureFileRole,
  type DesignPictureKind,
  droneLayOf,
  dxfDrawingOfFile,
  FILE_MAX_BYTES,
  isBinaryDxf,
  type LaidPicture,
  type LatLon,
  type MapGrid,
  METRES_PER_PLAN_UNIT,
  mapSystemOf,
  OWN_PICTURE_FILE_ENDS,
  type OwnPictureRefusal,
  type PdfPageCount,
  type PictureCut,
  PLAN_LINES_MAX,
  type PlanLine,
  type PlanLinesDrawn,
  pdfPagePick,
  photoLayOf,
  placelessLayOf,
  planCentredOnPin,
  planLinesDrawnOf,
  planLinesOf,
  planUnitGuess,
  planUnitOfInsunits,
} from '@heliogrid/domain';

/**
 * Your picture's reading (`T-M05-002d`), the part both platforms share: which reader a file takes,
 * where a picture first lies, how it is cut, and what a DXF or a PDF holds. A platform's reader draws
 * the pixels and encodes the pieces; every decision is made here, over domain's rules.
 */

/** One part a reader made: a JPEG piece with its box, or one page's plan lines. */
export interface DevicePart {
  readonly bytes: Uint8Array;
  /**
   * A piece is a JPEG, or — with see-through edges, a drone map's — a WebP, or a PNG where the
   * device writes no WebP; a page's lines are JSON.
   */
  readonly contentType: 'image/jpeg' | 'image/webp' | 'image/png' | 'application/json';
  readonly page: number;
  readonly role: DesignPictureFileRole;
  readonly box: {
    readonly west: number;
    readonly south: number;
    readonly east: number;
    readonly north: number;
  } | null;
}

/** Where the picture first lies, in the document's terms, before it has a stored id. */
export type FirstLay = Omit<LaidPicture, 'pictureId'>;

/** What the device's reader made of a file. */
export type DeviceRead =
  | {
      readonly kind: 'read';
      readonly pictureKind: DesignPictureKind;
      readonly facts: DesignPictureFacts;
      readonly parts: readonly DevicePart[];
      readonly lay: FirstLay;
    }
  /** A DWG or a binary DXF: our server reads it. */
  | {
      readonly kind: 'server';
      readonly bytes: Uint8Array;
      readonly contentType: 'image/vnd.dwg' | 'image/vnd.dxf';
    }
  | { readonly kind: 'refused'; readonly refusal: OwnPictureRefusal; readonly distanceM?: number };

export type PictureReader = 'photo' | 'drone' | 'pdf' | 'dxf' | 'dwg' | null;

/** The reader a file takes, by the end of its name; `null` for a file that is no picture or plan. */
export function readerOf(name: string): PictureReader {
  const end = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
  const is = (ends: readonly string[]) => ends.includes(end);
  if (is(OWN_PICTURE_FILE_ENDS.photo)) return 'photo';
  if (is(OWN_PICTURE_FILE_ENDS.drone)) return 'drone';
  if (end === 'pdf') return 'pdf';
  if (end === 'dxf') return 'dxf';
  if (is(OWN_PICTURE_FILE_ENDS.cad)) return 'dwg';
  return null;
}

/** Facts a file names nothing of: one page, no scale, no north, no place. */
export const NO_FACTS: DesignPictureFacts = {
  takenOn: null,
  metresPerUnit: null,
  turnDeg: null,
  centre: null,
  unit: null,
  unitGuess: null,
  pages: 1,
  pickedPage: 1,
};

/** A photo, or a PDF's picture page, laid on the pin: its cuts, and our guess at its size. */
export function photoPlan(width: number, height: number, metresPerPixel?: number) {
  const lay = photoLayOf(width, height);
  const first: FirstLay = {
    at: { east: 0, north: 0 },
    turnDeg: 0,
    metresPerUnit: metresPerPixel ?? lay.metresPerPixel,
    scaleFrom: 'guess',
  };
  return { cuts: lay.cuts, lay: first };
}

/** A drone map's file, as its reader finds it. */
export interface DroneFile {
  readonly epsg: number | null;
  /** The map's linear unit is the metre (GeoTIFF key 9001). */
  readonly metric: boolean;
  readonly grid: MapGrid;
}

export type DronePlan =
  | { readonly kind: 'refused'; readonly read: DeviceRead }
  | {
      readonly kind: 'cut';
      readonly cuts: readonly PictureCut[];
      readonly step: number;
      /** Its true sharpness at the step it is read at, its north, and its place when read. */
      readonly facts: Pick<DesignPictureFacts, 'metresPerUnit' | 'turnDeg' | 'centre'>;
      readonly lay: FirstLay;
    };

/**
 * A drone map round the pin: in its true place, north and scale when its system is read; at its
 * own scale on the pin when only its unit is the metre; refused when it is of another place, or is
 * no map we can lay.
 */
export function dronePlan(file: DroneFile, pin: LatLon): DronePlan {
  const system = mapSystemOf(file.epsg);
  const placed = system === null ? null : droneLayOf(system, file.grid, pin);
  if (placed?.kind === 'elsewhere') {
    return {
      kind: 'refused',
      read: { kind: 'refused', refusal: 'elsewhere', distanceM: placed.distanceM },
    };
  }
  if (placed === null && !file.metric) {
    return { kind: 'refused', read: { kind: 'refused', refusal: 'not_a_picture' } };
  }
  const lay = placed ?? placelessLayOf(file.grid);
  // The pieces' boxes are true metres about the pin: the map lies on it, turned to true north.
  const turnDeg = placed?.turnDeg ?? 0;
  return {
    kind: 'cut',
    cuts: lay.cuts,
    step: lay.step,
    facts: {
      metresPerUnit: lay.metresPerPixel * lay.step,
      turnDeg: placed === null ? null : turnDeg,
      centre: placed === null ? null : pin,
    },
    lay: { at: { east: 0, north: 0 }, turnDeg, metresPerUnit: 1, scaleFrom: 'file' },
  };
}

/** One page's lines as the file the studio keeps. */
export function linesPart(page: number, drawn: PlanLinesDrawn): DevicePart {
  const json = JSON.stringify({ page, extent: drawn.extent, lines: drawn.lines });
  const bytes = new TextEncoder().encode(json);
  return { bytes, contentType: 'application/json', page, role: 'lines', box: null };
}

/** A DWG, or a binary DXF, handed to our server whole, up to its own limit. */
export function toServer(
  bytes: Uint8Array,
  contentType: 'image/vnd.dwg' | 'image/vnd.dxf',
): DeviceRead {
  if (bytes.byteLength > CAD_PLAN_MAX_BYTES) return { kind: 'refused', refusal: 'too_large' };
  return { kind: 'server', bytes, contentType };
}

/** A DXF read into lines with its unit, or our guess from its size when it names none. */
export function dxfRead(bytes: Uint8Array): DeviceRead {
  if (bytes.byteLength > CAD_PLAN_MAX_BYTES) return { kind: 'refused', refusal: 'too_large' };
  if (isBinaryDxf(bytes)) return toServer(bytes, 'image/vnd.dxf');
  let drawn: PlanLinesDrawn | null;
  let insunits: number | null;
  try {
    const read = dxfDrawingOfFile(new TextDecoder('utf-8').decode(bytes));
    drawn = planLinesOf(read.drawing, PLAN_LINES_MAX);
    insunits = read.insunits;
  } catch {
    return { kind: 'refused', refusal: 'broken' };
  }
  if (drawn === null) return { kind: 'refused', refusal: 'no_plan' };
  // Its lines are one stored file: past a file's limit it is refused here, saying why.
  const part = linesPart(1, drawn);
  if (part.bytes.byteLength > FILE_MAX_BYTES) return { kind: 'refused', refusal: 'too_many_lines' };
  const unit = planUnitOfInsunits(insunits);
  const unitGuess = unit === null ? planUnitGuess(drawn.extent) : null;
  const metresPerUnit = METRES_PER_PLAN_UNIT[unit ?? unitGuess ?? 'mm'];
  return {
    kind: 'read',
    pictureKind: 'plan',
    facts: { ...NO_FACTS, metresPerUnit: unit === null ? null : metresPerUnit, unit, unitGuess },
    parts: [part],
    lay: {
      at: planCentredOnPin(drawn.extent, metresPerUnit),
      turnDeg: 0,
      metresPerUnit,
      scaleFrom: unit === null ? 'guess' : 'file',
    },
  };
}

/** A PDF point, a 72nd of an inch, as the ground it stands for at 1:100: our first guess. */
export const METRES_PER_POINT_AT_1_100 = (0.0254 / 72) * 100;

/** One page of a PDF as its reader finds it: its lines, if drawn, and what it holds. */
export interface PdfPage {
  readonly count: PdfPageCount;
  readonly drawn: PlanLinesDrawn | null;
}

/** A line longer than this share of the page's diagonal is a wall, not a hatch or a letter. */
const WALL_SHARE = 0.03;
const ROOF_WORDS = /\b(roof|terrace)\b/i;
const PLAN_WORDS = /\bplan\b/i;
const WORD = /\S+/g;

/** What a PDF page holds, for the pick: its lines and walls, its words, its largest picture. */
export function pdfPageOf(
  page: number,
  lines: readonly PlanLine[],
  text: string,
  pictureShare: number,
  diagonal: number,
): PdfPage {
  const drawn = planLinesDrawnOf(lines, PLAN_LINES_MAX);
  const kept = drawn?.lines ?? [];
  const walls = kept.filter(({ points }) => {
    const x0 = points[0] ?? 0;
    const y0 = points[1] ?? 0;
    return (
      Math.hypot((points.at(-2) ?? x0) - x0, (points.at(-1) ?? y0) - y0) > diagonal * WALL_SHARE
    );
  });
  return {
    drawn,
    count: {
      page,
      closedLines: kept.filter((line) => line.closed).length,
      longLines: walls.length,
      words: text.match(WORD)?.length ?? 0,
      pictureShare,
      namesRoof: ROOF_WORDS.test(text),
      namesPlan: PLAN_WORDS.test(text),
    },
  };
}

/**
 * The PDF's page to lay (ruling 6): drawn in lines, as a plan with every drawn page kept for ‹ ›;
 * a picture page, which the platform draws and lays as a photo; or refused, holding no plan.
 */
export function pdfPlan(
  pages: readonly PdfPage[],
): DeviceRead | { readonly kind: 'picture'; readonly page: number; readonly pages: number } {
  const pick = pdfPagePick(pages.map((page) => page.count));
  if (pick === null) return { kind: 'refused', refusal: 'no_plan' };
  if (pick.kind === 'picture') return { kind: 'picture', page: pick.page, pages: pages.length };
  // A page past a file's limit is left out: the others still lie under ‹ ›.
  const parts = pages
    .flatMap(({ count, drawn }) => (drawn === null ? [] : [linesPart(count.page, drawn)]))
    .filter((part) => part.bytes.byteLength <= FILE_MAX_BYTES);
  const picked = pages.find((page) => page.count.page === pick.page)?.drawn ?? null;
  if (picked === null || !parts.some((part) => part.page === pick.page)) {
    return { kind: 'refused', refusal: 'no_plan' };
  }
  return {
    kind: 'read',
    pictureKind: 'plan',
    facts: { ...NO_FACTS, pages: pages.length, pickedPage: pick.page },
    parts,
    lay: {
      at: planCentredOnPin(picked.extent, METRES_PER_POINT_AT_1_100),
      turnDeg: 0,
      metresPerUnit: METRES_PER_POINT_AT_1_100,
      scaleFrom: 'guess',
    },
  };
}
