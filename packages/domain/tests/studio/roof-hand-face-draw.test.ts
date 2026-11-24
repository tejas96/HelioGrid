import { describe, expect, it } from 'vitest';
import type { Roof, StudioDocument } from '../../src/studio/document';
import type { GroundPoint } from '../../src/studio/ground';
import { roofBuilt, roofSlopeDeg } from '../../src/studio/roof-built';
import { handFaceClosed } from '../../src/studio/roof-hand-face-set';
import { handFacesDrawn, handFacesKept } from '../../src/studio/roof-hand-faces';
import { roofStepAfter } from '../../src/studio/roof-step';
import {
  ROOF_STEP_START,
  type RoofStepEvent,
  type RoofStepState,
} from '../../src/studio/roof-step-state';
import { roofBarOf } from '../../src/studio/roof-step-view';
import { roofTopMarksOf } from '../../src/studio/roof-top-marks-build';
import { roofsWorked } from '../../src/studio/roof-worked';
import { anyRoof, faceOf, NORTH, NORTH_HALF, ROOF, SOUTH_HALF } from './roof-hand-face-support';
import { box, designOf, FACTS, p } from './roof-meet-support';

/**
 * Any shape's faces drawn by hand (`T-M05-002`, part e, E082, board 5.10): a face drawn with the
 * roof's own drawing tool closes onto its roof with the roof's slope and a low side the studio
 * picks; the next face starts at once; once the faces cover the roof it stands in them. The magnet
 * pulls a face's corners to the outline and the faces drawn before; a face may not leave its roof
 * or lie over another face.
 */

/** The studio's events run over one design; a close asks the kernel of the design as it stands. */
function drive(start: StudioDocument, steps: readonly (RoofStepEvent | 'close')[]) {
  let state: RoofStepState = ROOF_STEP_START;
  let document = start;
  let commits = 0;
  for (const step of steps) {
    const now = document;
    const event: RoofStepEvent =
      step === 'close'
        ? {
            kind: 'close',
            id: 'unused',
            tracedOn: 'sky',
            stamp: null,
            ghost: false,
            face: (corners) => handFaceClosed(now, 0, corners, FACTS, NORTH),
          }
        : step;
    const outcome = roofStepAfter(state, event, document);
    state = outcome.state;
    if (outcome.commit !== null) {
      document = outcome.commit;
      commits += 1;
    }
  }
  return { state, document, commits };
}

const tap = (at: GroundPoint): RoofStepEvent => ({ kind: 'tap', at, system: 'metric' });
const taps = (corners: readonly GroundPoint[]) => corners.map(tap);
const START: RoofStepEvent = { kind: 'draw_faces', roof: 0, magnet: true };

describe('drawing the faces in the roof step', () => {
  const design = designOf(anyRoof(ROOF));

  it('a face closed stands on its roof, with the roof’s slope and its eave as its low side', () => {
    const { document, state, commits } = drive(design, [START, ...taps(SOUTH_HALF), 'close']);
    expect(commits).toBe(1);
    const roof = document.roofs[0] as Roof;
    const slope = roofSlopeDeg(roof, FACTS);
    expect(slope).toBeGreaterThan(0);
    expect(roof.shape?.faces).toEqual([
      { corners: SOUTH_HALF, slope: { degrees: slope, setBy: 'system' }, lowSide: 0 },
    ]);
    // The next face starts at once: drawing again, on the same roof, with no corner yet.
    expect(state).toMatchObject({ kind: 'drawing', faces: 0, corners: [] });
    expect(handFacesDrawn(roof)).toBe('part');
  });

  it('the pill names the face being drawn, and a face offers no size to type', () => {
    const { document, state } = drive(design, [START, ...taps(SOUTH_HALF), 'close']);
    expect(roofBarOf(state, document, false, 'metric')).toMatchObject({
      kind: 'drawing',
      face: 2,
      hint: false,
    });
  });

  it('once the faces cover the roof, drawing ends and the roof stands in them', () => {
    const { document, state, commits } = drive(design, [
      START,
      ...taps(SOUTH_HALF),
      'close',
      ...taps(NORTH_HALF),
      'close',
    ]);
    expect(commits).toBe(2);
    expect(state).toMatchObject({ kind: 'idle', roof: 0, said: { kind: 'faces_drawn', count: 2 } });
    const built = roofBuilt(document.roofs[0] as Roof, FACTS);
    expect(built.built).toBe('any');
    expect(built.faces.map((face) => Math.round(face.downDeg))).toEqual([180, 0]);
  });

  it('the magnet pulls a corner tapped near the outline’s corner onto it', () => {
    const { document } = drive(design, [
      START,
      ...taps([p(0.3, -0.2), p(8, 0), p(8, 2), p(0, 2)]),
      'close',
    ]);
    expect(document.roofs[0]?.shape?.faces?.[0]?.corners[0]).toEqual(p(0, 0));
  });

  it('the magnet pulls a corner to the edge of a face drawn before, and names that face', () => {
    const { state } = drive(design, [
      START,
      ...taps(SOUTH_HALF),
      'close',
      tap(p(0, 2)),
      { kind: 'hover', at: p(4, 2.3) },
    ]);
    expect(state.kind === 'drawing' ? state.spot : null).toMatchObject({
      point: p(4, 2),
      snap: { kind: 'edge_of', owner: { kind: 'face', roof: 0, face: 0 } },
    });
  });

  it('a corner tapped off the roof is refused where it falls', () => {
    const { state } = drive(design, [START, tap(p(0, 0)), tap(p(9.5, 1))]);
    expect(state).toMatchObject({ kind: 'drawing', corners: [p(0, 0)], refused: 'outside_roof' });
  });

  it('a face over one drawn before cannot close: it says why, and nothing is saved', () => {
    const { state, commits } = drive(design, [
      START,
      ...taps(SOUTH_HALF),
      'close',
      ...taps([p(0, 1), p(8, 1), p(8, 4), p(0, 4)]),
      'close',
    ]);
    expect(commits).toBe(1);
    expect(state).toMatchObject({ kind: 'drawing', refused: 'over_face' });
  });

  it('stopped half way, the corners go; the one Undo after takes the face up again', () => {
    const stopped = drive(design, [START, tap(p(0, 0)), tap(p(8, 0)), { kind: 'cancel' }]);
    expect(stopped.state.kind).toBe('idle');
    const back = roofStepAfter(stopped.state, { kind: 'undo_corner' }, stopped.document);
    expect(back.state).toMatchObject({ kind: 'drawing', faces: 0, corners: [p(0, 0), p(8, 0)] });
  });

  it('an outline made bigger keeps its faces, which now cover part of it', () => {
    const bigger = anyRoof(box(0, 0, 8, 5), [faceOf(SOUTH_HALF), faceOf(NORTH_HALF)]);
    expect(handFacesDrawn(bigger)).toBe('part');
  });

  it('faces left stale by an outline made smaller are gone when the next face closes', () => {
    const smaller = designOf(anyRoof(box(0, 0, 7, 4), [faceOf(SOUTH_HALF)]));
    expect(handFacesKept(smaller.roofs[0] as Roof)).toEqual([]);
    const { document } = drive(smaller, [START, ...taps(box(0, 0, 7, 4)), 'close']);
    expect(document.roofs[0]?.shape?.faces).toHaveLength(1);
    expect(handFacesDrawn(document.roofs[0] as Roof)).toBe('whole');
  });
});

describe('the top view while the faces are drawn', () => {
  it('shows each face drawn, with the arrow down it, before the roof stands in them', () => {
    const part = designOf(anyRoof(ROOF, [faceOf(SOUTH_HALF)]));
    const [mark] = roofTopMarksOf(part, FACTS, roofsWorked(part, FACTS, NORTH), NORTH);
    expect(mark?.faces).toEqual([SOUTH_HALF]);
    expect(mark?.slopes).toHaveLength(1);
    // The arrow runs down to the south, the face's low side.
    const slope = mark?.slopes[0];
    expect((slope?.to.north ?? 0) < (slope?.from.north ?? 0)).toBe(true);
  });
});
