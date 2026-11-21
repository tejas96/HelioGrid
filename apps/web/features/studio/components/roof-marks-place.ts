import type {
  GroundPoint,
  LabelAsk,
  LabelPlace,
  RoofHandles,
  RoofLabelAsk,
  ScreenPoint,
} from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { MathUtils } from 'three';
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
/** The room a label keeps from a tool column, in CSS pixels. */
const COLUMN_GAP_PX = 8;
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
    left: left === undefined || left.width === 0 ? 0 : left.right - frame.left + COLUMN_GAP_PX,
    right: right === undefined ? frame.width : right.left - frame.left - COLUMN_GAP_PX,
  };
}

export function placeRoofMarks(
  layer: HTMLElement,
  screenOf: ScreenOf,
  handlesOf: (roof: number, gap: number) => RoofHandles | null,
  layout: LayoutLabels,
): void {
  for (const node of layer.querySelectorAll<HTMLElement>('[data-at]')) placePoint(node, screenOf);
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
}

/** The label layout, from the studio's hook: where each length sits for the points it is given. */
export type LayoutLabels = (roofs: readonly RoofLabelAsk[]) => LabelPlace[][];

const DEGREES = MathUtils.RAD2DEG;

/** A roof's corners on the screen, from its shape mark; `null` when one is behind the camera. */
function shapesOn(layer: HTMLElement, screenOf: ScreenOf): Map<string, ScreenPoint[]> {
  const shapes = new Map<string, ScreenPoint[]>();
  for (const node of layer.querySelectorAll<HTMLElement>('[data-roof][data-pts]')) {
    const seen = (node.dataset.pts ?? '').split(';').map((text) => {
      const point = readPoint(text);
      return point === null ? null : screenOf(point, false);
    });
    if (seen.every((point) => point !== null))
      shapes.set(node.dataset.roof ?? '', seen as ScreenPoint[]);
  }
  return shapes;
}

/** One label set where the layout put it: turned along its edge, its thin line back when sent out. */
function setLabel(node: HTMLElement, place: LabelPlace | undefined): void {
  // Away, not hidden: a label keeps its size, so the next frame measures it and it does not blink.
  node.dataset.unseen = String(place === undefined || !place.shown);
  if (place === undefined || !place.shown) return;
  node.style.transform = `translate(${place.at.x}px, ${place.at.y}px)`;
  node.style.setProperty('--hg-turn', `${place.degrees}deg`);
  const leader = node.querySelector<HTMLElement>('.hg-roof-leader');
  if (leader === null) return;
  leader.hidden = place.leaderFrom === null;
  if (place.leaderFrom === null) return;
  const dx = place.leaderFrom.x - place.at.x;
  const dy = place.leaderFrom.y - place.at.y;
  leader.style.inlineSize = `${Math.hypot(dx, dy)}px`;
  leader.style.transform = `rotate(${Math.atan2(dy, dx) * DEGREES}deg)`;
}

/**
 * Every length label, laid by the label layout (`T-M05-002`, part b): each roof's labels are asked
 * at their edges' screen points and their own measured size, and set where the layout puts them.
 */
export function placeLabels(layer: HTMLElement, screenOf: ScreenOf, layout: LayoutLabels): void {
  const shapes = shapesOn(layer, screenOf);
  const asked = new Map<string, { nodes: HTMLElement[]; labels: LabelAsk[] }>();
  for (const node of layer.querySelectorAll<HTMLElement>('[data-label]')) {
    const roof = node.dataset.label ?? '';
    const from = readPoint(node.dataset.from);
    const to = readPoint(node.dataset.to);
    const a = from === null ? null : screenOf(from, false);
    const b = to === null ? null : screenOf(to, false);
    // The pill as drawn, not its wider tap area: labels give way where they are seen to touch.
    const pill = node.querySelector<HTMLElement>('.hg-roof-len');
    if (a === null || b === null || pill === null || !shapes.has(roof)) {
      node.dataset.unseen = 'true';
      continue;
    }
    const group = asked.get(roof) ?? { nodes: [], labels: [] };
    group.nodes.push(node);
    group.labels.push({
      from: a,
      to: b,
      trust:
        node.dataset.trust === 'typed' || node.dataset.trust === 'measured'
          ? node.dataset.trust
          : 'traced',
      width: pill.offsetWidth,
      height: pill.offsetHeight,
      pinned: node.dataset.pinned === 'true',
      level: node.dataset.level === 'true',
    });
    asked.set(roof, group);
  }
  const roofs = [...asked.entries()];
  const placed = layout(
    roofs.map(([roof, group]) => ({ corners: shapes.get(roof) ?? [], labels: group.labels })),
  );
  roofs.forEach(([, group], r) => {
    group.nodes.forEach((node, e) => {
      setLabel(node, placed[r]?.[e]);
    });
  });
}
