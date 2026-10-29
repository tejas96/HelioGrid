import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { ActionReasonInput } from '../ActionReason/ActionReason.types';

export interface OptionCardItem {
  value: string;
  title: TranslatedText;
  /**
   * BCP-47 tag for this option's own text, when it differs from the page's. A screen reader
   * running in English speaks मराठी under English pronunciation rules, which fails the accessible
   * name at the one point `F3-03` cares about — on the picker whose whole job is naming languages
   * in their own words. Omitted, the option inherits the document's language, which is correct
   * everywhere else.
   */
  lang?: string;
  description?: TranslatedText;
  /** Right-aligned mono figure — a price or a rating. */
  price?: string;
  /** Uppercase micro-label under the description. */
  meta?: TranslatedText;
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
  currentLabel?: TranslatedText;
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
  disabledReason?: ActionReasonInput;
}

/**
 * `single` (the default) picks one: a radiogroup, one tab stop, arrow keys move the pick. `multiple`
 * picks any number (`SCR-M01-07`'s presets, owner ruling D216): a group of checkboxes, each its own
 * tab stop, Space toggles one, and the mark is a square with a tick instead of a dot.
 */
export type OptionCardGroupMode = 'single' | 'multiple';

interface OptionCardGroupSingle {
  mode?: 'single';
  value?: string;
  onChange?: (value: string) => void;
}

interface OptionCardGroupMultiple {
  mode: 'multiple';
  /** Every option picked, in the order they were picked. */
  value: readonly string[];
  /** The whole new set, in the order picked, once one option is toggled. */
  onChange?: (value: readonly string[]) => void;
}

export type OptionCardGroupProps = OptionCardGroupShared &
  (OptionCardGroupSingle | OptionCardGroupMultiple);

interface OptionCardGroupShared {
  options: OptionCardItem[];
  /**
   * **The group's name — a visible line above the cards, and the accessible name via
   * `aria-labelledby`.** It used to be `aria-label` alone, which made an errored group a ring and a
   * danger sentence around nothing for every sighted reader — the same reasoning
   * `SegmentedControl.label` was added on.
   */
  label?: TranslatedText;
  /**
   * The group's spoken name when its visible name sits outside it — a heading above, as
   * `InviteForm`'s *What can they do?* — so no second visible line is drawn. `label` wins.
   */
  ariaLabel?: TranslatedText;
  /** Default 1. */
  columns?: number;
  density?: 'expressive' | 'functional';
  disabled?: boolean;
  /**
   * The word for `option.current` ("Current plan"). Give it whenever an option is `current` and
   * carries no `currentLabel` of its own: a current option with no word draws no pill.
   */
  currentLabel?: TranslatedText;
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
  /**
   * The group is refused by a sentence drawn OUTSIDE it — `InviteForm`'s banner above the roles —
   * so it says it is invalid (`aria-invalid`) and is described by that sentence's id, without a
   * second sentence or ring. Web only: React Native has no invalid state or described-by; the
   * phone's banner announces itself.
   */
  invalid?: boolean;
  describedBy?: string;
}
