import type {
  GroundPoint,
  KeepOff,
  LabelPlace,
  LevelAsk,
  RoofHandles,
  RoofLabelAsk,
  ScreenPoint,
  TagAsk,
  TagRoom,
} from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { placeDraftLength } from './draft-length-place';
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
/** A handle's room on the screen, in CSS pixels: the turn handle stands two away (`roofHandles`). */
const HANDLE_GAP_PX = 44;
/** A corner dot's touch target: the length being drawn keeps off the first corner's. */
const FIRST_CORNER_PX = 44;
/** How far the × and a picked corner's angle stand out from the corner, in CSS pixels. */
const PICKED_OUT_PX = 30;
/** The room a label keeps from a tool column, in CSS pixels. */
const COLUMN_GAP_PX = 8;
/** On a phone the tool columns stand beside the roof: a label keeps between them. */
const PHONE_BELOW = theme.layout['bp-desktop'];
/** How far a tag stands from its spot: across, and up or down. */
const TAG_GAP_PX = theme.spacing['sp-4'];
const TAG_CLEAR_PX = theme.spacing['sp-3'];

/** A room under two handle gaps across on the screen is small: the marks on it draw small. */
export const smallOnScreen = (span: number) => span < 2 * HANDLE_GAP_PX;

/** A level length stepped off what it must keep off, from the studio's hook. */
export type ClearLevel = (ask: LevelAsk, keepOff: readonly KeepOff[]) => ScreenPoint;

/** The tag layout, from the studio's hook: where a tag sits beside its spot. */
export type PlaceTag = (ask: TagAsk) => ScreenPoint;

/** The label layout, from the studio's hook: where each length sits for the points it is given. */
export type LayoutLabels = (
  roofs: readonly RoofLabelAsk[],
  keepOff?: readonly KeepOff[],
) => LabelPlace[][];

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
  clear: (ask: LevelAsk) => ScreenPoint,
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
  placeDraftLength(node, [sa, sb, sm], room, layout, clear);
}

/** The first corner of the roof being drawn, where it was laid this frame: none, or its target. */
function firstCornerOf(layer: HTMLElement): KeepOff[] {
  const holder = layer.querySelector<HTMLElement>('[data-start][data-at]');
  const at = holder === null || holder.hidden ? undefined : laid.get(holder);
  return at === undefined ? [] : [{ at, width: FIRST_CORNER_PX, height: FIRST_CORNER_PX }];
}

/**
 * A move or turn handle: placed by the roof's own rule, its gap a screen size in ground metres,
 * and kept between the tool columns so it never lands under one.
 */
function placeHandle(
  node: HTMLElement,
  screenOf: ScreenOf,
  handlesOf: (roof: number, gap: number) => RoofHandles | null,
  room: ToolRoom,
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
  const onScreen = at === null ? null : screenOf(at, onTop(node));
  node.hidden = onScreen === null;
  if (onScreen === null) return;
  const half = HANDLE_GAP_PX / 2;
  const x = Math.min(Math.max(onScreen.x, room.left + half), room.right - half);
  const seen = { x, y: onScreen.y };
  laid.set(node, seen);
  node.style.transform = `translate(${seen.x}px, ${seen.y}px)`;
}

/** A line through ground points: its `d` drawn again from where they land now. */
function placePath(path: SVGPathElement, screenOf: ScreenOf): void {
  const seen: Xy[] = [];
  for (const text of (path.dataset.pts ?? '').split(';')) {
    const point = readPoint(text);
    // A point may carry its own height after its place: an upright face's top and foot.
    const own = Number(text.split(' ')[2]);
    const up = Number.isFinite(own) ? own : onTop(path);
    const s = point === null ? null : screenOf(point, up);
    if (s !== null) seen.push(s);
  }
  const close = path.dataset.closed === 'true' ? 'Z' : '';
  const line = seen.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  path.setAttribute('d', seen.length < 2 ? '' : `${line.join(' ')}${close}`);
}

/** The room the two tool columns leave on the map, in the layer's pixels. */
function columnsRoomOf(layer: HTMLElement): ToolRoom {
  const frame = layer.getBoundingClientRect();
  const studio = layer.parentElement;
  const left = studio?.querySelector('.hg-studio-tools[data-side="left"]')?.getBoundingClientRect();
  const right = studio
    ?.querySelector('.hg-studio-tools[data-side="right"]')
    ?.getBoundingClientRect();
  return {
    left: left === undefined || left.width === 0 ? 0 : left.right - frame.left + COLUMN_GAP_PX,
    right:
      right === undefined || right.width === 0
        ? frame.width
        : right.left - frame.left - COLUMN_GAP_PX,
  };
}

/**
 * The room a tag stays inside: off the map's edges and clear of the tool columns, at every width,
 * since the spot it names can be right beside one.
 */
function tagRoomOf(layer: HTMLElement, columns: ToolRoom): TagRoom {
  return {
    left: Math.max(columns.left, COLUMN_GAP_PX),
    right: Math.min(columns.right, layer.clientWidth - COLUMN_GAP_PX),
    top: COLUMN_GAP_PX,
  };
}

/** A tag beside its spot; an angle or an area in the tag's look sits on its spot's middle instead. */
const BESIDE_TAG = '.hg-roof-at > .hg-roof-tag:not(.hg-roof-angle, .hg-size-area)';

/**
 * Each tag beside a spot, laid inside the room: its words wrap at the room's width, then it stands
 * on whichever side of its spot keeps it whole. Its holder is laid first. Every width is set before
 * any size is read, so the page lays out once for all of them.
 */
function placeTags(layer: HTMLElement, room: TagRoom, placeTag: PlaceTag): void {
  const width = `${Math.max(room.right - room.left, 0)}px`;
  const tags = [...layer.querySelectorAll<HTMLElement>(BESIDE_TAG)].flatMap((tag) => {
    const holder = tag.parentElement;
    const spot = holder === null || holder.hidden ? undefined : laid.get(holder);
    return spot === undefined ? [] : [{ tag, spot }];
  });
  for (const { tag } of tags) tag.style.setProperty('--hg-tag-room', width);
  const places = tags.map(({ tag, spot }) =>
    placeTag({
      spot,
      width: tag.offsetWidth,
      height: tag.offsetHeight,
      room,
      gap: TAG_GAP_PX,
      clear: TAG_CLEAR_PX,
    }),
  );
  tags.forEach(({ tag }, i) => {
    const place = places[i];
    if (place === undefined) return;
    tag.style.setProperty('--hg-tag-x', `${place.x}px`);
    tag.style.setProperty('--hg-tag-y', `${place.y}px`);
  });
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
  placeTag: PlaceTag,
  clearLevel: ClearLevel,
): boolean {
  for (const node of layer.querySelectorAll<HTMLElement>('[data-at]')) placePoint(node, screenOf);
  for (const node of layer.querySelectorAll<HTMLElement>('[data-arrow]')) {
    measureRise(node, screenOf);
  }
  const columns = columnsRoomOf(layer);
  const room = layer.clientWidth < PHONE_BELOW ? columns : null;
  const first = firstCornerOf(layer);
  const clear = (ask: LevelAsk) => clearLevel(ask, first);
  for (const node of layer.querySelectorAll<HTMLElement>('[data-edge]')) {
    placeEdge(node, screenOf, room, layout, clear);
  }
  for (const node of layer.querySelectorAll<HTMLElement>('[data-handle]')) {
    placeHandle(node, screenOf, handlesOf, columns);
  }
  for (const path of layer.querySelectorAll<SVGPathElement>('path[data-pts]')) {
    placePath(path, screenOf);
  }
  placeTags(layer, tagRoomOf(layer, columns), placeTag);
  return markNear(layer);
}
