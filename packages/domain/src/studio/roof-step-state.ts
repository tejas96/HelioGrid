import type { MeasurementSystem } from '../format/pack';
import type { PictureChoice, PictureStamp, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import type { DragResult } from './roof-check';
import type { DraftRefusal } from './roof-draw';
import type { LengthEntry, LengthInHand } from './roof-entry';
import type { HandFaceClosed } from './roof-hand-faces';
import type { RoofFacts } from './roof-levels';
import type { MaterialPick } from './roof-material-set';
import type { HoleFitter, RoofMeeting } from './roof-meeting';
import type { RoofKind } from './roof-parts';
import type { RoofPlacing, RoofSaid } from './roof-said';
import type { Snapped, SnapTargets } from './roof-snap';
import type { TypedSize } from './roof-type';
import type { StudioChange } from './studio-change';

export type { RoofApart, RoofBecame, RoofPlacing, RoofSaid } from './roof-said';

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
      /**
       * Undo has taken a corner off in this drawing: its place in the tools stays until the drawing
       * ends, dim with nothing left to take, so the tool above never slides under the finger.
       */
      readonly undone?: true;
      /** On the bare grid each corner lands on a whole metre, unless the magnet is off (Alt). */
      readonly grid?: boolean;
      /**
       * A face of this roof is drawn, not a roof (Any shape, E082): its corners stay on the roof
       * and pull to its outline and the faces drawn before; it closes into a face of the roof.
       */
      readonly faces?: number;
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
      /** The inside faces of the roofs' parapets: a roof moved onto another pulls to them. */
      readonly insides?: SnapTargets['edges'];
    };

/** A drawing stopped with corners placed: what Undo takes up again. */
export interface DraftLeft {
  readonly corners: readonly GroundPoint[];
  readonly magnet: boolean;
  readonly grid?: boolean;
  /** The roof whose face was drawn. */
  readonly faces?: number;
}

export const ROOF_STEP_START: RoofStepState = {
  kind: 'idle',
  roof: null,
  picked: null,
  said: null,
};

export type RoofStepEvent =
  | { readonly kind: 'draw'; readonly magnet: boolean; readonly grid?: boolean }
  /** Draw the faces of an Any-shape roof by hand: the next face of roof `roof` starts. */
  | { readonly kind: 'draw_faces'; readonly roof: number; readonly magnet: boolean }
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
  /** Delete: the picked roof, or the roof of a row, goes with what stands on it, as one change. */
  | { readonly kind: 'delete_roof'; readonly roof?: number }
  | { readonly kind: 'hover'; readonly at: GroundPoint | null }
  /** A tap on the ground; `system` keeps a length still in the box, which a tap outside sets. */
  | { readonly kind: 'tap'; readonly at: GroundPoint; readonly system: MeasurementSystem }
  | {
      readonly kind: 'close';
      readonly id: string;
      readonly tracedOn: PictureChoice;
      /** The sky picture shown, kept with the first roof (M04-10); `null` with none. */
      readonly stamp: PictureStamp | null;
      /** Close shape takes the ghost corner; a tap on the first corner closes the shape as drawn. */
      readonly ghost: boolean;
      /**
       * How the closed outline meets the design's roofs, worked out by the studio's kernel for
       * this close; `meet` is asked with the outline as it would close. Absent, the roof stands
       * as drawn, a building.
       */
      readonly placing?: Omit<RoofPlacing, 'meeting'> & {
        readonly meet: (corners: readonly GroundPoint[]) => RoofMeeting;
      };
      /**
       * While a face is drawn: the face as it would close on its roof, worked out by the studio's
       * kernel — the design with it standing, or why it may not.
       */
      readonly face?: (corners: readonly GroundPoint[]) => HandFaceClosed;
    }
  /** A kind picked for a roof: a chip on the line after it closed, or its sheet's What it is row. */
  | {
      readonly kind: 'make';
      readonly roof: number;
      readonly into: RoofKind;
      readonly facts: RoofFacts;
      /** How the roof, made a hole, fits the roof it is cut in (E015). */
      readonly fitHole: HoleFitter;
    }
  /** Join: the new roof and the roof it met become one, on the outline the kernel joined. */
  | {
      readonly kind: 'join';
      readonly roof: number;
      readonly with: number;
      readonly outline: readonly GroundPoint[];
    }
  /** Cut to edge: the new roof takes the corners the kernel cut it back to, and is placed again. */
  | {
      readonly kind: 'cut_to_edge';
      readonly roof: number;
      readonly corners: readonly GroundPoint[];
      readonly placing: RoofPlacing;
    }
  /**
   * A side's dot tapped on the picked roof: its wall is added or taken off. `wall` is what the
   * side has after the tap, and `walled` how many of the roof's sides then have one.
   */
  | {
      readonly kind: 'side_wall';
      readonly roof: number;
      readonly side: number;
      readonly wall: boolean;
      readonly walled: number;
    }
  /** What a roof is made of: a person's pick, or Confirm, which keeps the guess (`pick` absent). */
  | { readonly kind: 'material'; readonly roof: number; readonly pick?: MaterialPick }
  /** Copy, from a roof's row: `ids` names the copy and the copy of each roof that goes with it. */
  | { readonly kind: 'copy_roof'; readonly roof: number; readonly ids: readonly string[] }
  | { readonly kind: 'cancel' }
  | { readonly kind: 'undo_corner' }
  | {
      readonly kind: 'pick_length';
      readonly roof: number;
      readonly edge: number;
      readonly system: MeasurementSystem;
      /** The roofs made from a plan laid at our guess: a first length on one sizes the plan. */
      readonly planRoofs?: readonly number[];
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
      /** The inside faces of the roofs' parapets, from the kernel: what a moved roof pulls to. */
      readonly insides?: SnapTargets['edges'];
    }
  | { readonly kind: 'drag'; readonly at: GroundPoint }
  | { readonly kind: 'release' }
  | { readonly kind: 'pick_corner'; readonly corner: CornerRef | null }
  /** Undo or Redo with nothing in hand: the design steps back or on. */
  | { readonly kind: 'history'; readonly undone: boolean; readonly change: StudioChange }
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
