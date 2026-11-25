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
  /** Roofs or the material picker is open (`T-M05-002`, part e); a reader may open them too. */
  'roofs',
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
  open: { readonly roofs: boolean; readonly sheet: boolean; readonly picture: boolean },
): FocusJob {
  if (open.roofs) return 'roofs';
  if (open.sheet) return 'sheet';
  return open.picture ? 'picture' : step;
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
  /** The pencil: it draws; `filled` while it draws. */
  readonly pencil: 'shown' | 'filled' | 'hidden';
  /** The Roofs button with the roofs' count, once a roof stands; a reader may open it too. */
  readonly roofs: 'shown' | 'hidden';
  /**
   * The magnet, in the left tool column: while a corner is drawn, and — `picked` — while a roof is picked,
   * for the drags to come. A drag in hand keeps it as it was set (Alt frees one move).
   */
  readonly magnet: 'shown' | 'picked' | 'hidden';
  /** Undo and Redo, or — while drawing, where Undo takes off a corner — Undo alone. */
  readonly undoRedo: 'shown' | 'undo' | 'hidden';
  /** The trash beside Undo that wipes every corner of the drawing. */
  readonly wipe: 'shown' | 'hidden';
  /** The layers and the 2D/3D switch, or the switch alone. */
  readonly layers: 'shown' | 'switch' | 'hidden';
  /** Zoom in and Zoom out. */
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
  roofs: 'shown',
  magnet: 'picked',
  undoRedo: 'shown',
  wipe: 'hidden',
  layers: 'shown',
  zoom: 'shown',
  compass: 'shown',
  otherHandles: 'picked',
  lengthLabels: 'all',
  bottomBar: 'main',
};

/** What a job keeps in the top view; the rest of the parts are the looking ones. */
const IN_A_JOB: Record<Exclude<FocusJob, 'looking' | 'sheet' | 'roofs'>, Partial<FocusParts>> = {
  drawing: {
    stepSwitcher: 'hidden',
    pictureChip: 'credit',
    roofs: 'hidden',
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
    roofs: 'hidden',
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
    roofs: 'hidden',
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
    roofs: 'hidden',
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
    roofs: 'hidden',
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

/** The 3D view holds no handle and no length label (`T-M05-002`, part a). */
const IN_3D: Partial<FocusParts> = {
  magnet: 'hidden',
  otherHandles: 'hidden',
  lengthLabels: 'hidden',
};

/**
 * Roofs, the material picker and a roof's sheet open from the foot on every screen, in the bar's
 * place: the bar steps aside. On a phone the sheet spans the foot, and the tools step aside too
 * (board 6.1); on a desktop it stands between the tool columns, and they stay.
 */
const ROOFS_ON_PHONE: Partial<FocusParts> = {
  pencil: 'hidden',
  roofs: 'hidden',
  undoRedo: 'hidden',
  layers: 'hidden',
  zoom: 'hidden',
  bottomBar: 'hidden',
};

const ROOFS_ON_DESKTOP: Partial<FocusParts> = { bottomBar: 'hidden' };

/** The jobs that open from the foot. */
const AT_THE_FOOT: readonly FocusJob[] = ['roofs', 'sheet'];

const EDIT_PARTS: Partial<FocusParts> = {
  magnet: 'hidden',
  wipe: 'hidden',
  undoRedo: 'hidden',
  otherHandles: 'hidden',
};

function partsOfJob(facts: FocusFacts): FocusParts {
  const job = facts.canEdit || facts.job === 'roofs' ? facts.job : 'looking';
  const atFoot = AT_THE_FOOT.includes(job);
  const roofs = atFoot ? (facts.phone ? ROOFS_ON_PHONE : ROOFS_ON_DESKTOP) : {};
  if (facts.view !== 'top') {
    const sheet: Partial<FocusParts> =
      job === 'sheet'
        ? { stepSwitcher: 'mark', pictureChip: 'credit', layers: 'switch', bottomBar: 'hidden' }
        : {};
    return {
      ...LOOKING_TOP,
      ...IN_3D,
      ...sheet,
      ...roofs,
    };
  }
  if (job === 'roofs' || job === 'sheet') return { ...LOOKING_TOP, ...roofs };
  if (job === 'looking') return LOOKING_TOP;
  const parts = { ...LOOKING_TOP, ...IN_A_JOB[job] };
  // On a phone the slider, or the keyboard, takes the low screen: the compass steps aside.
  return (job === 'sizing' || job === 'typing') && facts.phone
    ? { ...parts, compass: 'hidden' }
    : parts;
}

/** Which parts the studio shows for the job in hand. */
export function focusOf(facts: FocusFacts): FocusParts {
  const parts = partsOfJob(facts);
  // Roofs has nothing to open until a roof stands. A reader draws nothing, and opens Roofs.
  const roofs = facts.hasRoof ? parts.roofs : 'hidden';
  const own = facts.canEdit
    ? { ...parts, roofs }
    : { ...parts, ...EDIT_PARTS, pencil: 'hidden' as const, roofs };
  const stepSwitcher =
    own.stepSwitcher === 'hidden' && facts.saveFailed ? 'mark' : own.stepSwitcher;
  return { ...own, stepSwitcher };
}
