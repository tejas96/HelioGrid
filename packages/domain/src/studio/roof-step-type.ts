import type { MeasurementSystem } from '../format/pack';
import type { StudioDocument } from './document';
import {
  idle,
  type RoofStepEvent,
  type RoofStepOutcome,
  type RoofStepState,
  stay,
} from './roof-step-state';
import { typedInUnits, typedPair, typedResult, typedRoof, typedStart } from './roof-type';

/**
 * The roof step's Type the size (`T-M05-002`, part c): the card opens from looking, or from a
 * drawing with no corner yet; its numbers change; Place roof stands the rectangle as one change.
 * The reducer (`roof-step.ts`) routes each event here.
 */

type Typing = Extract<RoofStepState, { kind: 'typing' }>;

/** The card opens: from looking, or from a drawing not begun (its first corner takes the card away). */
export function typingOpened(
  state: RoofStepState,
  event: Extract<RoofStepEvent, { kind: 'type_size' }>,
  document: StudioDocument,
): RoofStepOutcome {
  const fromDrawing = state.kind === 'drawing' && state.corners.length === 0;
  if (state.kind !== 'idle' && !fromDrawing) return stay(state);
  return stay({ kind: 'typing', ...typedStart(document.roofs, event.start, event.system) });
}

export function typingEntered(
  state: Typing,
  event: Extract<RoofStepEvent, { kind: 'type_entry' }>,
): RoofStepOutcome {
  return stay({
    ...state,
    length: event.length ?? state.length,
    width: event.width ?? state.width,
    pair: null,
  });
}

export function typingPaired(state: Typing, text: string): RoofStepOutcome {
  return stay({ ...state, ...typedPair(state, text) });
}

export function typingInUnits(
  state: Typing,
  from: MeasurementSystem,
  to: MeasurementSystem,
): RoofStepOutcome {
  return from === to ? stay(state) : stay({ ...state, ...typedInUnits(state, from, to) });
}

/** Place roof: the rectangle stands, picked, as one change; a refused card stays as it is. */
export function typingPlaced(
  state: Typing,
  event: Extract<RoofStepEvent, { kind: 'place' }>,
  document: StudioDocument,
): RoofStepOutcome {
  const result = typedResult(state, document, event.system);
  if (result.kind !== 'ready') return stay(state);
  // The first roof keeps the picture it stands on (M04-10), as a drawn one does.
  const first = document.roofs.length === 0 && document.drawnOn === null;
  return {
    state: idle(
      {
        kind: 'placed',
        onPicture: event.stamp !== null,
        beside: state.place.kind === 'beside' ? state.place.roof : null,
      },
      document.roofs.length,
    ),
    commit: {
      ...document,
      roofs: [...document.roofs, typedRoof(result.corners, event.id)],
      drawnOn: first ? event.stamp : document.drawnOn,
    },
  };
}
