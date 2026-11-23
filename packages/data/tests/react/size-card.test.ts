import {
  EMPTY_STUDIO_DOCUMENT,
  ROOF_STEP_START,
  type RoofStepEvent,
  type RoofStepState,
  roofStepAfter,
} from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { sizeCardIn } from '../../src/react/size-card';

/** The size card as the screen draws it (`T-M05-002c`): its preview, its switch and its marks. */

const START = { length: 10, width: 8 };
const OPEN: RoofStepEvent = { kind: 'type_size', start: START, system: 'metric' };

function cardAfter(events: readonly RoofStepEvent[]) {
  let state: RoofStepState = ROOF_STEP_START;
  for (const event of [OPEN, ...events]) {
    state = roofStepAfter(state, event, EMPTY_STUDIO_DOCUMENT).state;
  }
  return sizeCardIn(state, EMPTY_STUDIO_DOCUMENT, 'metric', 'slider');
}

describe('the size card view', () => {
  it.each([
    // what was typed → a preview drawn, the sliders' switch resting on the boxes
    ['nothing: the start size', [], true, false],
    ['a pair half typed', [{ kind: 'type_pair', text: '13x' }], false, true],
    ['a box that is not a number', [{ kind: 'type_pair', text: 'abc' }], false, true],
    ['a size past the sliders', [{ kind: 'type_pair', text: '60x8' }], true, true],
    ['a whole pair', [{ kind: 'type_pair', text: '13.2x8.6' }], true, false],
  ] as const)('%s', (_why, events, drawn, outside) => {
    const card = cardAfter(events as readonly RoofStepEvent[]);
    expect(card?.preview !== null).toBe(drawn);
    expect(card?.outside).toBe(outside);
  });

  it.each([
    // what was typed → each length reads "about"
    ['nothing: the market’s start size', [], [true, true, true, true]],
    ['a whole pair', [{ kind: 'type_pair', text: '13.2x8.6' }], [false, false, false, false]],
  ] as const)('%s', (_why, events, about) => {
    const card = cardAfter(events as readonly RoofStepEvent[]);
    expect(card?.preview?.about).toEqual(about);
  });

  it('marks the market’s start size on each slider', () => {
    expect(cardAfter([])?.slide.mark).toEqual(START);
  });
});
