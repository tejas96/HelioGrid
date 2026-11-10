import type { DURATION, EASING } from '@heliogrid/theme';
import { circle, type GlyphMark, path, rect } from '../AppShell/ShellGlyph.marks';
import type { EmptySceneName } from './EmptyScene.types';

/**
 * The empty scenes, drawn as data: every number is in the scene's own 120 × 96 box, and both halves
 * draw from here. This is art, not an icon, so `biome.json` lets this file hold path data.
 *
 * Each layer comes in once from where `pace` starts it and rests where it is drawn:
 * - `rise` up a little, fading in · `drop` down from above with a soft bounce · `glide` in from the
 *   lower right
 * `step` staggers the layers, a standard duration apart. `faint` draws the layer as a quieter line.
 */
export const SCENE_BOX = { width: 120, height: 96 } as const;

/** How large each size draws the box. */
export const SCENE_SCALE = { regular: 1, compact: 0.5 } as const;

export type ScenePace = 'rise' | 'drop' | 'glide';

export interface SceneLayer {
  readonly marks: readonly GlyphMark[];
  readonly pace: ScenePace;
  readonly step: number;
  readonly faint?: boolean;
}

interface PaceMotion {
  /** Where the layer starts, in scene units, before it moves to rest. */
  readonly from: { readonly x: number; readonly y: number };
  readonly duration: keyof typeof DURATION;
  readonly easing: keyof typeof EASING;
}

export const PACES: Readonly<Record<ScenePace, PaceMotion>> = {
  rise: { from: { x: 0, y: 8 }, duration: 'data', easing: 'enter' },
  drop: { from: { x: 0, y: -24 }, duration: 'scene', easing: 'spring' },
  glide: { from: { x: 28, y: 10 }, duration: 'scene', easing: 'enter' },
};

const row = (y: number, line: number): GlyphMark[] => [
  rect(14, y, 70, 16, 5),
  path(`M22 ${y + 8}h${line}`),
];

export const SCENES: Readonly<Record<EmptySceneName, readonly SceneLayer[]>> = {
  search: [
    { marks: row(14, 30), pace: 'rise', step: 0 },
    { marks: row(36, 22), pace: 'rise', step: 1, faint: true },
    { marks: row(58, 36), pace: 'rise', step: 2, faint: true },
    { marks: [circle(88, 56, 13), path('m97.5 65.5 9 9')], pace: 'glide', step: 3 },
  ],
  settle: [
    {
      marks: [path('M14 58v18a6 6 0 0 0 6 6h80a6 6 0 0 0 6-6V58'), path('M14 58h20l5 8h42l5-8h20')],
      pace: 'rise',
      step: 0,
    },
    { marks: [rect(34, 18, 52, 12, 4)], pace: 'drop', step: 1, faint: true },
    { marks: [rect(30, 34, 60, 12, 4)], pace: 'drop', step: 2, faint: true },
    { marks: [rect(26, 50, 68, 12, 4)], pace: 'drop', step: 3 },
  ],
  filter: [
    { marks: [path('M24 22h72l-28 32v24l-16 8V54z')], pace: 'rise', step: 0 },
    { marks: [circle(46, 14, 2.5)], pace: 'drop', step: 2, faint: true },
    { marks: [circle(60, 11, 2.5)], pace: 'drop', step: 3 },
    { marks: [circle(73, 15, 2.5)], pace: 'drop', step: 4, faint: true },
  ],
};
