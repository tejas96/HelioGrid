import type { StudioDocument } from './document';
import { roofMaterialNow } from './roof-levels';
import type { RoofList } from './roof-list';
import {
  type MaterialMarketFacts,
  materialFragile,
  materialsIn,
  materialsOrdered,
  ROOF_FIXED_LIKE,
  ROOF_MATERIAL_GROUPS,
  ROOF_MATERIALS_FIRST,
  type RoofFixedLike,
  type RoofMaterial,
  type RoofMaterialGroup,
} from './roof-material';
import type { MaterialPick } from './roof-material-set';
import { type RoofName, roofNameOf } from './roof-names';
import { MATERIAL_NAME_MAX } from './roof-parts';

/**
 * What the pencil opens (`T-M05-002`, part e): its two buttons, Roofs, and the material picker —
 * one of them at a time. The pencil is the one door to the roofs and does what the moment needs.
 */

/** What a tap on the pencil does now. */
export type PencilDoes =
  /** No roof yet: it draws at once. */
  | 'draw'
  /** A roof is being drawn: it stops. */
  | 'stop'
  /** Roofs stand, in the top view, for a person who may change them: Roofs and Draw. */
  | 'fan'
  /** In 3D, or for a person who may only view: Roofs opens at once. */
  | 'roofs';

export function pencilDoes(facts: {
  readonly roofs: number;
  readonly drawing: boolean;
  readonly editable: boolean;
  readonly top: boolean;
}): PencilDoes {
  if (facts.drawing) return 'stop';
  if (!facts.editable || (!facts.top && facts.roofs > 0)) return 'roofs';
  return facts.roofs === 0 ? 'draw' : 'fan';
}

/** How the picker shows its types: the market's first five, every type in groups, or a type of one's own. */
export type PickerMode = 'first' | 'all' | 'other';

/** A type of a person's own, as typed so far. */
export interface OtherDraft {
  readonly name: string;
  readonly fixedLike: RoofFixedLike;
}

export type RoofsPanel =
  | { readonly open: 'none' }
  | { readonly open: 'fan' }
  /** `lit`: the row lit as Roofs opens — the next roof that waits, after a pick. */
  | { readonly open: 'roofs'; readonly lit: number | null }
  | {
      readonly open: 'picker';
      readonly roof: number;
      /** Where it was opened from, and goes back to. */
      readonly from: 'roofs' | 'sheet';
      readonly mode: PickerMode;
      readonly other: OtherDraft;
    };

export const ROOFS_PANEL_START: RoofsPanel = { open: 'none' };

export type RoofsPanelEvent =
  /** The pencil tapped where it opens something: its two buttons, or Roofs at once. */
  | { readonly kind: 'pencil'; readonly does: 'fan' | 'roofs' }
  | { readonly kind: 'roofs' }
  /** ×, Esc, a tap outside, the phone's back: what is open closes, back to where it came from. */
  | { readonly kind: 'close' }
  /** Everything closes: an act that must show on the model, or a roof's sheet taking the place. */
  | { readonly kind: 'close_all' }
  | { readonly kind: 'material'; readonly roof: number; readonly from: 'roofs' | 'sheet' }
  | { readonly kind: 'mode'; readonly mode: PickerMode }
  | { readonly kind: 'other'; readonly draft: Partial<OtherDraft> }
  /** A type picked or confirmed: back to Roofs with the next roof that waits lit, or to the sheet. */
  | { readonly kind: 'picked'; readonly next: number | null };

const OTHER_START: OtherDraft = { name: '', fixedLike: 'concrete' };

function closed(state: RoofsPanel): RoofsPanel {
  if (state.open === 'picker' && state.from === 'roofs') return { open: 'roofs', lit: state.roof };
  return ROOFS_PANEL_START;
}

export function roofsPanelAfter(state: RoofsPanel, event: RoofsPanelEvent): RoofsPanel {
  switch (event.kind) {
    case 'pencil':
      // A second tap on the pencil closes its buttons.
      if (event.does === 'fan') return state.open === 'fan' ? ROOFS_PANEL_START : { open: 'fan' };
      return { open: 'roofs', lit: null };
    case 'roofs':
      return { open: 'roofs', lit: null };
    case 'close':
      return closed(state);
    case 'close_all':
      return ROOFS_PANEL_START;
    case 'material':
      return {
        open: 'picker',
        roof: event.roof,
        from: event.from,
        mode: 'first',
        other: OTHER_START,
      };
    case 'mode':
      return state.open === 'picker' ? { ...state, mode: event.mode } : state;
    case 'other':
      return state.open === 'picker'
        ? { ...state, other: { ...state.other, ...event.draft } }
        : state;
    case 'picked':
      if (state.open !== 'picker') return state;
      return state.from === 'roofs' ? { open: 'roofs', lit: event.next } : ROOFS_PANEL_START;
  }
}

/** The next roof whose material still waits, after `roof` in the list's order and round again. */
export function nextWaiting(list: RoofList, roof: number): number | null {
  const at = list.rows.findIndex((row) => row.roof === roof);
  const round = [...list.rows.slice(at + 1), ...list.rows.slice(0, Math.max(at, 0))];
  const next = round.find((row) => row.material !== null && !row.material.confirmed);
  return next?.roof ?? null;
}

/** A type's tile: its picture's facts. */
export interface MaterialTile {
  readonly type: RoofMaterial;
  readonly fragile: boolean;
  /** The roof is made of it now. */
  readonly on: boolean;
}

/** The picker as a screen draws it. */
export interface MaterialPickerView {
  readonly roof: number;
  readonly name: RoofName;
  readonly mode: PickerMode;
  /** What the roof is made of now, which Confirm keeps; and whether it still waits. */
  readonly now: RoofMaterial;
  readonly confirmed: boolean;
  /** The market's first five. */
  readonly first: readonly MaterialTile[];
  /** Every type in its group, in the groups' order; a type of one's own is apart, last. */
  readonly groups: readonly {
    readonly group: RoofMaterialGroup;
    readonly tiles: readonly MaterialTile[];
  }[];
  readonly other: OtherDraft & {
    readonly families: readonly RoofFixedLike[];
    /** The name's longest, and what Use would pick: `null` until it has a name. */
    readonly nameMax: number;
    readonly pick: MaterialPick | null;
  };
}

/** The picker for the panel as it stands; `null` when it is not open, or its roof is gone. */
export function materialPickerOf(
  document: StudioDocument,
  panel: RoofsPanel,
  market: MaterialMarketFacts,
): MaterialPickerView | null {
  const roof = panel.open === 'picker' ? document.roofs[panel.roof] : undefined;
  if (panel.open !== 'picker' || roof === undefined) return null;
  const now = roofMaterialNow(roof);
  const tile = (type: RoofMaterial): MaterialTile => ({
    type,
    fragile: materialFragile(type),
    on: type === now,
  });
  const name = panel.other.name.trim();
  return {
    roof: panel.roof,
    name: roofNameOf(document, panel.roof) ?? { kind: 'roof', number: panel.roof + 1 },
    mode: panel.mode,
    now,
    confirmed: roof.material?.confirmed === true,
    first: materialsOrdered(market).slice(0, ROOF_MATERIALS_FIRST).map(tile),
    groups: ROOF_MATERIAL_GROUPS.filter((group) => group !== 'other').map((group) => ({
      group,
      tiles: materialsIn(group).map(tile),
    })),
    other: {
      ...panel.other,
      families: ROOF_FIXED_LIKE,
      nameMax: MATERIAL_NAME_MAX,
      pick: name === '' ? null : { type: 'other', name, fixedLike: panel.other.fixedLike },
    },
  };
}
