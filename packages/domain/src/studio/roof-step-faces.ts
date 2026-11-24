import type { StudioDocument } from './document';
import { draftGhost } from './roof-draw';
import { handFacesKept } from './roof-hand-faces';
import { edgesCross, ROOF_CORNERS_MIN } from './roof-shape';
import { drawing } from './roof-step-draw';
import {
  idle,
  type RoofStepEvent,
  type RoofStepOutcome,
  type RoofStepState,
  stay,
} from './roof-step-state';

/**
 * The faces of an Any-shape roof drawn by hand in the roof step (`T-M05-002`, part e, E082, board
 * 5.10), with the roof's own drawing tool: a face closes onto its roof as one change, with Undo,
 * and the next face starts at once; once the faces cover the roof, drawing ends and it stands in
 * them.
 */

/** Start drawing roof `roof`'s next face: from looking, or from drawing anything else. */
export function facesDrawn(
  state: RoofStepState,
  event: Extract<RoofStepEvent, { kind: 'draw_faces' }>,
  document: StudioDocument,
): RoofStepOutcome {
  if (document.roofs[event.roof] === undefined) return stay(state);
  if (state.kind === 'drawing' && state.faces === event.roof) return stay(state);
  if (state.kind !== 'idle' && state.kind !== 'drawing') return stay(state);
  return stay(drawing(event.magnet, [], false, event.roof));
}

/** Close shape, or a tap on the first corner, while a face is drawn. */
export function faceClosed(
  state: Extract<RoofStepState, { kind: 'drawing' }>,
  event: Extract<RoofStepEvent, { kind: 'close' }>,
): RoofStepOutcome {
  const roof = state.faces;
  if (roof === undefined || event.face === undefined) return stay(state);
  const ghost = event.ghost ? draftGhost(state.corners) : null;
  const corners = ghost === null ? state.corners : [...state.corners, ghost];
  if (corners.length < ROOF_CORNERS_MIN) return stay({ ...state, refused: 'too_few_corners' });
  if (edgesCross(corners)) return stay({ ...state, refused: 'would_cross' });
  const made = event.face(corners);
  if (made.kind === 'refused') return stay({ ...state, refused: made.refusal });
  const commit = made.document;
  if (!made.whole) return { state: drawing(state.magnet, [], false, roof), commit };
  const held = commit.roofs[roof];
  const count = held === undefined ? 0 : handFacesKept(held).length;
  return { state: idle({ kind: 'faces_drawn', roof, count }, roof), commit };
}
