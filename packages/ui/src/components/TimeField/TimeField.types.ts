import type { TranslatedText } from '@heliogrid/contracts';
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
  label: TranslatedText;
}

/** A time refused for falling outside the window, every time in the market's spelling. */
export interface TimeOutsideFacts {
  readonly time: string;
  /** The earliest permitted time; null when only a latest is set. */
  readonly from: string | null;
  /** The latest permitted time; null when only an earliest is set. */
  readonly to: string | null;
  /** The window's name — "DND hours"; without it the window is the permitted one. */
  readonly window?: string;
}

/** A draft that is not a time: what was typed, the shape to type and an example in it. */
export interface TimeShapeFacts {
  readonly typed: string;
  readonly shape: string;
  readonly example: string;
}

/** A span of the day, both ends in the market's spelling, and the window's name when it has one. */
export interface TimeSpanFacts {
  readonly from: string;
  readonly to: string;
  readonly window?: string;
}

/**
 * Every word the time field says on its own, in the reader's language (`packages/i18n`'s
 * `timeFieldWords`). Required: the field holds no word of its own.
 */
export interface TimeFieldWords {
  /** The entry shape a 24-hour market types — *HH:MM*. */
  shape24: TranslatedText;
  /** The entry shape a 12-hour market types — *h:mm AM*. */
  shape12: TranslatedText;
  /** A time outside the window — *21:00 is outside the DND window — calls are allowed between 09:00 and 19:00.* */
  outside: (facts: TimeOutsideFacts) => TranslatedText;
  /** A draft that is not a time — *"25:00" isn't a time. Enter it as HH:MM, like 17:00.* */
  notATime: (facts: TimeShapeFacts) => TranslatedText;
}

/** A window's words: its two ends' names and its two sentences, beside each end's own. */
export interface TimeRangeFieldWords extends TimeFieldWords {
  /** The start's name — *From*. */
  from: TranslatedText;
  /** The end's name — *To*. */
  to: TranslatedText;
  /** An end at or before its start — *The window has to end after it starts — 19:00 to 09:00 is not a window.* */
  endBeforeStart: (facts: TimeSpanFacts) => TranslatedText;
  /** The statutory hours under an unerrored pair — *Maharashtra: calls are permitted 09:00–21:00 only.* */
  permitted: (facts: TimeSpanFacts) => TranslatedText;
}

/** Density mode — expressive is the brand's roomy default, functional the dense working set. */
export type TimeFieldDensity = 'expressive' | 'functional';

export interface TimeFieldProps {
  /** Every word the field says on its own — see `TimeFieldWords`. */
  words: TimeFieldWords;
  value?: TimeString;
  /** Fires once, on blur or Enter, with a normalised "HH:MM". Never per keystroke. */
  onCommit?: (value: TimeString) => void;
  label?: TranslatedText;
  /** Thumb path: quick picks, each >=44x44. Strings or `{value,label}`. */
  presets?: (TimeString | TimePreset)[];
  helper?: TranslatedText;
  disabled?: boolean;
  /** Earliest permitted time. A time before it is **refused**, not clamped. */
  min?: TimeString;
  /** Latest permitted time. A time after it is **refused**, not clamped. */
  max?: TimeString;
  /** Named in the refusal — "Maharashtra", "DND hours". Makes the message specific. */
  windowName?: TranslatedText;
  /** Override the generated refusal. The default already names the window. */
  refusalMessage?: TranslatedText;
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
  /** Defaults to the market's shape — `words.shape24` or `words.shape12`. */
  placeholder?: TranslatedText;
  id?: string;
}

export interface TimeRangeFieldProps {
  /** Every word the pair says on its own — see `TimeRangeFieldWords`. */
  words: TimeRangeFieldWords;
  from?: TimeString;
  to?: TimeString;
  /** Fires with both ends once either commits and the pair is valid. */
  onCommit?: (value: { from: TimeString; to: TimeString }) => void;
  label?: TranslatedText;
  /** Statutory bounds applied to both ends (F1-15 / F1-36). */
  min?: TimeString;
  max?: TimeString;
  windowName?: TranslatedText;
  helper?: TranslatedText;
  /**
   * The window's own validation failure. Rings **both** fields, states the sentence once under
   * them, and points both boxes' `aria-describedby` at that one sentence.
   */
  error?: ReactNode;
  disabled?: boolean;
  density?: TimeFieldDensity;
}
