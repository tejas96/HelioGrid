import type {
  MaterialPick,
  MaterialPickerView,
  OtherDraft,
  PencilDoes,
  PickerMode,
  RoofsPanel,
} from '@heliogrid/domain';

/** Roofs and the material picker, as the screen draws them (`T-M05-002`, part e). */
export interface RoofsPanelView {
  /** What a tap on the pencil does now. */
  readonly pencil: PencilDoes;
  /** What is open: Roofs, the material picker, or nothing. */
  readonly panel: RoofsPanel;
  /**
   * The row of Roofs that is lit while it is open: the row gone back to from its sheet, else the
   * roof picked on the model.
   */
  readonly litRow: number | null;
  /** The material picker, while it is open. */
  readonly materialPicker: MaterialPickerView | null;
  /** The open roof's sheet was opened from a row of Roofs: it carries Back to the list. */
  readonly sheetFromRoofs: boolean;
}

export interface RoofsPanelMoves {
  /** The pencil: it draws — what is open closes first — or, while a roof is drawn, it stops. */
  tapPencil(): void;
  /** The Roofs button, or R: Roofs opens, or — while it or its picker is open — it closes. */
  tapRoofs(): void;
  /** ×, Esc or a tap outside: what is open closes, back to where it was opened from. */
  closePanel(): void;
  /**
   * A row of Roofs, tapped anywhere on it: its roof is picked, the camera flies to it, and its sheet
   * takes the list's place. What the roof is made of is changed in that sheet.
   */
  pickRow(roof: number): void;
  /** Back, on a sheet opened from a row: the sheet closes and Roofs opens on that row. */
  backToRoofs(): void;
  /** What a roof is made of, tapped in its sheet: the picker opens over it. */
  openMaterial(roof: number): void;
  pickerMode(mode: PickerMode): void;
  /** A type of one's own, as it is typed. */
  typeOther(draft: Partial<OtherDraft>): void;
  /** A tap on a type's picture, or Use on a type of one's own: the person's pick. */
  pickMaterial(pick: MaterialPick): void;
  /** Confirm: the guess is kept as it is. */
  confirmMaterial(): void;
  /** Copy and Delete on a row: Roofs closes, so the change shows on the model. */
  copyRow(roof: number): void;
  deleteRow(roof: number): void;
}
