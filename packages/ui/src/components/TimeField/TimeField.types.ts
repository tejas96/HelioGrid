import type { ReactNode } from 'react';

/**
 * "HH:MM" on a 24-hour clock — "09:00", "17:00", "19:30". **The value is always 24-hour**, in every
 * market: one canonical spelling means no AM/PM ambiguity in the data. What the user reads and
 * types follows the active market pack's clock, and both spellings parse on entry.
 */
export type TimeString = string;

/** A quick pick. A bare string is labelled with the time itself. */
export interface TimePreset {
  value: TimeString;
  label: string;
}

/** Density mode — expressive is the brand's roomy default, functional the dense working set. */
export type TimeFieldDensity = 'expressive' | 'functional';

export interface TimeFieldProps {
  value?: TimeString;
  /** Fires once, on blur or Enter, with a normalised "HH:MM". Never per keystroke. */
  onCommit?: (value: TimeString) => void;
  label?: string;
  /** Thumb path: quick picks, each >=44x44. Strings or `{value,label}`. */
  presets?: (TimeString | TimePreset)[];
  helper?: string;
  disabled?: boolean;
  /** Earliest permitted time. A time before it is **refused**, not clamped. */
  min?: TimeString;
  /** Latest permitted time. A time after it is **refused**, not clamped. */
  max?: TimeString;
  /** Named in the refusal — "Maharashtra", "DND hours". Makes the message specific. */
  windowName?: string;
  /** Override the generated refusal. The default already names the window. */
  refusalMessage?: string;
  /**
   * **The caller's validation failure — not a refusal.** A refusal is the component's own act (you
   * typed 21:00, nothing was written, and it says so now, out loud). An `error` is the gate saying
   * this field is why a send refused: the time may be perfectly legal and still be the reason. Same
   * danger ring, `aria-invalid`, and **described rather than announced**, because it was already
   * true when `M06-22`'s jump landed here. Precedence in the message slot: refusal → error →
   * helper. The focus ring rides **on top of** the danger ring rather than behind it — an error
   * only the caller clears must not hide the caret.
   */
  error?: ReactNode;
  /**
   * The ring with **no sentence**. `TimeRangeField` uses it so a window's one failure is stated once
   * under the pair rather than twice under two boxes. Prefer `error` anywhere else. Pair it with
   * `describedBy`: `aria-invalid` with nothing described announces "invalid" and no reason.
   */
  invalid?: boolean;
  /**
   * Id of a sentence somebody else drew — the one line under a `TimeRangeField` pair. Used as
   * `aria-describedby` when this box is ringed by `invalid` rather than by its own `error`.
   */
  describedBy?: string;
  density?: TimeFieldDensity;
  /** Defaults to the market's shape — "HH:MM" or "h:mm AM". */
  placeholder?: string;
  id?: string;
}

export interface TimeRangeFieldProps {
  from?: TimeString;
  to?: TimeString;
  /** Fires with both ends once either commits and the pair is valid. */
  onCommit?: (value: { from: TimeString; to: TimeString }) => void;
  label?: string;
  /** Statutory bounds applied to both ends (F1-15 / F1-36). */
  min?: TimeString;
  max?: TimeString;
  windowName?: string;
  helper?: string;
  /**
   * The window's own validation failure. Rings **both** fields, states the sentence once under
   * them, and points both boxes' `aria-describedby` at that one sentence.
   */
  error?: ReactNode;
  disabled?: boolean;
  density?: TimeFieldDensity;
}
