import {
  type DeviceRead,
  METRES_PER_POINT_AT_1_100,
  type PdfPage,
  pdfPageOf,
  pdfPlan,
} from '@heliogrid/data';
import {
  getDocument,
  OPS,
  type PDFDocumentProxy,
  type PDFPageProxy,
} from 'pdfjs-dist/legacy/build/pdf.mjs';
import { laidAsPhoto } from './read-photo';

/**
 * A PDF read on the device (`T-M05-002d`): pdf.js gives each page's paths, words and pictures;
 * `pdfPlan` picks the page with no question (ruling 6). A page drawn in lines is laid as a plan; a
 * picture page is drawn here and laid as a photo at 1:100. Runs in the reader's worker.
 */

/** A picture page is drawn at this many pixels on its long side. */
const PICTURE_PAGE_PX = 4_000;
const MOVE = 0;
const LINE = 1;
const CURVE = 2;
const QUAD = 3;
const CLOSE = 4;
const CURVE_CONTROLS = 4;
const QUAD_CONTROLS = 2;
/** A line is two points at least, four numbers; a closed ring three, six. */
const LINE_NUMBERS = 4;
const RING_NUMBERS = 6;
type Matrix = readonly [number, number, number, number, number, number];
type Line = { points: number[]; closed: boolean };
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

const times = (a: Matrix, b: readonly number[]): Matrix => {
  const [b0 = 1, b1 = 0, b2 = 0, b3 = 1, b4 = 0, b5 = 0] = b;
  return [
    a[0] * b0 + a[2] * b1,
    a[1] * b0 + a[3] * b1,
    a[0] * b2 + a[2] * b3,
    a[1] * b2 + a[3] * b3,
    a[0] * b4 + a[2] * b5 + a[4],
    a[1] * b4 + a[3] * b5 + a[5],
  ];
};

/** One path's lines, every point placed by the matrix; a curve kept as its end. */
function pathLines(data: ArrayLike<number>, ctm: Matrix): Line[] {
  const lines: Line[] = [];
  let points: number[] = [];
  const at = (x: number, y: number) =>
    points.push(ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5]);
  const end = (closed: boolean) => {
    if (points.length >= LINE_NUMBERS) {
      lines.push({ points, closed: closed && points.length >= RING_NUMBERS });
    }
    points = [];
  };
  const skip = { [CURVE]: CURVE_CONTROLS, [QUAD]: QUAD_CONTROLS } as Record<number, number>;
  for (let k = 0; k < data.length; ) {
    const op = data[k++] as number;
    if (op === CLOSE) {
      end(true);
      continue;
    }
    if (op !== MOVE && op !== LINE && op !== CURVE && op !== QUAD) break;
    if (op === MOVE) end(false);
    k += skip[op] ?? 0;
    at(data[k++] as number, data[k++] as number);
  }
  end(false);
  return lines;
}

/**
 * The matrix after a step that moves it — a save, a restore, a transform, a form's start or end —
 * or `null` for a step that does not. A form (CAD exports wrap their drawing in one) carries its own
 * matrix and its own save.
 */
function matrixAfter(fn: number, args: unknown[], ctm: Matrix, stack: Matrix[]): Matrix | null {
  if (fn === OPS.save) {
    stack.push(ctm);
    return ctm;
  }
  if (fn === OPS.paintFormXObjectBegin) {
    stack.push(ctm);
    const matrix = args[0] as ArrayLike<number> | null | undefined;
    return matrix == null ? ctm : times(ctm, Array.from(matrix));
  }
  if (fn === OPS.restore || fn === OPS.paintFormXObjectEnd) return stack.pop() ?? ctm;
  if (fn === OPS.transform) return times(ctm, args as number[]);
  return null;
}

/** A page's drawn paths in page points, y up, and the share of it its largest picture covers. */
async function pageDrawing(page: PDFPageProxy) {
  const ops = await page.getOperatorList();
  const lines: Line[] = [];
  let pictureShare = 0;
  const [, , width = 1, height = 1] = page.view;
  const stack: Matrix[] = [];
  let ctm = IDENTITY;
  ops.fnArray.forEach((fn, i) => {
    const args = ops.argsArray[i] as unknown[];
    const moved = matrixAfter(fn, args, ctm, stack);
    if (moved !== null) ctm = moved;
    else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
      const share = Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2]) / (width * height);
      pictureShare = Math.max(pictureShare, share);
    } else if (fn === OPS.constructPath) {
      const data = (args[1] as ArrayLike<number>[] | undefined)?.[0];
      if (data !== undefined) lines.push(...pathLines(data, ctm));
    }
  });
  return { lines, pictureShare };
}

async function opened(file: Blob): Promise<PDFDocumentProxy | DeviceRead> {
  // pdf.js's own parser, run in this worker: its own worker would be a worker inside a worker.
  await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs');
  try {
    return await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch (error) {
    const locked = error instanceof Error && error.name === 'PasswordException';
    return { kind: 'refused', refusal: locked ? 'password' : 'broken' };
  }
}

/** A picture page drawn whole, at a scale of 1:100 for its first lay. */
async function picturePage(page: PDFPageProxy, pages: number): Promise<DeviceRead> {
  const [, , width = 1, height = 1] = page.view;
  const scale = PICTURE_PAGE_PX / Math.max(width, height);
  const viewport = page.getViewport({ scale });
  const canvas = new OffscreenCanvas(Math.round(viewport.width), Math.round(viewport.height));
  const context = canvas.getContext('2d') as unknown as CanvasRenderingContext2D | null;
  if (context === null) return { kind: 'refused', refusal: 'no_plan' };
  await page.render({ canvas: null, canvasContext: context, viewport }).promise;
  return laidAsPhoto(
    canvas,
    { pages, pickedPage: page.pageNumber },
    METRES_PER_POINT_AT_1_100 / scale,
  );
}

export async function readPdf(file: Blob): Promise<DeviceRead> {
  const document = await opened(file);
  if ('kind' in document) return document;
  const pages: PdfPage[] = [];
  for (let n = 1; n <= document.numPages; n++) {
    const page = await document.getPage(n);
    const { lines, pictureShare } = await pageDrawing(page);
    const items = (await page.getTextContent()).items;
    const text = items.map((item) => ('str' in item ? item.str : '')).join(' ');
    const [, , width = 1, height = 1] = page.view;
    pages.push(pdfPageOf(n, lines, text, pictureShare, Math.hypot(width, height)));
  }
  const plan = pdfPlan(pages);
  if (plan.kind !== 'picture') return plan;
  return picturePage(await document.getPage(plan.page), plan.pages);
}
