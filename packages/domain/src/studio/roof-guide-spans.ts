import type { GroundPoint } from './ground';
import type { Guide } from './roof-snap';
import type { RoofStepState } from './roof-step-state';

/**
 * Guides as drawn (`T-M05-002`, part e): each guide the corner in hand is held on is a straight
 * line right across the map, so it shows past a finger and lines the corner up with what is far.
 */

/** A guide as drawn: from one ground point to another; faint when it does not hold the spot. */
export interface GuideSpan {
  readonly from: GroundPoint;
  readonly to: GroundPoint;
  readonly soft?: true;
}

/** How far each way a guide runs from its point, in metres: past every edge of the map. */
const GUIDE_REACH_M = 400;

/** A guide right across the map. */
export function fullSpanOf({ through, way, soft }: Guide): GuideSpan {
  return {
    from: {
      east: through.east - way.east * GUIDE_REACH_M,
      north: through.north - way.north * GUIDE_REACH_M,
    },
    to: {
      east: through.east + way.east * GUIDE_REACH_M,
      north: through.north + way.north * GUIDE_REACH_M,
    },
    ...(soft === true ? { soft: true as const } : {}),
  };
}

/** The guides of the corner in hand: the spot's while drawing, the corner's or roof's dragged. */
export function guideSpansOf(state: RoofStepState): readonly GuideSpan[] {
  const guides =
    state.kind === 'drawing'
      ? (state.spot?.guides ?? [])
      : state.kind === 'dragging'
        ? state.drag.guides
        : [];
  return guides.map(fullSpanOf);
}
