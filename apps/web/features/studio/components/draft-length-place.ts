import type { LabelPlace, LevelAsk, RoofLabelAsk, ScreenPoint } from '@heliogrid/domain';

/**
 * The length of an edge of the roof being drawn (`T-M05-002`, part b), laid each frame by the marks'
 * placer: level, always shown, on the side away from the inside point, by the one label layout;
 * clear of the first corner's glow, and on a phone between the tool columns.
 */
export function placeDraftLength(
  node: HTMLElement,
  [from, to, inside]: readonly [ScreenPoint, ScreenPoint, ScreenPoint | null],
  room: { readonly left: number; readonly right: number } | null,
  layout: (roofs: readonly RoofLabelAsk[]) => LabelPlace[][],
  clear: (ask: LevelAsk) => ScreenPoint,
): void {
  const label = node.querySelector<HTMLElement>('.hg-roof-len');
  const width = label?.offsetWidth ?? 0;
  const height = label?.offsetHeight ?? 0;
  const ask = { from, to, trust: 'traced', width, height, pinned: true, level: true } as const;
  const [placed] =
    layout([{ corners: inside === null ? [from, to] : [from, to, inside], labels: [ask] }])[0] ??
    [];
  if (placed === undefined) return;
  // A small roof brings its first corner close: where a tap closes the roof, the length keeps off.
  const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const at = clear({ at: placed.at, from: middle, width, height });
  const half = width / 2;
  const x = room === null ? at.x : Math.min(Math.max(at.x, room.left + half), room.right - half);
  node.style.transform = `translate(${x}px, ${at.y}px)`;
}
