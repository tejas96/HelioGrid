import {
  type History,
  historyAfter,
  type LidarEvent,
  type PictureChoice,
  pictureUpdatedOver,
  type RoofStepEvent,
  type RoofStepState,
  type SkyPictureRead,
  type StudioDocument,
  type StudioView,
  type ViewPlace,
} from '@heliogrid/domain';
import type { StudioPicture } from './studio-document-state';

/**
 * The camera's view picked (`T-M05-002`, part a): a view that waits for a roof is not taken,
 * whoever asks for it. LiDAR is 3D only (`T-M05-002g`): the top view turns it off, and the LiDAR
 * button brings it back. A new roof is drawn, or typed, in the top view only: leaving it drops the
 * draft. A roof's sheet stays open in either view: its height in hand is kept first, and a height
 * that is refused keeps the view, with its reason showing.
 */
export function seeOf(input: {
  readonly views: readonly ViewPlace[];
  readonly step: { readonly current: RoofStepState };
  readonly act: (event: RoofStepEvent) => void;
  readonly sheet: { readonly viewing: (next: StudioView) => boolean };
  readonly setView: (next: StudioView) => void;
  readonly setSeen3d: (seen: boolean) => void;
  readonly lidarAct: (event: LidarEvent) => void;
  /** The sun and its shade live in 3D: the top view closes the sun bar. */
  readonly closeSun: () => void;
}): (next: StudioView) => void {
  return (next) => {
    if (!input.views.some((place) => place.view === next && place.lock === null)) return;
    if (next === 'top') input.lidarAct({ kind: 'off' });
    const held = input.step.current.kind;
    if (next !== 'top' && (held === 'drawing' || held === 'typing')) input.act({ kind: 'cancel' });
    if (next === '3d') input.setSeen3d(true);
    if (!input.sheet.viewing(next)) return;
    if (next === 'top') input.closeSun();
    input.setView(next);
  };
}

/** The picture the roofs were drawn on is newer now (board 5.1). */
export function pictureUpdatedFor(
  document: StudioDocument | null,
  sky: SkyPictureRead,
  picture: StudioPicture,
): boolean {
  return pictureUpdatedOver(
    document?.drawnOn ?? null,
    sky.kind === 'ready' ? sky.takenOn : null,
    picture.kind === 'own' ? picture.takenOn : null,
  );
}

/**
 * Drawing happens in the top view only: the camera flies there first. A roof's sheet is the 3D
 * view's: its height is kept and it closes, as when the top view is picked; a height that is
 * refused keeps the sheet, and nothing is drawn.
 */
export function drawOf(
  sheet: { readonly moves: { readonly done: () => boolean } },
  setView: (next: StudioView) => void,
  draw: () => void,
): () => void {
  return () => {
    if (!sheet.moves.done()) return;
    setView('top');
    draw();
  };
}

/** A picture picked: one change of the design, none when it is the one shown. */
export function pickPictureOf(
  latest: { readonly current: History<StudioDocument> | null },
  change: (next: History<StudioDocument>) => void,
): (choice: PictureChoice) => void {
  return (choice) => {
    const at = latest.current;
    if (at === null || at.present.picture === choice) return;
    change(historyAfter(at, { ...at.present, picture: choice }));
  };
}

/** Roofs and a roof's sheet close; `false` when the sheet keeps a refused height in hand. */
export function allClosed(
  panel: { readonly moves: { readonly closePanel: () => void } },
  sheet: { readonly moves: { readonly done: () => boolean } },
): boolean {
  panel.moves.closePanel();
  return sheet.moves.done();
}
