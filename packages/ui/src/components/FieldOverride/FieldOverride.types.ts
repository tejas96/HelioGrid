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
  autoSource?: string;
  /** What the derived default has since become. Required by `stale`. */
  newValue?: ReactNode;
  /** Named in the buttons' accessible labels, so a screen reader hears which field it restores. */
  fieldName?: string;
  onReset?: () => void;
  /** `MS10-13`'s one-tap "take the new value". Only rendered by `stale`. */
  onTake?: () => void;
  /** The word before the superseded value. Default "was". */
  autoLabel?: string;
  /** 12 (default) or 13. Never below 12 — the type floor. */
  size?: number;
}
