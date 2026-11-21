import type { MeasurementSystem } from '../format/pack';
import type { PictureChoice, PictureStamp, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import type { DragResult, EditRefusal } from './roof-check';
import type { DraftRefusal, DrawHelpers, RoofSnap, Snapped } from './roof-draw';
import type { LengthEntry, LengthInHand } from './roof-entry';

/**
 * The roof step's vocabulary (`T-M05-002`, part b): its states, the events that move it, and what
 * the bar says after an act. The reducer is `roof-step.ts`; what it draws, `roof-step-view.ts`.
 */

/** A corner of a roof: the roof's place in the design, then the corner's. */
export interface CornerRef {
  readonly roof: number;
  readonly corner: number;
}

/** What a person holds while dragging. */
export type RoofGrip =
  | { readonly kind: 'corner'; readonly roof: number; readonly corner: number }
  /** The + on an edge: a new corner at its middle, dragged out at once. */
  | { readonly kind: 'plus'; readonly roof: number; readonly edge: number }
  | { readonly kind: 'move'; readonly roof: number }
  | { readonly kind: 'turn'; readonly roof: number };

/** What the bar says after an act, until the next. */
export type RoofSaid =
  | { readonly kind: 'closed' }
  | { readonly kind: 'sized' }
  | { readonly kind: 'set'; readonly metres: number; readonly measured: boolean }
  | { readonly kind: 'corner_moved'; readonly snap: RoofSnap | null }
  | { readonly kind: 'corner_added' }
  | { readonly kind: 'corner_picked' }
  | { readonly kind: 'corner_removed' }
  | { readonly kind: 'roof_moved' }
  | { readonly kind: 'roof_turned'; readonly degrees: number }
  /** A drag let go with a fault: the roof went back. */
  | { readonly kind: 'went_back'; readonly fault: EditRefusal }
  | { readonly kind: 'refused'; readonly refusal: EditRefusal };

export type RoofStepState =
  | { readonly kind: 'idle'; readonly picked: CornerRef | null; readonly said: RoofSaid | null }
  | {
      readonly kind: 'drawing';
      readonly corners: readonly GroundPoint[];
      /** The pointer on the ground, as it is, before any snap; `null` when it is off the map. */
      readonly pointer: GroundPoint | null;
      /** Where the next corner would land, under the pointer, snapped by the helpers in force. */
      readonly spot: Snapped | null;
      readonly refused: DraftRefusal | null;
      /** The helpers guiding the next corner: the person's picks, or none while Alt is held. */
      readonly helpers: DrawHelpers;
    }
  | ({
      readonly kind: 'sizing';
      /** The value is far off the picture: the box asks once before it is used. */
      readonly asking: boolean;
    } & LengthInHand)
  | {
      readonly kind: 'dragging';
      readonly grip: RoofGrip;
      readonly base: StudioDocument;
      /** Where the pointer first held, on the ground. */
      readonly from: GroundPoint;
      readonly drag: DragResult;
      /** A turn's angle so far, in degrees anticlockwise. */
      readonly degrees: number;
    };

export const ROOF_STEP_START: RoofStepState = { kind: 'idle', picked: null, said: null };

export type RoofStepEvent =
  | { readonly kind: 'draw'; readonly helpers: DrawHelpers }
  /** A helper turned on or off, or Alt pressed or let go, while drawing. */
  | { readonly kind: 'helpers'; readonly helpers: DrawHelpers }
  | { readonly kind: 'hover'; readonly at: GroundPoint | null }
  /** A tap on the ground; `system` keeps a length still in the box, which a tap outside sets. */
  | { readonly kind: 'tap'; readonly at: GroundPoint; readonly system: MeasurementSystem }
  | {
      readonly kind: 'close';
      readonly id: string;
      readonly tracedOn: PictureChoice;
      /** The sky picture shown, kept with the first roof (M04-10); `null` with none. */
      readonly stamp: PictureStamp | null;
    }
  | { readonly kind: 'cancel' }
  | { readonly kind: 'undo_corner' }
  | {
      readonly kind: 'pick_length';
      readonly roof: number;
      readonly edge: number;
      readonly system: MeasurementSystem;
    }
  | { readonly kind: 'type'; readonly entry: LengthEntry }
  | { readonly kind: 'step'; readonly by: 1 | -1; readonly system: MeasurementSystem }
  | { readonly kind: 'set'; readonly system: MeasurementSystem }
  | { readonly kind: 'confirm'; readonly use: boolean; readonly system: MeasurementSystem }
  | {
      readonly kind: 'grab';
      readonly grip: RoofGrip;
      readonly at: GroundPoint;
      readonly system: MeasurementSystem;
    }
  | { readonly kind: 'drag'; readonly at: GroundPoint }
  | { readonly kind: 'release' }
  | { readonly kind: 'pick_corner'; readonly corner: CornerRef | null }
  | { readonly kind: 'remove_corner' };

export interface RoofStepOutcome {
  readonly state: RoofStepState;
  /** The design after an act that ends here: one history entry. `null`: nothing to save. */
  readonly commit: StudioDocument | null;
}
