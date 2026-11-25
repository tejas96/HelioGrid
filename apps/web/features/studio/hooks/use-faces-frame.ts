import type { RoofStepState } from '@heliogrid/domain';
import { useMemo } from 'react';

/**
 * Drawing a roof's faces by hand asks the camera to frame that roof (`T-M05-002`, part e, board
 * 5.10): again once the room between the bars is measured, as the sheet it came from stood taller
 * than the pill. `null` while no face is drawn.
 */
export function useFacesFrame(
  step: RoofStepState,
  room: { readonly bottom: number },
): object | null {
  const roof = step.kind === 'drawing' ? (step.faces ?? null) : null;
  // biome-ignore lint/correctness/useExhaustiveDependencies: the measured room is what asks for a new frame
  return useMemo(() => (roof === null ? null : {}), [roof, room.bottom]);
}
