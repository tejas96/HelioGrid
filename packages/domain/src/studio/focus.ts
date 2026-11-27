import type { FocusJob } from './focus-job';
import type { UndoSlots } from './undo-slots';
import type { StudioView } from './views';

/**
 * Focus mode (`T-M05-002`, part b): while a person does one job — draws, drags, sets a length or
 * has a roof's sheet open — every part of the studio that job does not use steps aside, and comes
 * back when the job ends. In the top view the picture never hides: a job keeps its thumb. The 3D
 * view's head keeps only the save mark and the compass, and LiDAR (`T-M05-002g`) keeps only what
 * it needs. The screen fades each part in and out; this file alone decides which.
 */

/** What the studio shows of each part. `hidden` steps aside; every other value is on screen. */
export interface FocusParts {
  /**
   * The steps and the save mark in their pill. `mark`: the save mark alone — a roof's sheet keeps
   * it, and any job keeps it for a save that failed.
   */
  readonly stepSwitcher: 'shown' | 'mark' | 'hidden';
  /** The picture button whole, its thumb alone while a job is in hand, or none in 3D. */
  readonly pictureChip: 'shown' | 'thumb' | 'hidden';
  /** The pencil: it draws; `filled` while it draws. */
  readonly pencil: 'shown' | 'filled' | 'hidden';
  /** The Roofs button with the roofs' count, once a roof stands; a reader may open it too. */
  readonly roofs: 'shown' | 'hidden';
  /**
   * The magnet, in the left tool column: while a corner is drawn, and — `picked` — while a roof is picked,
   * for the drags to come. A drag in hand keeps it as it was set (Alt frees one move).
   */
  readonly magnet: 'shown' | 'picked' | 'hidden';
  /** Undo: once it has come (`undoSlotsOf`), while the job uses it. */
  readonly undo: 'shown' | 'hidden';
  /** Redo: once something was undone, and never while drawing, where Undo takes off a corner. */
  readonly redo: 'shown' | 'hidden';
  /** The trash beside Undo that wipes every corner of the drawing. */
  readonly wipe: 'shown' | 'hidden';
  /**
   * The view menu and the 2D/3D switch; the switch alone; or the menu alone, before a roof stands,
   * when 3D has nothing to show.
   */
  readonly layers: 'shown' | 'switch' | 'menu' | 'hidden';
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
  /** The LiDAR button in the right column, once a roof stands; pressed while LiDAR is on. */
  readonly lidar: 'shown' | 'hidden';
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
  /** Which of Undo and Redo have come (`undoSlotsOf`). */
  readonly slots: UndoSlots;
  /** LiDAR is on: the 3D view shows the scan, with LiDAR's own head and foot. */
  readonly lidar: boolean;
  /** Saving needs the person — offline, failed, refused or saved first by another: its mark shows. */
  readonly saveAsks: boolean;
}

const LOOKING_TOP: FocusParts = {
  stepSwitcher: 'shown',
  pictureChip: 'shown',
  pencil: 'shown',
  roofs: 'shown',
  magnet: 'picked',
  undo: 'shown',
  redo: 'shown',
  wipe: 'hidden',
  layers: 'shown',
  zoom: 'shown',
  compass: 'shown',
  otherHandles: 'picked',
  lengthLabels: 'all',
  bottomBar: 'main',
  lidar: 'shown',
};

/** What a job keeps in the top view; the rest of the parts are the looking ones. */
const IN_A_JOB: Record<
  Exclude<FocusJob, 'looking' | 'sheet' | 'roofs' | 'menu'>,
  Partial<FocusParts>
> = {
  drawing: {
    stepSwitcher: 'hidden',
    pictureChip: 'thumb',
    roofs: 'hidden',
    pencil: 'filled',
    magnet: 'shown',
    undo: 'shown',
    redo: 'hidden',
    wipe: 'shown',
    layers: 'hidden',
    zoom: 'hidden',
    otherHandles: 'hidden',
    lengthLabels: 'draft',
    bottomBar: 'drawing',
  },
  dragging: {
    stepSwitcher: 'hidden',
    pictureChip: 'thumb',
    roofs: 'hidden',
    pencil: 'hidden',
    magnet: 'hidden',
    undo: 'hidden',
    redo: 'hidden',
    layers: 'hidden',
    zoom: 'hidden',
    otherHandles: 'hidden',
    bottomBar: 'status',
  },
  moving: {
    stepSwitcher: 'hidden',
    pictureChip: 'thumb',
    roofs: 'hidden',
    pencil: 'hidden',
    magnet: 'hidden',
    undo: 'hidden',
    redo: 'hidden',
    layers: 'hidden',
    zoom: 'hidden',
    otherHandles: 'hidden',
    bottomBar: 'status',
  },
  sizing: {
    stepSwitcher: 'hidden',
    pictureChip: 'thumb',
    roofs: 'hidden',
    pencil: 'hidden',
    magnet: 'hidden',
    undo: 'hidden',
    redo: 'hidden',
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
    pictureChip: 'thumb',
    roofs: 'hidden',
    pencil: 'hidden',
    magnet: 'hidden',
    undo: 'hidden',
    redo: 'hidden',
    layers: 'hidden',
    otherHandles: 'hidden',
    // The rectangle's own lengths show; the other roofs' would crowd it at a shared wall.
    lengthLabels: 'draft',
    bottomBar: 'drawing',
  },
  // Your picture's card (`T-M05-002d`, board 2.1, 4.1): the card is the job — its picture shows,
  // the picture steps down to its thumb, the foot is the slim pill; Undo and the pencil stay.
  picture: {
    stepSwitcher: 'mark',
    pictureChip: 'thumb',
    otherHandles: 'hidden',
    bottomBar: 'drawing',
  },
};

/**
 * The 3D view holds no handle and no length label (`T-M05-002`, part a); its head keeps the save
 * mark and the compass alone — the steps and the picture are the top view's (`T-M05-002g`).
 */
const IN_3D: Partial<FocusParts> = {
  stepSwitcher: 'mark',
  pictureChip: 'hidden',
  magnet: 'hidden',
  otherHandles: 'hidden',
  lengthLabels: 'hidden',
};

/**
 * LiDAR on (`T-M05-002g`, board frame 5): only what LiDAR needs — Undo and Redo once something
 * changed; Sun, LiDAR and the top view; the compass. No save mark unless saving needs the person,
 * no Roofs, no View, no zoom (a pinch or the wheel zooms); its own head and foot.
 */
const WITH_LIDAR: Partial<FocusParts> = {
  stepSwitcher: 'hidden',
  pictureChip: 'hidden',
  pencil: 'hidden',
  roofs: 'hidden',
  magnet: 'hidden',
  wipe: 'hidden',
  layers: 'switch',
  zoom: 'hidden',
  otherHandles: 'hidden',
  lengthLabels: 'hidden',
  bottomBar: 'hidden',
  lidar: 'shown',
};

/**
 * Roofs, the material picker and a roof's sheet open from the foot on every screen, in the bar's
 * place: the bar steps aside. On a phone the sheet spans the foot, and the tools step aside too
 * (board 6.1); on a desktop it stands between the tool columns, and they stay.
 */
const ROOFS_ON_PHONE: Partial<FocusParts> = {
  lidar: 'hidden',
  magnet: 'hidden',
  wipe: 'hidden',
  pencil: 'hidden',
  roofs: 'hidden',
  undo: 'hidden',
  redo: 'hidden',
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
  undo: 'hidden',
  redo: 'hidden',
  otherHandles: 'hidden',
};

/** The jobs a reader may open too: they only show. */
const OPEN_TO_READERS: readonly FocusJob[] = ['roofs', 'menu'];

/** What a job that opens at the foot takes from the other parts. */
function atTheFoot(job: FocusJob, phone: boolean): Partial<FocusParts> {
  if (AT_THE_FOOT.includes(job)) return phone ? ROOFS_ON_PHONE : ROOFS_ON_DESKTOP;
  // A menu opens at the foot only on a phone; beside its button nothing else moves.
  return job === 'menu' && phone ? ROOFS_ON_PHONE : {};
}

function partsOfJob(facts: FocusFacts): FocusParts {
  if (facts.lidar && facts.view !== 'top') return { ...LOOKING_TOP, ...WITH_LIDAR };
  const job = facts.canEdit || OPEN_TO_READERS.includes(facts.job) ? facts.job : 'looking';
  const roofs = atTheFoot(job, facts.phone);
  if (facts.view !== 'top') {
    const sheet: Partial<FocusParts> =
      job === 'sheet' ? { layers: 'switch', lidar: 'hidden', bottomBar: 'hidden' } : {};
    return {
      ...LOOKING_TOP,
      ...IN_3D,
      ...sheet,
      ...roofs,
    };
  }
  if (job === 'roofs' || job === 'sheet' || job === 'menu') return { ...LOOKING_TOP, ...roofs };
  if (job === 'looking') return LOOKING_TOP;
  const parts = { ...LOOKING_TOP, lidar: 'hidden' as const, ...IN_A_JOB[job] };
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
  // 3D has nothing to show before a roof stands: the view menu stays, the switch waits.
  const layers = facts.hasRoof || parts.layers !== 'shown' ? parts.layers : 'menu';
  // LiDAR opens on the 3D of the roofs: it waits for a roof too.
  const lidar = facts.hasRoof ? parts.lidar : 'hidden';
  const slotted = {
    ...parts,
    roofs,
    layers,
    lidar,
    undo: facts.slots.undo ? parts.undo : ('hidden' as const),
    redo: facts.slots.redo ? parts.redo : ('hidden' as const),
  };
  const own = facts.canEdit ? slotted : { ...slotted, ...EDIT_PARTS, pencil: 'hidden' as const };
  const asks = facts.saveFailed || (facts.lidar && facts.saveAsks);
  const stepSwitcher = own.stepSwitcher === 'hidden' && asks ? 'mark' : own.stepSwitcher;
  return { ...own, stepSwitcher };
}
