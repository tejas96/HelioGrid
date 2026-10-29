import type { TranslatedText } from '@heliogrid/contracts';
import type { ActionReasonInput } from '../ActionReason';

/** Density mode — expressive is the brand's roomy default, functional the dense working set. */
export type SelectDensity = 'expressive' | 'functional';

export interface SelectOption {
  value: string;
  // biome-ignore lint/plugin/copy-prop-type: an option's name — words, or a fact such as a file's sheet
  label: string;
  disabled?: boolean;
  /**
   * **Why it cannot be picked** — `MS2-21`'s *"disabled options explain why inline"*, `M05-53`,
   * `MS4-20`. Rendered as the **second line of the listbox row**, under the label. Never a tooltip
   * (a touch user never opens one) and never folded into the label. The row keeps its
   * `aria-disabled`, the label stays at a readable grey, and the trigger points at the walked option
   * with `aria-activedescendant` — without that last part focus never leaves the trigger and the
   * sentence would exist for everyone except the keyboard user law 9 exists for.
   *
   * A plain sentence, a spec, or a ready node — all three go through `renderActionReason`, which
   * is what supplies the barred-circle second channel and the `--text-secondary` words.
   */
  disabledReason?: ActionReasonInput;
}

export interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  /** Strings or {value,label,disabled} objects. */
  options: (SelectOption | string)[];
  label?: TranslatedText;
  /** The trigger's words while nothing is picked. Required — an empty trigger says nothing. */
  placeholder: TranslatedText;
  density?: SelectDensity;
  disabled?: boolean;
  helper?: TranslatedText;
  /** State the problem and the fix. */
  error?: TranslatedText;
  name?: string;
  /**
   * The accessible name where there is **no visible `label`** — a `DataTable` cell editor, whose
   * visible name is the column header. Ignored when `label` is set, so the two cannot disagree.
   */
  ariaLabel?: TranslatedText;
  /**
   * The phone's name for the scrim behind an open list, which closes it on a tap ("Close the
   * list"). The web closes on Escape or an outside click and names nothing.
   */
  closeLabel: TranslatedText;
}
