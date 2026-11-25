import type { StudioScreen } from './studio-screen-view';

/** The moments a phone marks with a tap, as the studio stands now (`T-M05-002`, part b). */
export interface StudioMoments {
  /** The snap the spot or the corner in hand caught, by kind; `null` when none. */
  readonly snap: string | null;
  /** Why the step or the value in hand is refused; `null` when it is not. */
  readonly refused: string | null;
  /** The roof just closed: a new value for each close. */
  readonly closed: object | null;
  /** Which side of its tick a slider stands on: −1, 0 on it, 1; `null` with no slider. */
  readonly lengthSide: number | null;
  readonly heightSide: number | null;
}

export function studioMomentsOf(studio: StudioScreen): StudioMoments {
  const step = studio.roofStep;
  const snap = studio.draft?.spot?.snap ?? (step.kind === 'dragging' ? step.drag.snap : null);
  const refused =
    studio.draft?.spotRefusal ??
    (step.kind === 'drawing' ? step.refused : null) ??
    (studio.bar?.kind === 'roofs' ? studio.bar.live : null) ??
    studio.heightRefusal;
  const said = step.kind === 'idle' ? step.said : null;
  const length = studio.lengthBox;
  const sheet = studio.roofSheet;
  // A height pulled level is a snap too: named by the level, so each new one is felt once.
  const pulled = studio.heightPull === null ? null : `level ${studio.heightPull.levelM}`;
  return {
    snap: snap?.kind ?? pulled,
    refused,
    closed: said?.kind === 'closed' ? said : null,
    lengthSide:
      length === null ? null : Math.sign((length.typed ?? length.traced) - length.slide.mark),
    heightSide:
      sheet === null || !sheet.hasHeight
        ? null
        : Math.sign(sheet.height.metres - sheet.systemMetres),
  };
}

/** A slider that passed its tick: from one side to the other, or onto it. */
const crossed = (was: number | null, now: number | null) =>
  was !== null && now !== null && was !== now && (now === 0 || was !== 0);

/**
 * The tap a change of moments asks for: a short `impact` on a new refusal; a light `selection` on a
 * new snap, a close or a slider crossing its tick; `null` when nothing new happened.
 */
export function studioHapticOf(
  was: StudioMoments,
  now: StudioMoments,
): 'selection' | 'impact' | null {
  if (now.refused !== null && now.refused !== was.refused) return 'impact';
  const snapped = now.snap !== null && now.snap !== was.snap;
  const closed = now.closed !== null && now.closed !== was.closed;
  const ticked = crossed(was.lengthSide, now.lengthSide) || crossed(was.heightSide, now.heightSide);
  return snapped || closed || ticked ? 'selection' : null;
}
