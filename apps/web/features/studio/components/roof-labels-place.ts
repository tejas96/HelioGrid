import type { KeepOff, LabelAsk, LabelPlace, ScreenPoint } from '@heliogrid/domain';
import { MathUtils } from 'three';
import { type LayoutLabels, laidAt, readPoint } from './roof-marks-place';
import type { ScreenOf } from './StudioRoofs';

/**
 * Lays every length label each drawn frame (`T-M05-002`, part b): each roof's labels are asked at
 * their edges' screen points and their own size, the handles kept clear, and set where the label
 * layout puts them.
 */

/**
 * The move and turn handles where they were laid this frame: the labels keep off them. The + dots
 * need no room: the label gap already clears them.
 */
function handleBoxes(layer: HTMLElement): KeepOff[] {
  const boxes: KeepOff[] = [];
  for (const node of layer.querySelectorAll<HTMLElement>('[data-handle]:not([hidden])')) {
    const at = laidAt(node);
    const size = handleSize(node);
    if (at !== undefined && size !== null) boxes.push({ at, ...size });
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

const DEGREES = MathUtils.RAD2DEG;

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

/** One label set where the layout put it: turned along its edge, its thin line back when sent out. */
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
  const leader = node.querySelector<HTMLElement>('.hg-roof-leader');
  if (leader === null) return;
  leader.hidden = place.leaderFrom === null;
  if (place.leaderFrom === null) return;
  const dx = place.leaderFrom.x - x;
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
    handleBoxes(layer),
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
