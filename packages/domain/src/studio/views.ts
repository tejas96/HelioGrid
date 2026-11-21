import type { StepLock } from './steps';

/**
 * The camera's views of the one model: the top view, the 3D view, and a side view from each
 * compass point. A roof's outline is drawn and changed in the top view only; 3D shows the result
 * and changes a roof's height in its sheet (`T-M05-002`, part a).
 */
export const STUDIO_VIEWS = ['top', '3d', 'north', 'east', 'south', 'west'] as const;
export type StudioView = (typeof STUDIO_VIEWS)[number];

/** The view the studio opens on: the flat top view, north up, where a roof is drawn. */
export const OPENING_VIEW: StudioView = 'top';

export interface ViewPlace {
  readonly view: StudioView;
  /** `null`: the view can be picked. */
  readonly lock: Extract<StepLock, 'needs_roof'> | null;
}

/**
 * The views on offer. A flat picture has no height, so before a roof stands the 3D view shows
 * nothing more than the top view — it waits, with its reason — and the side views, which would
 * show a line, are not offered. With a roof, every view is open.
 */
export function viewsOffered(roofClosed: boolean): readonly ViewPlace[] {
  if (roofClosed) return STUDIO_VIEWS.map((view) => ({ view, lock: null }));
  return [
    { view: 'top', lock: null },
    { view: '3d', lock: 'needs_roof' },
  ];
}
