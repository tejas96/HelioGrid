import type { ReactNode } from 'react';
import type { ActionReasonSpec } from '../ActionReason/ActionReason.types';

export interface OptionCardItem {
  value: string;
  title: string;
  description?: string;
  /** Right-aligned mono figure — a price or a rating. */
  price?: string;
  /** Uppercase micro-label under the description. */
  meta?: string;
  /**
   * More than a sentence — a feature list, a note, a small table (`M12`'s pricing page). **Static by
   * contract:** the card *is* the radio, so a focusable child would be a button inside a button.
   */
  content?: ReactNode;
  /** Marks the option carries — nodes, through `MarkRow`. */
  marks?: ReactNode | ReactNode[];
  /**
   * The plan the tenant is **already on**. Different from selected — you select the plan you are
   * moving *to* — so it is a word in its own neutral pill, and selection keeps the ring and the dot.
   */
  current?: boolean;
  /** Per-option override of the group's `currentLabel`. */
  currentLabel?: string;
  icon?: ReactNode;
  disabled?: boolean;
  /**
   * **Why this option cannot be chosen** — `M05-53` (*"options taller than clearance unavailable with a
   * reason"*), `MS4-20` (phase-incompatible units), `MS2-21` (*"disabled options explain why inline"*).
   * Rendered by `ActionReason` **under `description`, never inside it**: a description is the option's
   * *standing* explanation, true whether or not the option is available, and overloading it would
   * change what a description means on every other option in the group. An option with a stated reason
   * stays in the arrow-key walk and is `aria-disabled` rather than natively disabled.
   */
  disabledReason?: ReactNode | ActionReasonSpec;
}

export interface OptionCardGroupProps {
  options: OptionCardItem[];
  value?: string;
  onChange?: (value: string) => void;
  /**
   * **The group's name — a visible line above the cards, and the accessible name via
   * `aria-labelledby`.** It used to be `aria-label` alone, which made an errored group a ring and a
   * danger sentence around nothing for every sighted reader — the same reasoning
   * `SegmentedControl.label` was added on.
   */
  label?: string;
  /** Default 1. */
  columns?: number;
  density?: 'expressive' | 'functional';
  disabled?: boolean;
  /** The word for `option.current`. Default "Current plan". */
  currentLabel?: string;
  /**
   * **The caller's validation failure, and it belongs to the group** — nothing is wrong with option
   * two; the *choice* is missing. So the ring goes round the whole radiogroup (on a wrapper carrying
   * 6px of padding taken straight back as −6px of margin, so an errored group occupies the same box),
   * the sentence sits under it, and `aria-invalid` is on the group. Described rather than announced:
   * the verdict was already true when `M06-22`'s jump landed here.
   *
   * **Not `option.disabledReason`**, which says why one option cannot be chosen and stays true when
   * the group is perfectly valid.
   */
  error?: ReactNode;
}
