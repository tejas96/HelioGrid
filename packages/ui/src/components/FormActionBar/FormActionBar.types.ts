import type { ReactNode } from 'react';

/**
 * Where the bar stands. `sticky` — the phone: a `--surface` band at `--e4` at the bottom of its
 * scroller, in the place of the bottom nav. `footer` — at width: the foot of the editor card that
 * holds the form, its hairline above and the card's corners below. Only the container differs.
 */
export type FormActionBarPlacement = 'sticky' | 'footer';

/** How the consequence and the acts sit across the bar. */
export type FormActionBarAlign = 'start' | 'center';

/**
 * The act bar a settings form raises **with a change** — never at rest, and never a disabled Save
 * waiting for one. One order at both placements: the consequence, then Save, then Discard. A
 * failed save keeps the edit and the bar; the screen's banner says why and this Save is the retry.
 */
export interface FormActionBarProps {
  /**
   * What a save does — shown above the acts. A settings screen that writes customer-facing output
   * says that what was already sent keeps what it was made with (`F8-15`).
   */
  consequence?: ReactNode;
  /** The primary's words ("Save branding"). Required. */
  saveLabel: string;
  onSave?: () => void;
  /** The way back to what is in force ("Discard changes"). Required. */
  discardLabel: string;
  onDiscard?: () => void;
  /** A save is under way: Save shows its spinner and keeps its name; Discard waits. */
  saving?: boolean;
  /** Default `sticky`. */
  placement?: FormActionBarPlacement;
  /**
   * Not in the design system's contract: SCR-M01-18 centres the consequence over the acts it
   * qualifies at both placements (its G1), which every caller would otherwise write as style.
   * Default `start`, the design system's own look.
   */
  align?: FormActionBarAlign;
}
