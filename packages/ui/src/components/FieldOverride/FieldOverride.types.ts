import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';

/**
 * `overridden` — a person replaced the derived default. `stale` — the derived default has moved on
 * since they did (`M05-72`'s *"changes appearance when the design has moved on"*, `MS10-13`'s
 * stale-field pair). `none` renders nothing.
 */
export type FieldOverrideState = 'none' | 'overridden' | 'stale';

export interface FieldOverrideSpec {
  state?: FieldOverrideState;
  /**
   * The figure the reset restores, as a display string — `"4.2 kWp"`, `"₹68,400"`.
   *
   * Under `overridden` that is the **superseded** derived default (rendered *"was 4.2 kWp"*).
   * Under `stale` it is the **user's own** figure — the *"yours"* side of `MS10-13`'s pair, and
   * what "Keep mine" keeps; the design's current figure is `newValue` in that state, never this.
   */
  autoValue?: ReactNode;
  /**
   * Which layer the superseded value came from — "platform", "your SKU". One extra word in this
   * line, not a second treatment: attribution for an **un**-overridden value is `ValueSource`'s,
   * and the two never render together.
   */
  autoSource?: TranslatedText;
  /** What the derived default has since become. Required by `stale`. */
  newValue?: ReactNode;
  /** Named in the buttons' accessible labels, so a screen reader hears which field it restores. */
  fieldName?: TranslatedText;
  onReset?: () => void;
  /** `MS10-13`'s one-tap "take the new value". Only rendered by `stale`. */
  onTake?: () => void;
  /** The word before the superseded value — replaces `words.was` for a screen's own word. */
  autoLabel?: TranslatedText;
  /** Every word the line draws or speaks, in the reader's language (`fieldOverrideWords`). */
  words: FieldOverrideWords;
  /** 12 (default) or 13. Never below 12 — the type floor. */
  size?: number;
}

/**
 * The line's own words, from `@heliogrid/i18n`'s `fieldOverrideWords` — the caller's, never this
 * package's, so an overridden field reads in the language around it. A figure is handed in already
 * formatted; a field's name is its label.
 */
export interface FieldOverrideWords {
  /** The marker under `overridden` — *Edited*. */
  edited: TranslatedText;
  /** The marker under `stale` — *Design moved on*. */
  designMovedOn: TranslatedText;
  /** Before the superseded value — *was*. */
  was: TranslatedText;
  /** Before the person's own figure under `stale` — *yours*. */
  yours: TranslatedText;
  /** Before the design's figure under `stale` — *design now*. */
  designNow: TranslatedText;
  /** The layer the person's figure came from under `stale` — *from platform*. */
  from: (source: string) => TranslatedText;
  /** `stale`'s take — *Take the new value*. */
  take: TranslatedText;
  /** The take's whole spoken name — *Take the new value for Size: 5.1 kWp*. */
  takeSpoken: (field: string, value: string) => TranslatedText;
  /** `stale`'s reset — *Keep mine*. */
  keepMine: TranslatedText;
  /** Its whole spoken name — *Keep mine — Size stays 4.2 kWp*. */
  keepMineSpoken: (field: string, value: string) => TranslatedText;
  /** The reset with no figure to name — *Reset to auto*. */
  resetToAuto: TranslatedText;
  /** The reset naming what it restores — *Reset to ₹15,240*. */
  resetTo: (value: string) => TranslatedText;
  /** The reset's whole spoken name without a figure — *Reset to auto — Price*. */
  resetToAutoSpoken: (field: string) => TranslatedText;
  /** The reset's whole spoken name — *Reset to ₹15,240 — Price*. */
  resetToSpoken: (value: string, field: string) => TranslatedText;
}
