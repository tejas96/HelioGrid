/**
 * TextDivider — one short word between two ways to do the same thing ("or" between Send code and
 * Continue with Google, `SCR-M01-01`). The word alone, centred across the full width, with no
 * rules either side: the two controls around it already make the break.
 */
export interface TextDividerProps {
  /** The word, already in the reader's language — no English default (`D2`). */
  label: string;
}
