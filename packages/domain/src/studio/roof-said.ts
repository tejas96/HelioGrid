import type { Roof } from './document';
import type { GroundPoint } from './ground';
import type { EditRefusal } from './roof-check';
import type { RoofFacts } from './roof-levels';
import type { RoofMaterial } from './roof-material';
import type { MeetChoice, RoofMeeting, RoofPlace } from './roof-meeting';
import type { RoofName } from './roof-names';
import type { RoofKind } from './roof-parts';
import type { RoofSnap } from './roof-snap';
import type { StudioChange } from './studio-change';

/**
 * What the roof step's bar says after an act (`T-M05-002`, parts b and e), and what it knows of a
 * roof just placed among the others: the facts its words are chosen from.
 */

/** What the bar says after an act, until the next. */
export type RoofSaid =
  /**
   * A roof closed. `became`: what the studio made of it by how it meets the others, said once on
   * the line with its likely kinds as chips, until the next tap on the model.
   */
  | { readonly kind: 'closed'; readonly became?: RoofBecame }
  /** A person made a roof another kind from its sheet. */
  | { readonly kind: 'made'; readonly roof: number; readonly is: RoofKind; readonly name: RoofName }
  /**
   * A new roof joined with the roof it met: the two are one, with one outline. `apart`: the two as
   * they stood apart and what the line said of the new one, while its chips can still part them.
   */
  | {
      readonly kind: 'joined';
      readonly roof: number;
      readonly name: RoofName;
      readonly apart?: RoofApart;
    }
  /** A new roof cut back to the edge of the roof it lay over, and what it is now. */
  | { readonly kind: 'cut'; readonly became: RoofBecame }
  /** An edit left a roof past the edge of the roof it stands on: it stays, marked to check. */
  | { readonly kind: 'sticks_out'; readonly roof: number; readonly name: RoofName }
  /** A roof dragged clear of the roof it stood on: it is its own roof now. */
  | { readonly kind: 'set_free'; readonly roof: number; readonly name: RoofName }
  /**
   * A side's wall added or taken off, from its dot on the picked roof. `walled`: how many of the
   * roof's `sides` have a wall now.
   */
  | {
      readonly kind: 'side_wall';
      readonly roof: number;
      readonly side: number;
      readonly wall: boolean;
      readonly walled: number;
      readonly sides: number;
    }
  /** A roof copied beside itself, with what stands on it; the copy is picked to drag. */
  | { readonly kind: 'copied'; readonly roof: number; readonly of: RoofName }
  | { readonly kind: 'sized' }
  | { readonly kind: 'set'; readonly metres: number; readonly measured: boolean }
  | { readonly kind: 'corner_moved'; readonly snap: RoofSnap | null }
  | { readonly kind: 'corner_added' }
  | { readonly kind: 'corner_picked' }
  /** `at`: where the corner stood, which shrinks away there as its edges join. */
  | { readonly kind: 'corner_removed'; readonly at: GroundPoint }
  | { readonly kind: 'roof_moved' }
  | { readonly kind: 'roof_turned'; readonly degrees: number }
  /** Undo or Redo walked the design's history: the bar names it, and what it changed. */
  | { readonly kind: 'undone'; readonly change: StudioChange }
  | { readonly kind: 'redone'; readonly change: StudioChange }
  /** A roof picked from its 3D sheet, to fix its outline here: its height, in metres. */
  | {
      readonly kind: 'roof_picked';
      readonly roof: number;
      readonly metres: number;
      /** What the roof is called; absent, it is said by its place in the design. */
      readonly name?: RoofName;
    }
  /** A roof deleted, with what stood on it; Undo brings it back. `was`: what it was called. */
  | { readonly kind: 'roof_deleted'; readonly was?: RoofName }
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

/** What a new roof became when it closed, and the chips that fix a wrong guess. */
export interface RoofBecame {
  readonly roof: number;
  readonly place: RoofPlace;
  readonly is: RoofKind;
  /** The roof it stands on or is part of, by its place in the design. */
  readonly on: number | null;
  /** What it is called, what the roof it goes with or meets is called, and how high it stands on it. */
  readonly name: RoofName;
  readonly beside: RoofName | null;
  readonly aboveM: number | null;
  readonly choices: readonly MeetChoice[];
  readonly joinWith: number | null;
  /** It lies over the roof under it in more than one piece: across both arms of a C. */
  readonly across: boolean;
  readonly toCheck: boolean;
}

/** Two roofs Join made one, as they stood apart: a kind's chip puts them back. */
export interface RoofApart {
  readonly fresh: Roof;
  readonly met: Roof;
  readonly became: RoofBecame;
}

/** How a new roof meets the others and the market's roof facts: what places it when it closes. */
export interface RoofPlacing {
  readonly meeting: RoofMeeting;
  readonly facts: RoofFacts;
  /** What the host knows the site's roof is made of: the design's first roof starts as it. */
  readonly siteMaterial?: RoofMaterial;
}
