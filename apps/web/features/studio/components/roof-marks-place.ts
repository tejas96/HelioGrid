import type { GroundPoint, RoofHandles } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import type { LayoutLabels } from './roof-labels-place';
import type { ScreenOf } from './StudioRoofs';

/**
 * Moves the roof marks to where the model lands now (`T-M05-002`, part b). Each mark carries its
 * own place on the ground in `data-` attributes; this reads them, asks the camera where they land,
 * and sets their transform — every drawn frame, never through a render.
 */

/** The + on an edge hides when the edge is shorter than this on screen: zoom in to add one there. */
const PLUS_MIN_PX = 110;
/** Two corner dots nearer than this on the screen shrink, so both stay seen. */
const NEAR_PX = 18;
/** How far apart the move and the turn handle sit, in CSS pixels. */
const HANDLE_GAP_PX = 44;
/** How far the × and a picked corner's angle stand out from the corner, in CSS pixels. */
const PICKED_OUT_PX = 30;
/** The room a label keeps from a tool column, in CSS pixels. */
const COLUMN_GAP_PX = 8;
/** On a phone the tool columns stand beside the roof: a label keeps between them. */
const PHONE_BELOW = theme.layout['bp-desktop'];

type Xy = { x: number; y: number };

/**
 * Where each point mark and handle was last laid, in the layer's pixels: crowding and the labels'
 * room are worked out from these, never by reading the page's layout back each frame.
 */
const laid = new WeakMap<HTMLElement, Xy>();

/** Where a mark was last laid; `undefined` before its first frame. */
export function laidAt(node: HTMLElement): Xy | undefined {
  return laid.get(node);
}

/** A place on the ground written into a mark: `east north`. */
export const pointText = (p: GroundPoint) => `${p.east} ${p.north}`;

export function readPoint(text: string | undefined): GroundPoint | null {
  if (text === undefined) return null;
  const [east, north] = text.split(' ').map(Number);
  return east === undefined || north === undefined ? null : { east, north };
}

/** How high above the ground a mark stands, in metres: a roof's top in 3D, the ground in the top view. */
const onTop = (node: HTMLElement | SVGElement) => Number(node.dataset.top ?? 0);

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
  laid.set(node, { x, y });
  node.style.transform = `translate(${x}px, ${y}px)`;
}

/** The blue arrow's measure: how many screen pixels one metre up takes at the roof's top. */
function measureRise(node: HTMLElement, screenOf: ScreenOf): void {
  const at = readPoint(node.dataset.at);
  const here = at === null ? null : screenOf(at, onTop(node));
  const above = at === null ? null : screenOf(at, onTop(node) + 1);
  node.dataset.perMetre = here === null || above === null ? '0' : String(here.y - above.y);
}

/** The free room between the two tool columns, in the layer's pixels. */
interface ToolRoom {
  readonly left: number;
  readonly right: number;
}

/** An edge mark of the roof being drawn: the + at its middle, or its length beside it. */
function placeEdge(
  node: HTMLElement,
  screenOf: ScreenOf,
  room: ToolRoom | null,
  layout: LayoutLabels,
): void {
  const [a, b, inside] = (node.dataset.edge ?? '').split('|').map((text) => readPoint(text));
  const sa = a == null ? null : screenOf(a, onTop(node));
  const sb = b == null ? null : screenOf(b, onTop(node));
  const sm = inside == null ? null : screenOf(inside, onTop(node));
  node.hidden = sa === null || sb === null;
  if (sa === null || sb === null) return;
  if (node.dataset.plus === 'true') {
    node.hidden = Math.hypot(sb.x - sa.x, sb.y - sa.y) < PLUS_MIN_PX;
    node.style.transform = `translate(${(sa.x + sb.x) / 2}px, ${(sa.y + sb.y) / 2}px)`;
    return;
  }
  // A length on the roof being drawn: level, always shown, on the side away from the inside point,
  // laid by the one label layout.
  const label = node.querySelector<HTMLElement>('.hg-roof-len');
  const width = label?.offsetWidth ?? 0;
  const [placed] =
    layout([
      {
        corners: sm === null ? [sa, sb] : [sa, sb, sm],
        labels: [
          {
            from: sa,
            to: sb,
            trust: 'traced',
            width,
            height: label?.offsetHeight ?? 0,
            pinned: true,
            level: true,
          },
        ],
      },
    ])[0] ?? [];
  if (placed === undefined) return;
  let { x } = placed.at;
  const half = width / 2;
  if (room !== null) x = Math.min(Math.max(x, room.left + half), room.right - half);
  node.style.transform = `translate(${x}px, ${placed.at.y}px)`;
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
  if (seen === null) return;
  laid.set(node, seen);
  node.style.transform = `translate(${seen.x}px, ${seen.y}px)`;
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
    left: left === undefined || left.width === 0 ? 0 : left.right - frame.left + COLUMN_GAP_PX,
    right: right === undefined ? frame.width : right.left - frame.left - COLUMN_GAP_PX,
  };
}

/**
 * Corner dots of one roof nearer than `NEAR_PX` on the screen are marked near, and shrink. Answers
 * whether the corner held in a drag is one of them: the bar then asks for a closer look.
 */
function markNear(layer: HTMLElement): boolean {
  const dots = [...layer.querySelectorAll<HTMLElement>('[data-dot-roof]:not([hidden])')];
  let heldNear = false;
  dots.forEach((node) => {
    const a = laid.get(node);
    const near = dots.some((other) => {
      const b = laid.get(other);
      return (
        other !== node &&
        a !== undefined &&
        b !== undefined &&
        other.dataset.dotRoof === node.dataset.dotRoof &&
        Math.hypot(a.x - b.x, a.y - b.y) < NEAR_PX
      );
    });
    node.dataset.near = String(near);
    if (near && node.querySelector('[data-hot="true"]') !== null) heldNear = true;
  });
  return heldNear;
}

/** Every roof mark laid where the model lands now; answers whether the corner held is crowded. */
export function placeRoofMarks(
  layer: HTMLElement,
  screenOf: ScreenOf,
  handlesOf: (roof: number, gap: number) => RoofHandles | null,
  layout: LayoutLabels,
): boolean {
  for (const node of layer.querySelectorAll<HTMLElement>('[data-at]')) placePoint(node, screenOf);
  for (const node of layer.querySelectorAll<HTMLElement>('[data-arrow]')) {
    measureRise(node, screenOf);
  }
  const room = toolRoomOf(layer);
  for (const node of layer.querySelectorAll<HTMLElement>('[data-edge]')) {
    placeEdge(node, screenOf, room, layout);
  }
  for (const node of layer.querySelectorAll<HTMLElement>('[data-handle]')) {
    placeHandle(node, screenOf, handlesOf);
  }
  for (const path of layer.querySelectorAll<SVGPathElement>('path[data-pts]')) {
    placePath(path, screenOf);
  }
  return markNear(layer);
}
