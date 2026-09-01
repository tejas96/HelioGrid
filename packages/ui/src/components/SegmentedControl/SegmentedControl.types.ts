import type { ReactNode } from 'react';

export interface SegmentedOption {
  value: string;
  label: string;
  /**
   * A tabular numeral inside the segment — no pill: a pill inside a 32px pill is mush. It takes
   * `--text-secondary`, because the track is `--canvas-sunken` — a third background, where
   * `--text-tertiary` measures 4.48 — and a count is a value the reader must read.
   */
  count?: number;
  /** Clamp the numeral: `countMax={99}` renders "99+". Unset by default, because a segment
   *  names a panel of records and clamping its total lies. */
  countMax?: number;
  /** Nodes, through `MarkRow`, for anything that is not a count. */
  marks?: ReactNode | ReactNode[];
  /**
   * One segment unavailable. The label stays readable — never `--text-disabled` on this track —
   * and off-ness is carried by a circle-minus glyph inside the segment, not by a colour step.
   */
  disabled?: boolean;
  /**
   * Why it is unavailable — law 9's slot. With a reason the segment is `aria-disabled` and
   * **still focusable**, and the sentence renders under the control, tied to it by
   * `aria-describedby`.
   */
  disabledReason?: ReactNode | { reason: ReactNode };
}

export interface SegmentedControlProps {
  /** array of {value,label,count,marks,disabled} or plain strings */
  options: (SegmentedOption | string)[];
  value: string;
  onChange?: (value: string) => void;
  /**
   * **The field's name** — a real label line above the pill, and the group's accessible name. A
   * required choice needs one: step 3 of the proposal builder puts ONGRID / OFFGRID / HYBRID in
   * this control, and a highlighted field with no name is a highlight of nothing.
   */
  label?: string;
  /**
   * **The caller's validation failure** — danger ring on the pill container, danger words under
   * it, `aria-invalid` on the group, described rather than announced. `M06-22` (P0) kills the
   * Next-disabled rule, so this highlight is the only validation rendering the eleven-step builder
   * has. Same axis as `Input.error`, and nothing to do with `option.disabled`, which is about one
   * segment being unavailable.
   *
   * **A `label` or an `error` makes this control a `radiogroup`** of `radio` segments — one tab
   * stop, arrow keys move the selection, `aria-checked` on each, exactly like `OptionCardGroup`.
   * `aria-invalid` is not supported on `role="group"`, so the field form could not state its own
   * failure while the plain view-switcher form (a row of buttons, no role) is right as it is.
   */
  error?: ReactNode;
}
