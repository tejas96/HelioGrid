import {
  edgeLengths,
  entryRead,
  type GroundBox,
  type GroundPoint,
  type MeasurementSystem,
  type NumberEntry,
  type RoofStepEvent,
  type RoofStepState,
  roofArea,
  roofMiddle,
  roofsBox,
  type SizeCardArrival,
  type StudioDocument,
  type StudioView,
  sizeCardOnArrival,
  TYPED_SLIDE_MAX_M,
  TYPED_SLIDE_MIN_M,
  type TypedSize,
  typedCorners,
  typedResult,
} from '@heliogrid/domain';
import { type RefObject, useEffect, useRef } from 'react';
import type { SizeCardView } from './roof-step-view';
import type { StudioEditing, StudioPicture } from './studio-document-state';

/**
 * Type the size's card (`T-M05-002`, part c), as the roof step's hook hands it to the screen: its
 * numbers, the dashed rectangle and why it cannot stand; and the numbers following the reader's
 * metres or feet while it is open.
 */

const SIZE_STEP = { metric: 0.05, imperial: 0.0254 } as const;

/** Metres or feet changed while the size card is open (from another device): its numbers follow. */
export function useUnitsFollow(
  units: MeasurementSystem,
  step: RefObject<RoofStepState>,
  act: (event: RoofStepEvent) => void,
) {
  const before = useRef(units);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `act` reads the latest state by ref
  useEffect(() => {
    const from = before.current;
    before.current = units;
    if (from !== units && step.current.kind === 'typing')
      act({ kind: 'type_units', from, to: units });
  }, [units]);
}

export function sizeCardIn(
  state: RoofStepState,
  document: StudioDocument | null,
  units: MeasurementSystem,
  numberEntry: NumberEntry,
): SizeCardView | null {
  return state.kind === 'typing' && document !== null
    ? sizeCardOf(state, document, units, numberEntry)
    : null;
}

function previewOf(corners: readonly GroundPoint[]): NonNullable<SizeCardView['preview']> {
  return {
    corners,
    lengths: edgeLengths(corners),
    middle: roofMiddle(corners),
    area: roofArea(corners),
  };
}

/** The size card as drawn: the numbers, the dashed rectangle, and why it cannot stand. */
function sizeCardOf(
  size: TypedSize,
  document: StudioDocument,
  units: MeasurementSystem,
  numberEntry: NumberEntry,
): SizeCardView {
  const length = entryRead(size.length, units);
  const width = entryRead(size.width, units);
  const lengthM = length.kind === 'metres' ? length.metres : null;
  const widthM = width.kind === 'metres' ? width.metres : null;
  const outside = [lengthM, widthM].some(
    (m) => m !== null && (m < TYPED_SLIDE_MIN_M || m > TYPED_SLIDE_MAX_M),
  );
  const result = typedResult(size, document, units);
  const refusal = result.kind === 'refused' ? result.refusal : null;
  // A rectangle that cannot stand still shows where it would, in the error colour — unless its
  // numbers are unreadable or out of bounds, when there is nothing true to draw.
  const drawable =
    lengthM !== null &&
    widthM !== null &&
    (refusal === null || refusal.kind === 'overlaps' || refusal.kind === 'too_far');
  return {
    length: size.length,
    width: size.width,
    lengthM,
    widthM,
    pair: size.pair,
    placeable: result.kind === 'ready',
    refusal,
    preview: drawable ? previewOf(typedCorners(size.place, document.roofs, lengthM, widthM)) : null,
    previewBad: refusal !== null,
    slide: { min: TYPED_SLIDE_MIN_M, max: TYPED_SLIDE_MAX_M, step: SIZE_STEP[units] },
    boxes: numberEntry === 'box' || outside,
    outside,
  };
}

/**
 * The size card opens by itself as the design opens, once, when `sizeCardOnArrival` says so; it
 * is decided the first time nothing is still on its way, and never again in the visit.
 */
export function useSizeCardOpens(arrival: SizeCardArrival, open: () => void) {
  // The decision is kept, not used up while rendering: a render run twice (React's checks) must
  // read the same answer.
  const decision = useRef<'wait' | 'open' | 'never'>('wait');
  if (decision.current === 'wait') decision.current = sizeCardOnArrival(arrival);
  const opens = decision.current === 'open';
  // biome-ignore lint/correctness/useExhaustiveDependencies: opens once; `open` reads by ref
  useEffect(() => {
    if (!opens) return;
    decision.current = 'never';
    open();
  }, [opens]);
}

/** What the studio knows as a design opens, for the size card's one decision. */
export function arrivalOf(
  document: StudioDocument | null,
  picture: StudioPicture,
  editing: StudioEditing,
  editable: boolean,
  view: StudioView,
): SizeCardArrival {
  return {
    loaded: document !== null,
    roofs: document?.roofs.length ?? 0,
    pictureAnswered: picture.kind !== 'waiting',
    noPicture: picture.kind === 'none',
    editingSettled: editing.kind !== 'opening',
    editable,
    top: view === 'top',
  };
}

/**
 * The ground the camera frames: the roofs, and — while the size card is open — its rectangle too,
 * so a typed roof placed beside the others is on the screen when the card opens.
 */
export function framedWithCard(
  fit: GroundBox | null,
  document: StudioDocument | null,
  card: SizeCardView | null,
): GroundBox | null {
  const preview = card?.preview;
  if (preview == null) return fit;
  return roofsBox([...(document?.roofs ?? []), { corners: preview.corners }]);
}
