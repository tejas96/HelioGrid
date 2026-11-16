/** One mark of a scene: a path, a circle or a rounded rectangle, on the scene's box. */
export type SceneMark =
  | { readonly kind: 'path'; readonly d: string }
  | { readonly kind: 'circle'; readonly cx: number; readonly cy: number; readonly r: number }
  | {
      readonly kind: 'rect';
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly rx: number;
    };

export const path = (d: string): SceneMark => ({ kind: 'path', d });
export const circle = (cx: number, cy: number, r: number): SceneMark => ({
  kind: 'circle',
  cx,
  cy,
  r,
});
export const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  rx: number,
): SceneMark => ({
  kind: 'rect',
  x,
  y,
  width,
  height,
  rx,
});

/** A stable React key for a mark: no layer draws the same mark twice. */
export function markKey(mark: SceneMark): string {
  if (mark.kind === 'path') return mark.d;
  if (mark.kind === 'circle') return `c${mark.cx}-${mark.cy}-${mark.r}`;
  return `r${mark.x}-${mark.y}-${mark.width}-${mark.height}`;
}
