import { gripCorner } from './roof-step';
import type { RoofStepState } from './roof-step-state';
import type { StudioView } from './views';

/**
 * Focus mode (`T-M05-002`, part b): while a person does one job — draws, drags, sets a length or
 * has a roof's sheet open — every part of the studio that job does not use steps aside, and comes
 * back when the job ends. The picture's credit line never hides (the provider's terms). The screen
 * fades each part in and out; this file alone decides which.
 */

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

/** What the studio shows of each part. `hidden` steps aside; every other value is on screen. */
export interface FocusParts {
  /**
   * The steps and the save mark in their pill. `mark`: the save mark alone — a roof's sheet keeps
   * it, and any job keeps it for a save that failed.
   */
  readonly stepSwitcher: 'shown' | 'mark' | 'hidden';
  /** The picture chip whole, or its credit line alone. */
  readonly pictureChip: 'shown' | 'credit';
  /** The pencil that starts a drawing; `filled` while it draws. */
  readonly pencil: 'shown' | 'filled' | 'hidden';
  /**
   * The magnet, in the bottom bar: while a corner is drawn, and — `picked` — while a roof is picked,
   * for the drags to come. A drag in hand keeps it as it was set (Alt frees one move).
   */
  readonly magnet: 'shown' | 'picked' | 'hidden';
  /** Undo and Redo, or — while drawing, where Undo takes off a corner — Undo alone. */
  readonly undoRedo: 'shown' | 'undo' | 'hidden';
  /** The trash beside Undo that wipes every corner of the drawing. */
  readonly wipe: 'shown' | 'hidden';
  /** The layers and the 2D/3D switch, or the switch alone. */
  readonly layers: 'shown' | 'switch' | 'hidden';
  readonly sideViews: 'shown' | 'hidden';
  /** Zoom in, Zoom out and Back to the pin. */
  readonly zoom: 'shown' | 'hidden';
  /** The north arrow. */
  readonly compass: 'shown' | 'hidden';
  /** The corner dots, + dots and handles of the roofs not being changed: the picked roof's only. */
  readonly otherHandles: 'picked' | 'hidden';
  /** Which length labels show: all, the draft's, every one live, or none. */
  readonly lengthLabels: 'all' | 'draft' | 'hidden';
  /** The bottom bar: status and main button, the slim pill (drawing or typing), the status alone, or none. */
  readonly bottomBar: 'main' | 'drawing' | 'status' | 'hidden';
}

export interface FocusFacts {
  readonly job: FocusJob;
  readonly view: StudioView;
  /** A phone-width screen, where the slider and the keyboard take the low part of the screen. */
  readonly phone: boolean;
  /** The reader may change the design; a reader who may not never starts a job. */
  readonly canEdit: boolean;
  /** At least one roof stands. */
  readonly hasRoof: boolean;
  /** The last save failed: its mark shows whatever the job. */
  readonly saveFailed: boolean;
}

const LOOKING_TOP: FocusParts = {
  stepSwitcher: 'shown',
  pictureChip: 'shown',
  pencil: 'shown',
  magnet: 'picked',
  undoRedo: 'shown',
  wipe: 'hidden',
  layers: 'shown',
  sideViews: 'hidden',
  zoom: 'shown',
  compass: 'shown',
  otherHandles: 'picked',
  lengthLabels: 'all',
  bottomBar: 'main',
};

/** What a job keeps in the top view; the rest of the parts are the looking ones. */
const IN_A_JOB: Record<Exclude<FocusJob, 'looking' | 'sheet'>, Partial<FocusParts>> = {
  drawing: {
    stepSwitcher: 'hidden',
    pictureChip: 'credit',
    pencil: 'filled',
    magnet: 'shown',
    undoRedo: 'undo',
    wipe: 'shown',
    layers: 'hidden',
    zoom: 'hidden',
    otherHandles: 'hidden',
    lengthLabels: 'draft',
    bottomBar: 'drawing',
  },
  dragging: {
    stepSwitcher: 'hidden',
    pictureChip: 'credit',
    pencil: 'hidden',
    magnet: 'hidden',
    undoRedo: 'hidden',
    layers: 'hidden',
    zoom: 'hidden',
    otherHandles: 'hidden',
    bottomBar: 'status',
  },
  moving: {
    stepSwitcher: 'hidden',
    pictureChip: 'credit',
    pencil: 'hidden',
    magnet: 'hidden',
    undoRedo: 'hidden',
    layers: 'hidden',
    zoom: 'hidden',
    otherHandles: 'hidden',
    bottomBar: 'status',
  },
  sizing: {
    stepSwitcher: 'hidden',
    pictureChip: 'credit',
    pencil: 'hidden',
    magnet: 'hidden',
    undoRedo: 'hidden',
    layers: 'hidden',
    zoom: 'hidden',
    otherHandles: 'hidden',
    // The bar's status line stays on every screen: a refused step says why there (`T-M05-002`).
    bottomBar: 'status',
  },
  // Type the size (part c): the card holds the numbers and their refusal; the foot is the slim pill
  // with Place roof. Undo and Redo step aside: the rectangle is not in the history until placed.
  typing: {
    stepSwitcher: 'hidden',
    pictureChip: 'credit',
    pencil: 'hidden',
    magnet: 'hidden',
    undoRedo: 'hidden',
    layers: 'hidden',
    otherHandles: 'hidden',
    // The rectangle's own lengths show; the other roofs' would crowd it at a shared wall.
    lengthLabels: 'draft',
    bottomBar: 'drawing',
  },
  // Your picture's card (`T-M05-002d`, board 2.1, 4.1): the card is the job — its picture shows,
  // the chip steps down to its credit, the foot is the slim pill; Undo and the pencil stay.
  picture: {
    stepSwitcher: 'mark',
    pictureChip: 'credit',
    otherHandles: 'hidden',
    bottomBar: 'drawing',
  },
};

/** The 3D view holds no drawing tool, no handle and no length label (`T-M05-002`, part a). */
const IN_3D: Partial<FocusParts> = {
  pencil: 'hidden',
  magnet: 'hidden',
  otherHandles: 'hidden',
  lengthLabels: 'hidden',
};

const EDIT_PARTS: Partial<FocusParts> = {
  pencil: 'hidden',
  magnet: 'hidden',
  wipe: 'hidden',
  undoRedo: 'hidden',
  otherHandles: 'hidden',
};

function partsOfJob(facts: FocusFacts): FocusParts {
  const job = facts.canEdit ? facts.job : 'looking';
  if (facts.view !== 'top') {
    const sheet: Partial<FocusParts> =
      job === 'sheet'
        ? { stepSwitcher: 'mark', pictureChip: 'credit', layers: 'switch', bottomBar: 'hidden' }
        : {};
    return { ...LOOKING_TOP, ...IN_3D, sideViews: facts.hasRoof ? 'shown' : 'hidden', ...sheet };
  }
  if (job === 'looking' || job === 'sheet') return LOOKING_TOP;
  const parts = { ...LOOKING_TOP, ...IN_A_JOB[job] };
  // On a phone the slider, or the keyboard, takes the low screen: the compass steps aside.
  return (job === 'sizing' || job === 'typing') && facts.phone
    ? { ...parts, compass: 'hidden' }
    : parts;
}

/** Which parts the studio shows for the job in hand. */
export function focusOf(facts: FocusFacts): FocusParts {
  const parts = partsOfJob(facts);
  const own = facts.canEdit ? parts : { ...parts, ...EDIT_PARTS };
  const stepSwitcher =
    own.stepSwitcher === 'hidden' && facts.saveFailed ? 'mark' : own.stepSwitcher;
  return { ...own, stepSwitcher };
}
