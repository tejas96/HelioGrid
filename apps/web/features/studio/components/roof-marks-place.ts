import type { GroundPoint, RoofHandles } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import type { ScreenOf } from './StudioRoofs';

/**
 * Moves the roof marks to where the model lands now (`T-M05-002`, part b). Each mark carries its
 * own place on the ground in `data-` attributes; this reads them, asks the camera where they land,
 * and sets their transform — every drawn frame, never through a render.
 */

/** The + on an edge hides when the edge is shorter than this on screen: zoom in to add one there. */
const PLUS_MIN_PX = 110;
/** How far apart the move and the turn handle sit, in CSS pixels. */
const HANDLE_GAP_PX = 44;
/** How far the × and a picked corner's angle stand out from the corner, in CSS pixels. */
const PICKED_OUT_PX = 30;
/** The gap between a length's label and its edge, in CSS pixels. */
const LABEL_GAP_PX = 8;
/** On a phone the tool columns stand beside the roof: a label keeps between them. */
const PHONE_BELOW = theme.layout['bp-desktop'];

type Xy = { x: number; y: number };

/** A place on the ground written into a mark: `east north`. */
export const pointText = (p: GroundPoint) => `${p.east} ${p.north}`;

function readPoint(text: string | undefined): GroundPoint | null {
  if (text === undefined) return null;
  const [east, north] = text.split(' ').map(Number);
  return east === undefined || north === undefined ? null : { east, north };
}

const onTop = (node: HTMLElement | SVGElement) => node.dataset.top === 'true';

/**
 * A point mark, pushed out from `data-away` when it has one: the × of a picked corner one step out,
 * its angle `data-out` steps.
 */
function placePoint(node: HTMLElement, screenOf: ScreenOf): void {
  const at = readPoint(node.dataset.at);
  const seen = at === null ? null : screenOf(at, onTop(node));
  node.hidden = seen === null;
  if (seen === null) return;
  let { x, y } = seen;
  const away = readPoint(node.dataset.away);
  const from = away === null ? null : screenOf(away, onTop(node));
  if (from !== null) {
    const reach = Math.hypot(x - from.x, y - from.y) || 1;
    const out = PICKED_OUT_PX * Number(node.dataset.out ?? 1);
    x += ((x - from.x) / reach) * out;
    y += ((y - from.y) / reach) * out;
  }
  node.style.transform = `translate(${x}px, ${y}px)`;
}

/** An edge mark: the + at its middle, or a length outside it by its own half size. */
/** The free room between the two tool columns, in the layer's pixels. */
interface ToolRoom {
  readonly left: number;
  readonly right: number;
}

function placeEdge(node: HTMLElement, screenOf: ScreenOf, room: ToolRoom | null): void {
  const [a, b, inside] = (node.dataset.edge ?? '').split('|').map((text) => readPoint(text));
  const sa = a == null ? null : screenOf(a, onTop(node));
  const sb = b == null ? null : screenOf(b, onTop(node));
  const sm = inside == null ? null : screenOf(inside, onTop(node));
  node.hidden = sa === null || sb === null;
  if (sa === null || sb === null) return;
  const mid = { x: (sa.x + sb.x) / 2, y: (sa.y + sb.y) / 2 };
  const reach = Math.hypot(sb.x - sa.x, sb.y - sa.y) || 1;
  if (node.dataset.plus === 'true') {
    node.hidden = reach < PLUS_MIN_PX;
    node.style.transform = `translate(${mid.x}px, ${mid.y}px)`;
    return;
  }
  let normal = { x: (sb.y - sa.y) / reach, y: -(sb.x - sa.x) / reach };
  if (sm !== null && normal.x * (mid.x - sm.x) + normal.y * (mid.y - sm.y) < 0) {
    normal = { x: -normal.x, y: -normal.y };
  }
  const label = node.firstElementChild as HTMLElement | null;
  const halfWidth = (label?.offsetWidth ?? 0) / 2;
  const halfHeight = (label?.offsetHeight ?? 0) / 2;
  const by = LABEL_GAP_PX + Math.abs(normal.x) * halfWidth + Math.abs(normal.y) * halfHeight;
  let x = mid.x + normal.x * by;
  if (room !== null) x = Math.min(Math.max(x, room.left + halfWidth), room.right - halfWidth);
  node.style.transform = `translate(${x}px, ${mid.y + normal.y * by}px)`;
}

/** A move or turn handle: placed by the roof's own rule, its gap a screen size in ground metres. */
function placeHandle(
  node: HTMLElement,
  screenOf: ScreenOf,
  handlesOf: (roof: number, gap: number) => RoofHandles | null,
): void {
  const middle = readPoint(node.dataset.middle);
  const here = middle === null ? null : screenOf(middle, onTop(node));
  const metreOn =
    middle === null ? null : screenOf({ east: middle.east + 1, north: middle.north }, onTop(node));
  const handles =
    here === null || metreOn === null
      ? null
      : handlesOf(
          Number(node.dataset.roof),
          HANDLE_GAP_PX / (Math.hypot(metreOn.x - here.x, metreOn.y - here.y) || 1),
        );
  const at = handles === null ? null : node.dataset.handle === 'turn' ? handles.turn : handles.move;
  const seen = at === null ? null : screenOf(at, onTop(node));
  node.hidden = seen === null;
  if (seen !== null) node.style.transform = `translate(${seen.x}px, ${seen.y}px)`;
}

/** A line through ground points: its `d` drawn again from where they land now. */
function placePath(path: SVGPathElement, screenOf: ScreenOf): void {
  const seen: Xy[] = [];
  for (const text of (path.dataset.pts ?? '').split(';')) {
    const point = readPoint(text);
    const s = point === null ? null : screenOf(point, onTop(path));
    if (s !== null) seen.push(s);
  }
  const close = path.dataset.closed === 'true' ? 'Z' : '';
  const line = seen.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  path.setAttribute('d', seen.length < 2 ? '' : `${line.join(' ')}${close}`);
}

/** On a phone, the room the tool columns leave: a label never sits under one. */
function toolRoomOf(layer: HTMLElement): ToolRoom | null {
  const frame = layer.getBoundingClientRect();
  if (frame.width >= PHONE_BELOW) return null;
  const studio = layer.parentElement;
  const left = studio?.querySelector('.hg-studio-tools[data-side="left"]')?.getBoundingClientRect();
  const right = studio
    ?.querySelector('.hg-studio-tools[data-side="right"]')
    ?.getBoundingClientRect();
  return {
    left: left === undefined || left.width === 0 ? 0 : left.right - frame.left + LABEL_GAP_PX,
    right: right === undefined ? frame.width : right.left - frame.left - LABEL_GAP_PX,
  };
}

export function placeRoofMarks(
  layer: HTMLElement,
  screenOf: ScreenOf,
  handlesOf: (roof: number, gap: number) => RoofHandles | null,
): void {
  for (const node of layer.querySelectorAll<HTMLElement>('[data-at]')) placePoint(node, screenOf);
  const room = toolRoomOf(layer);
  for (const node of layer.querySelectorAll<HTMLElement>('[data-edge]')) {
    placeEdge(node, screenOf, room);
  }
  for (const node of layer.querySelectorAll<HTMLElement>('[data-handle]')) {
    placeHandle(node, screenOf, handlesOf);
  }
  for (const path of layer.querySelectorAll<SVGPathElement>('path[data-pts]')) {
    placePath(path, screenOf);
  }
}
