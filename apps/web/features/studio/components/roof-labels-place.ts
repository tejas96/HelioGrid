import {
  type KeepOff,
  type LabelAsk,
  type LabelPlace,
  ROOF_EDGE_TRUSTS,
  type RoofEdgeTrust,
  type ScreenPoint,
} from '@heliogrid/domain';
import {
  type ClearLevel,
  type LayoutLabels,
  laidAt,
  readPoint,
  smallOnScreen,
} from './roof-marks-place';
import type { ScreenOf } from './StudioRoofs';

/**
 * Lays every length label each drawn frame (`T-M05-002`, part b): each roof's labels are asked at
 * their edges' screen points and their own size, the handles kept clear, and set where the label
 * layout puts them.
 */

/** An edge's trust as its label carries it; one this build does not know reads as traced. */
function trustOf(written: string | undefined): RoofEdgeTrust {
  return ROOF_EDGE_TRUSTS.find((trust) => trust === written) ?? 'traced';
}

/**
 * The move and turn handles and the stairs mark where they were laid this frame: the labels keep
 * off them. The + dots need no room: the label gap already clears them.
 */
function handleBoxes(layer: HTMLElement): KeepOff[] {
  const boxes: KeepOff[] = [];
  for (const node of layer.querySelectorAll<HTMLElement>('[data-handle]:not([hidden])')) {
    const at = laidAt(node);
    const size = handleSize(node);
    if (at !== undefined && size !== null) boxes.push({ at, ...size });
  }
  // The stairs mark draws small on a small room, so its size is read each frame, never kept.
  for (const node of layer.querySelectorAll<HTMLElement>('[data-stairs]:not([hidden])')) {
    const at = laidAt(node);
    const mark = node.querySelector<HTMLElement>('.hg-stairs-mark');
    if (at !== undefined && mark !== null && mark.offsetWidth > 0) {
      boxes.push({ at, width: mark.offsetWidth, height: mark.offsetHeight });
    }
  }
  return boxes;
}

/** The corner dots where they stand: a roof's height tag keeps off them as off a handle. */
function dotBoxes(layer: HTMLElement): KeepOff[] {
  const boxes: KeepOff[] = [];
  for (const node of layer.querySelectorAll<HTMLElement>('[data-dot-roof]:not([hidden])')) {
    const at = laidAt(node);
    const dot = node.querySelector<HTMLElement>('.hg-roof-dot');
    if (at !== undefined && dot !== null && dot.offsetWidth > 0) {
      boxes.push({ at, width: dot.offsetWidth, height: dot.offsetHeight });
    }
  }
  return boxes;
}

/** A handle's drawn size never changes: read once, then kept. */
const sizes = new WeakMap<HTMLElement, { width: number; height: number }>();
function handleSize(node: HTMLElement): { width: number; height: number } | null {
  const known = sizes.get(node);
  if (known !== undefined) return known;
  const mark = node.querySelector<HTMLElement>('.hg-roof-handle');
  if (mark === null || mark.offsetWidth === 0) return null;
  const size = { width: mark.offsetWidth, height: mark.offsetHeight };
  sizes.set(node, size);
  return size;
}

/** Whether two boxes, each by its middle and size, overlap. */
const overlaps = (a: KeepOff, b: KeepOff) =>
  Math.abs(a.at.x - b.at.x) * 2 < a.width + b.width &&
  Math.abs(a.at.y - b.at.y) * 2 < a.height + b.height;

/**
 * A roof's height on it ("+3.0 m") steps off a handle or the stairs mark it would sit under, away
 * from that mark, so it stays read on a small room.
 */
function keepHeightsOff(
  layer: HTMLElement,
  marks: readonly KeepOff[],
  clearLevel: ClearLevel,
): void {
  for (const node of layer.querySelectorAll<HTMLElement>('[data-above]:not([hidden])')) {
    const at = laidAt(node);
    const tag = node.querySelector<HTMLElement>('.hg-roof-above');
    if (at === undefined || tag === null) continue;
    const box = { at, width: tag.offsetWidth, height: tag.offsetHeight };
    const under = marks.find((mark) => overlaps(box, mark));
    if (under === undefined) continue;
    // Straight below a mark on its middle: away from it is down.
    const from = under.at.x === at.x && under.at.y === at.y ? { x: at.x, y: at.y - 1 } : under.at;
    const clear = clearLevel({ at, from, width: box.width, height: box.height }, marks);
    node.style.transform = `translate(${clear.x}px, ${clear.y}px)`;
  }
}

/**
 * The stairs mark on a stair room under two handle gaps across on the screen draws small, so the
 * room's corners, lengths and height stay seen round it; it is sized before the labels measure it.
 */
function sizeStairs(layer: HTMLElement, screenOf: ScreenOf): void {
  for (const node of layer.querySelectorAll<HTMLElement>('[data-stairs][data-room]')) {
    const seen = (node.dataset.room ?? '').split(';').map((text) => {
      const point = readPoint(text);
      return point === null ? null : screenOf(point, 0);
    });
    if (seen.length === 0 || seen.some((point) => point === null)) continue;
    const xs = (seen as ScreenPoint[]).map((point) => point.x);
    const ys = (seen as ScreenPoint[]).map((point) => point.y);
    const span = Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    const small = String(smallOnScreen(span));
    if (node.dataset.small !== small) node.dataset.small = small;
  }
}

/** A roof's corners on the screen, from its shape mark; `null` when one is behind the camera. */
function shapesOn(layer: HTMLElement, screenOf: ScreenOf): Map<string, ScreenPoint[]> {
  const shapes = new Map<string, ScreenPoint[]>();
  for (const node of layer.querySelectorAll<HTMLElement>('[data-roof][data-pts]')) {
    const seen = (node.dataset.pts ?? '').split(';').map((text) => {
      const point = readPoint(text);
      return point === null ? null : screenOf(point, 0);
    });
    if (seen.every((point) => point !== null))
      shapes.set(node.dataset.roof ?? '', seen as ScreenPoint[]);
  }
  return shapes;
}

/** How near the screen's side the length in hand may come, in CSS pixels. */
const SIDE_ROOM_PX = 8;

/** The room across the screen a label's middle keeps to: the length in hand stays on screen. */
type Across = { readonly min: number; readonly max: number } | null;

function setLabel(node: HTMLElement, place: LabelPlace | undefined, across: Across): void {
  // Away, not hidden: a label keeps its size, so the next frame measures it and it does not blink.
  node.dataset.unseen = String(place === undefined || !place.shown);
  if (place === undefined || !place.shown) return;
  const x = across === null ? place.at.x : Math.min(Math.max(place.at.x, across.min), across.max);
  node.style.transform = `translate(${x}px, ${place.at.y}px)`;
  node.style.setProperty('--hg-turn', `${place.degrees}deg`);
}

/**
 * Every length label, laid by the label layout (`T-M05-002`, part b): each roof's labels are asked
 * at their edges' screen points and their own measured size, and set where the layout puts them.
 */
export function placeLabels(
  layer: HTMLElement,
  screenOf: ScreenOf,
  layout: LayoutLabels,
  clearLevel: ClearLevel,
): void {
  sizeStairs(layer, screenOf);
  const shapes = shapesOn(layer, screenOf);
  const asked = new Map<string, { nodes: HTMLElement[]; labels: LabelAsk[] }>();
  for (const node of layer.querySelectorAll<HTMLElement>('[data-label]')) {
    const roof = node.dataset.label ?? '';
    const from = readPoint(node.dataset.from);
    const to = readPoint(node.dataset.to);
    const a = from === null ? null : screenOf(from, 0);
    const b = to === null ? null : screenOf(to, 0);
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
      trust: trustOf(node.dataset.trust),
      width: pill.offsetWidth,
      height: pill.offsetHeight,
      pinned: node.dataset.pinned === 'true',
      level: node.dataset.level === 'true',
    });
    asked.set(roof, group);
  }
  const roofs = [...asked.entries()];
  const marks = handleBoxes(layer);
  keepHeightsOff(layer, [...marks, ...dotBoxes(layer)], clearLevel);
  const placed = layout(
    roofs.map(([roof, group]) => ({ corners: shapes.get(roof) ?? [], labels: group.labels })),
    marks,
  );
  const wide = layer.clientWidth;
  roofs.forEach(([, group], r) => {
    group.nodes.forEach((node, e) => {
      const ask = group.labels[e];
      const half = (ask?.width ?? 0) / 2 + SIDE_ROOM_PX;
      const across = ask?.level === true ? { min: half, max: wide - half } : null;
      setLabel(node, placed[r]?.[e], across);
    });
  });
}
