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
 * corner (or a new one from a +), which the helpers guide; `moving` is the whole roof, moved or
 * turned, which they do not.
 */
export const FOCUS_JOBS = ['looking', 'drawing', 'dragging', 'moving', 'sizing', 'sheet'] as const;
export type FocusJob = (typeof FOCUS_JOBS)[number];

const JOB_OF_STEP: Record<RoofStepState['kind'], FocusJob> = {
  idle: 'looking',
  drawing: 'drawing',
  sizing: 'sizing',
  dragging: 'dragging',
};

/**
 * The job the roof step has in hand. A drag holds a corner — or a new one from a + — which the
 * helpers guide, or the whole roof, moved or turned, which they do not. A roof's sheet is the
 * studio's own job, beside the roof step.
 */
export function focusJobOf(step: RoofStepState): FocusJob {
  if (step.kind === 'dragging' && gripCorner(step.grip) === null) return 'moving';
  return JOB_OF_STEP[step.kind];
}

/** What the studio shows of each part. `hidden` steps aside; every other value is on screen. */
export interface FocusParts {
  /** Back, the design's name and the save pill. `error`: only a save that failed. */
  readonly topBar: 'shown' | 'error' | 'hidden';
  readonly stepSwitcher: 'shown' | 'hidden';
  /** The picture chip whole, or its credit line alone. */
  readonly pictureChip: 'shown' | 'credit';
  /** The pencil that starts a drawing; `filled` while it draws. */
  readonly pencil: 'shown' | 'filled' | 'hidden';
  /** Square, Line up and Buildings, beside the pencil: while a corner is drawn or dragged. */
  readonly helperBar: 'shown' | 'hidden';
  readonly undoRedo: 'shown' | 'hidden';
  /** The + that starts another roof. */
  readonly addRoof: 'shown' | 'hidden';
  /** The layers and the 2D/3D switch, or the switch alone. */
  readonly layers: 'shown' | 'switch' | 'hidden';
  readonly sideViews: 'shown' | 'hidden';
  /** Zoom in, Zoom out and Back to the pin. */
  readonly zoom: 'shown' | 'hidden';
  /** The north arrow and the scale bar, or the north arrow alone. */
  readonly compass: 'shown' | 'north' | 'hidden';
  /** The corner dots, + dots and handles of the roofs not being changed: the picked roof's only. */
  readonly otherHandles: 'picked' | 'hidden';
  /** Which length labels show: all, the draft's, every one live, or none. */
  readonly lengthLabels: 'all' | 'draft' | 'hidden';
  /** The bottom bar: status and main button, Cancel and Close shape, the status alone, or none. */
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
  /** The last save failed: its pill shows whatever the job. */
  readonly saveFailed: boolean;
}

const LOOKING_TOP: FocusParts = {
  topBar: 'shown',
  stepSwitcher: 'shown',
  pictureChip: 'shown',
  pencil: 'shown',
  helperBar: 'hidden',
  undoRedo: 'shown',
  addRoof: 'shown',
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
    topBar: 'hidden',
    stepSwitcher: 'hidden',
    pictureChip: 'credit',
    pencil: 'filled',
    helperBar: 'shown',
    addRoof: 'hidden',
    layers: 'hidden',
    otherHandles: 'hidden',
    lengthLabels: 'draft',
    bottomBar: 'drawing',
  },
  dragging: {
    topBar: 'hidden',
    stepSwitcher: 'hidden',
    pictureChip: 'credit',
    pencil: 'hidden',
    helperBar: 'shown',
    undoRedo: 'hidden',
    addRoof: 'hidden',
    layers: 'hidden',
    zoom: 'hidden',
    otherHandles: 'hidden',
    bottomBar: 'status',
  },
  moving: {
    topBar: 'hidden',
    stepSwitcher: 'hidden',
    pictureChip: 'credit',
    pencil: 'hidden',
    undoRedo: 'hidden',
    addRoof: 'hidden',
    layers: 'hidden',
    zoom: 'hidden',
    otherHandles: 'hidden',
    bottomBar: 'status',
  },
  sizing: {
    topBar: 'hidden',
    stepSwitcher: 'hidden',
    pictureChip: 'credit',
    pencil: 'hidden',
    undoRedo: 'hidden',
    addRoof: 'hidden',
    layers: 'hidden',
    zoom: 'hidden',
    otherHandles: 'hidden',
    // The bar's status line stays on every screen: a refused step says why there (`T-M05-002`).
    bottomBar: 'status',
  },
};

/** The 3D view holds no drawing tool, no handle and no length label (`T-M05-002`, part a). */
const IN_3D: Partial<FocusParts> = {
  pencil: 'hidden',
  helperBar: 'hidden',
  addRoof: 'hidden',
  otherHandles: 'hidden',
  lengthLabels: 'hidden',
  compass: 'north',
};

const EDIT_PARTS: Partial<FocusParts> = {
  pencil: 'hidden',
  helperBar: 'hidden',
  undoRedo: 'hidden',
  addRoof: 'hidden',
  otherHandles: 'hidden',
};

function partsOfJob(facts: FocusFacts): FocusParts {
  const job = facts.canEdit ? facts.job : 'looking';
  if (facts.view !== 'top') {
    const sheet: Partial<FocusParts> =
      job === 'sheet'
        ? { stepSwitcher: 'hidden', pictureChip: 'credit', layers: 'switch', bottomBar: 'hidden' }
        : {};
    return { ...LOOKING_TOP, ...IN_3D, sideViews: facts.hasRoof ? 'shown' : 'hidden', ...sheet };
  }
  if (job === 'looking' || job === 'sheet') return LOOKING_TOP;
  const parts = { ...LOOKING_TOP, ...IN_A_JOB[job] };
  // On a phone the slider, or the keyboard, takes the low screen: the compass steps aside.
  return job === 'sizing' && facts.phone ? { ...parts, compass: 'hidden' } : parts;
}

/** Which parts the studio shows for the job in hand. */
export function focusOf(facts: FocusFacts): FocusParts {
  const parts = partsOfJob(facts);
  const own = facts.canEdit ? parts : { ...parts, ...EDIT_PARTS };
  const addRoof = own.addRoof === 'shown' && !facts.hasRoof ? 'hidden' : own.addRoof;
  const topBar = own.topBar === 'hidden' && facts.saveFailed ? 'error' : own.topBar;
  return { ...own, addRoof, topBar };
}
