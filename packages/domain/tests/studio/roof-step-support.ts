import type { StudioDocument } from '../../src/studio/document';
import { meetingOf } from '../../src/studio/roof-meet';
import { roofStepAfter } from '../../src/studio/roof-step';
import {
  ROOF_STEP_START,
  type RoofStepEvent,
  type RoofStepState,
} from '../../src/studio/roof-step-state';
import { type box, FACTS, p } from './roof-meet-support';

/** The roof step run over a design, event by event, as the studio's hook runs it. */
export function run(events: readonly RoofStepEvent[], from: StudioDocument) {
  let state: RoofStepState = ROOF_STEP_START;
  let document = from;
  let commits = 0;
  for (const event of events) {
    const outcome = roofStepAfter(state, event, document);
    state = outcome.state;
    if (outcome.commit !== null) {
      document = outcome.commit;
      commits += 1;
    }
  }
  return { state, document, commits };
}
export const tap = (east: number, north: number): RoofStepEvent => ({
  kind: 'tap',
  at: p(east, north),
  system: 'metric',
});
/** A roof drawn corner by corner and closed, placed by the kernel as the studio's hook asks it to. */
export const draw = (
  corners: ReturnType<typeof box>,
  design: StudioDocument,
  id = 'new',
  more: { readonly siteMaterial?: 'clay_tile' } = {},
): RoofStepEvent[] => [
  { kind: 'draw', magnet: false },
  ...corners.map((corner) => tap(corner.east, corner.north)),
  {
    kind: 'close',
    id,
    tracedOn: 'sky',
    stamp: null,
    ghost: false,
    placing: { meet: (outline) => meetingOf(design, outline, FACTS), facts: FACTS, ...more },
  },
];
export const saidOf = (state: RoofStepState) => (state.kind === 'idle' ? state.said : null);
