import { EMPTY_STUDIO_DOCUMENT, type StudioDocument } from '../../src/studio/document';
import type { GroundPoint } from '../../src/studio/ground';
import { roofStepAfter } from '../../src/studio/roof-step';
import {
  ROOF_STEP_START,
  type RoofStepEvent,
  type RoofStepState,
} from '../../src/studio/roof-step-state';

/** The roof step's tests: events run over one design, as the studio runs them. */

export const p = (east: number, north: number): GroundPoint => ({ east, north });
export const STAMP = { source: 'google', takenOn: '2025-10-04' };

/** Events run in order over one design, each commit becoming the design: as the studio does. */
export function run(events: RoofStepEvent[], from: StudioDocument = EMPTY_STUDIO_DOCUMENT) {
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

export const CLOSE = { kind: 'close', id: 'roof-1', tracedOn: 'sky', stamp: STAMP } as const;
/** Four corners of an 8 m by 6 m roof, and Close shape. */
export const RECTANGLE: RoofStepEvent[] = [
  { kind: 'draw', magnet: true },
  { kind: 'tap', at: p(0, 0), system: 'metric' },
  { kind: 'tap', at: p(8, 0), system: 'metric' },
  { kind: 'tap', at: p(8, 6), system: 'metric' },
  { kind: 'tap', at: p(0, 6), system: 'metric' },
  CLOSE,
];
export const drawn = run(RECTANGLE).document;
