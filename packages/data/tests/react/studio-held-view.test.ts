import {
  EMPTY_STUDIO_DOCUMENT,
  type GroundBox,
  ROOF_STEP_START,
  type RoofStepEvent,
  type RoofStepState,
  type RoofsPanel,
  roofStepAfter,
} from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { heldViewOf } from '../../src/react/studio-held-view';

/**
 * The view held still while the bars change (`T-M05-002`): a corner tapped stays under the finger,
 * so the map never moves between two taps unless a bar would cover what is drawn.
 */

const ROOF: GroundBox = { west: 0, east: 10, south: 0, north: 8 };
const SHUT: RoofsPanel = { open: 'none' };
const ROOFS: RoofsPanel = { open: 'roofs', lit: null };
const DRAW: RoofStepEvent = { kind: 'draw', magnet: false };
const tapAt = (east: number, north: number): RoofStepEvent => ({
  kind: 'tap',
  at: { east, north },
  system: 'metric',
});

function stepAfter(events: readonly RoofStepEvent[]): RoofStepState {
  let state: RoofStepState = ROOF_STEP_START;
  for (const event of events) state = roofStepAfter(state, event, EMPTY_STUDIO_DOCUMENT).state;
  return state;
}

describe('heldViewOf', () => {
  it.each([
    ['drawing, no roof, no corner yet', null, [DRAW], SHUT, { clear: null }],
    [
      'drawing, one corner on open ground',
      null,
      [DRAW, tapAt(20, -4)],
      SHUT,
      {
        clear: { west: 20, east: 20, south: -4, north: -4 },
      },
    ],
    [
      'drawing beside a roof that may be off screen: only the corners drawn',
      ROOF,
      [DRAW, tapAt(20, -4)],
      SHUT,
      {
        clear: { west: 20, east: 20, south: -4, north: -4 },
      },
    ],
    ['drawing beside a roof, no corner yet', ROOF, [DRAW], SHUT, { clear: null }],
    ['Roofs or the picker open', ROOF, [], ROOFS, { clear: ROOF }],
    ['looking, nothing open', ROOF, [], SHUT, null],
    ['looking, no roof', null, [], SHUT, null],
  ] as const)('%s', (_, fit, events, panel, held) => {
    expect(heldViewOf(fit, stepAfter(events), panel)).toEqual(held);
  });
});
