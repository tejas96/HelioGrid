/**
 * **One chosen file, named** (`SCR-M01-17` step 1): a sheet glyph, the file's name, one line of
 * what was read in it — *412 rows · 9 columns* — or what went wrong, and *Replace* when the caller
 * offers it. On a soft blue wash; `layout="wide"` sets the glyph in its own tile (the 1536 panel).
 * Every word is the caller's.
 */
export interface FileChipProps {
  /** The file's own name, as its picker gave it: data, never translated, cut short with an ellipsis. */
  name: string;
  /** What was read in the file, or the problem with it. */
  meta: string;
  /** `problem` draws the meta in the danger ink; the line still says what happened in words. */
  tone?: 'read' | 'problem';
  layout?: 'compact' | 'wide';
  /** Absent: no *Replace* is drawn (the run, which has a file it can no longer change). */
  onReplace?: () => void;
  /** Required whenever `onReplace` is given. */
  replaceLabel?: string;
}
