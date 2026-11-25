import { gripCorner } from './roof-step';
import type { RoofStepState } from './roof-step-state';

/**
 * The job in hand. `looking` is no job: everything a person may use is there. `dragging` is a
 * corner (or a new one from a +), which the magnet guides; `moving` is the whole roof, moved or
 * turned.
 */
export const FOCUS_JOBS = [
  'looking',
  'drawing',
  'dragging',
  'moving',
  'sizing',
  'typing',
  'sheet',
  /** A card of your picture's is open: North, the plan's or its unit (`T-M05-002d`). */
  'picture',
  /** Roofs or the material picker is open (`T-M05-002`, part e); a reader may open them too. */
  'roofs',
  /**
   * The View panel or the picture panel is open: on a phone it opens at the foot, in the tools' and
   * the bar's place; on a wider screen beside its button, and nothing else moves. A reader may open it.
   */
  'menu',
] as const;
export type FocusJob = (typeof FOCUS_JOBS)[number];

const JOB_OF_STEP: Record<RoofStepState['kind'], FocusJob> = {
  idle: 'looking',
  drawing: 'drawing',
  sizing: 'sizing',
  typing: 'typing',
  dragging: 'dragging',
};

/**
 * The job the roof step has in hand. A drag holds a corner — or a new one from a + — which the
 * magnet guides, or the whole roof, moved or turned. A roof's sheet is the
 * studio's own job, beside the roof step.
 */
export function focusJobOf(step: RoofStepState): FocusJob {
  if (step.kind === 'dragging' && gripCorner(step.grip) === null) return 'moving';
  return JOB_OF_STEP[step.kind];
}

/**
 * The studio's job in hand: what is open over the roof step comes first — Roofs or the material
 * picker, then a roof's sheet, then a card of your picture's.
 */
export function studioJobOf(
  step: FocusJob,
  open: {
    readonly roofs: boolean;
    readonly sheet: boolean;
    readonly picture: boolean;
    /** The View panel or the picture panel: opened over everything else, so it comes first. */
    readonly menu: boolean;
  },
): FocusJob {
  if (open.menu) return 'menu';
  if (open.roofs) return 'roofs';
  if (open.sheet) return 'sheet';
  return open.picture ? 'picture' : step;
}
