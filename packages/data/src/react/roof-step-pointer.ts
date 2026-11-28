import {
  draftClosesAt,
  type MeasurementSystem,
  type RoofStepEvent,
  type RoofStepState,
  snapReachM,
} from '@heliogrid/domain';
import type { RefObject } from 'react';
import type { PointerScale, RoofMoves } from './roof-step-view';

/** The magnet's reach for a pointer, in metres; with none told, the step keeps the one it has. */
const reachOf = (scale?: PointerScale): { reach?: number } =>
  scale === undefined ? {} : { reach: snapReachM(scale.metresPerPixel, scale.touch) };

/**
 * The roof step's pointer moves (`T-M05-002`, parts b and e): the pointer over the ground, a tap,
 * a drag, each with the magnet's reach at the view's zoom, and Follow, which closes the roof along
 * the wall it shares.
 */
export function pointerMoves(
  act: (event: RoofStepEvent) => void,
  step: RefObject<RoofStepState>,
  closeAsDrawn: () => void,
  units: MeasurementSystem,
): Pick<RoofMoves, 'hover' | 'tap' | 'follow' | 'drag'> {
  return {
    hover: (at, scale) => act({ kind: 'hover', at, ...reachOf(scale) }),
    // A tap on the first corner closes the shape, whether it lands on the dot or beside it.
    tap: (at, scale) => {
      const { reach } = reachOf(scale);
      const now = step.current;
      if (now.kind === 'drawing' && draftClosesAt(now.corners, at, reach ?? now.reach))
        closeAsDrawn();
      else act({ kind: 'tap', at, system: units, ...reachOf(scale) });
    },
    // The shared wall's corners, then the roof closes as drawn along it.
    follow: () => {
      const before = step.current.kind === 'drawing' ? step.current.corners.length : 0;
      act({ kind: 'follow' });
      const now = step.current;
      if (now.kind === 'drawing' && now.corners.length > before) closeAsDrawn();
    },
    drag: (at, scale) => act({ kind: 'drag', at, ...reachOf(scale) }),
  };
}
