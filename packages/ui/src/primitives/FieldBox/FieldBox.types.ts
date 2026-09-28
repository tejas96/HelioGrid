/**
 * The one box every field draws (`F7-15`, `F7-24`): a well, darker than the page or sheet that
 * holds it, never white on white and never outlined. Each field keeps its own size and layout and
 * hands its state here; the well, the radius and the rings are decided once.
 */
export type FieldBoxDensity = 'expressive' | 'functional';

/** The field's verdict on its value. `success` goes when `T-FPLAT-076` replaces the ring. */
export type FieldBoxTone = 'none' | 'error' | 'success';

export interface FieldBoxState {
  /**
   * The caret is in the field, or its list or calendar is open. Set from the field's own state,
   * never read from a pseudo-class: a clear button or a menu inside the box has focus of its own.
   */
  focused: boolean;
  tone?: FieldBoxTone;
  disabled?: boolean;
  density: FieldBoxDensity;
}
