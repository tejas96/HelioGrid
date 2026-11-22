import type { MeasurementSystem } from '../format/pack';
import type { PictureChoice, PictureStamp, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import type { DragResult, EditRefusal } from './roof-check';
import type { DraftRefusal } from './roof-draw';
import type { LengthEntry, LengthInHand } from './roof-entry';
import type { RoofSnap, Snapped } from './roof-snap';
import type { TypedSize } from './roof-type';

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
  /** `at`: where the corner stood, which shrinks away there as its edges join. */
  | { readonly kind: 'corner_removed'; readonly at: GroundPoint }
  | { readonly kind: 'roof_moved' }
  | { readonly kind: 'roof_turned'; readonly degrees: number }
  /** Undo or Redo walked the design's history: the bar names it. */
  | { readonly kind: 'undone' }
  | { readonly kind: 'redone' }
  /** A roof picked from its 3D sheet, to fix its outline here: its height, in metres. */
  | { readonly kind: 'roof_picked'; readonly roof: number; readonly metres: number }
  /** A roof deleted from the bar; Undo brings it back. */
  | { readonly kind: 'roof_deleted' }
  /** A typed roof placed (part c): on the sky picture it is dragged onto the house next. */
  | {
      readonly kind: 'placed';
      readonly onPicture: boolean;
      /** The roof it was placed beside; `null`: on the pin. */
      readonly beside: number | null;
    }
  /** A drag let go with a fault: the roof went back. */
  | { readonly kind: 'went_back'; readonly fault: EditRefusal }
  | { readonly kind: 'refused'; readonly refusal: EditRefusal };

export type RoofStepState =
  | {
      readonly kind: 'idle';
      /**
       * The roof picked while looking — tapped, or the last one changed: its + dots and handles
       * show, and the other roofs keep only their corners. `null` after a tap on open ground.
       */
      readonly roof: number | null;
      readonly picked: CornerRef | null;
      readonly said: RoofSaid | null;
      /** The corners a stopped drawing left: Undo takes them up again, until another act. */
      readonly left?: DraftLeft | null;
    }
  | {
      readonly kind: 'drawing';
      readonly corners: readonly GroundPoint[];
      /** The pointer on the ground, as it is, before any snap; `null` when it is off the map. */
      readonly pointer: GroundPoint | null;
      /** Where the next corner would land, under the pointer, snapped by the helpers in force. */
      readonly spot: Snapped | null;
      readonly refused: DraftRefusal | null;
      /** The magnet guides the next corner: the person's pick, and off while Alt is held. */
      readonly magnet: boolean;
      /** The corners the trash wiped: Undo brings them back, until the next corner. */
      readonly wiped: readonly GroundPoint[] | null;
      /** On the bare grid each corner lands on a whole metre, unless the magnet is off (Alt). */
      readonly grid?: boolean;
    }
  /** Type the size (part c): the card's two numbers and where the rectangle grows from. */
  | ({ readonly kind: 'typing' } & TypedSize)
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
      /** The magnet pulls the corner in hand, as it does while drawing. */
      readonly magnet: boolean;
    };

/** A drawing stopped with corners placed: what Undo takes up again. */
export interface DraftLeft {
  readonly corners: readonly GroundPoint[];
  readonly magnet: boolean;
  readonly grid?: boolean;
}

export const ROOF_STEP_START: RoofStepState = {
  kind: 'idle',
  roof: null,
  picked: null,
  said: null,
};

export type RoofStepEvent =
  | { readonly kind: 'draw'; readonly magnet: boolean; readonly grid?: boolean }
  /** Type the size opens the card at the market's start size, from looking or a drawing not begun. */
  | {
      readonly kind: 'type_size';
      readonly start: { readonly length: number; readonly width: number };
      readonly system: MeasurementSystem;
    }
  /** A number in the card changed, slid or typed. */
  | { readonly kind: 'type_entry'; readonly length?: LengthEntry; readonly width?: LengthEntry }
  /** The desktop's one box: `13.2x8.6`. */
  | { readonly kind: 'type_pair'; readonly text: string }
  /** Metres or feet changed while the card is open: its numbers are written in the new unit. */
  | {
      readonly kind: 'type_units';
      readonly from: MeasurementSystem;
      readonly to: MeasurementSystem;
    }
  /** Place roof: the rectangle stands as one change. */
  | {
      readonly kind: 'place';
      readonly id: string;
      /** The sky picture shown, kept with the first roof (M04-10); `null` with none. */
      readonly stamp: PictureStamp | null;
      readonly system: MeasurementSystem;
    }
  /** The magnet turned on or off, or Alt pressed or let go. */
  | { readonly kind: 'magnet'; readonly magnet: boolean }
  /** The trash while drawing: every corner goes, and drawing goes on. */
  | { readonly kind: 'wipe' }
  /** Redraw, just after a close: that roof goes, and drawing starts again. */
  | { readonly kind: 'redraw'; readonly magnet: boolean; readonly grid?: boolean }
  /** Done, just after a close: the ask goes away; the roof stays. */
  | { readonly kind: 'done' }
  /** The trash on a picked roof: the roof goes, as one change. */
  | { readonly kind: 'delete_roof' }
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
      readonly magnet: boolean;
    }
  | { readonly kind: 'drag'; readonly at: GroundPoint }
  | { readonly kind: 'release' }
  | { readonly kind: 'pick_corner'; readonly corner: CornerRef | null }
  /** Undo or Redo with nothing in hand: the design steps back or on. */
  | { readonly kind: 'history'; readonly undone: boolean }
  /** Edit outline in 2D, from a roof's 3D sheet: that roof is picked; `metres` is its height. */
  | { readonly kind: 'pick_roof'; readonly roof: number; readonly metres: number }
  | { readonly kind: 'remove_corner' };

export interface RoofStepOutcome {
  readonly state: RoofStepState;
  /** The design after an act that ends here: one history entry. `null`: nothing to save. */
  readonly commit: StudioDocument | null;
}

/** What is in hand moves on, and nothing is committed. */
export function stay(state: RoofStepState): RoofStepOutcome {
  return { state, commit: null };
}

/** Nothing in hand: what was said, the roof picked, the corner picked. */
export function idle(
  said: RoofSaid | null,
  roof: number | null,
  picked: CornerRef | null = null,
): RoofStepState {
  return { kind: 'idle', roof, picked, said };
}
