/**
 * The rendering's sizes, every one a function of the caller's `fontSize` — a document sheet renders
 * at 11 and a screen at 14 — so both halves lay the same value out at the same proportions.
 */
export interface RichTextViewMeasures {
  /** The space under a paragraph or a list. */
  gap: number;
  /** A heading is one step larger than its body. */
  headingSize: number;
  /** The space under a heading. */
  headingBelow: number;
  logoHeight: number;
  logoWidth: number;
  /** The empty logo slot's words, never smaller than 9. */
  logoLabelSize: number;
}

export function richTextViewMeasures(fontSize: number): RichTextViewMeasures {
  return {
    gap: Math.round(fontSize * 0.7),
    headingSize: fontSize + 1,
    headingBelow: Math.round(fontSize * 0.4),
    logoHeight: Math.round(fontSize * 2.4),
    logoWidth: Math.round(fontSize * 6),
    logoLabelSize: Math.max(9, fontSize - 4),
  };
}

/** A heading after the first block keeps a body line's space above it; the first sits flush. */
export function headingAbove(position: number, fontSize: number): number {
  return position > 0 ? fontSize : 0;
}
