import type { ReactNode } from 'react';

/** Where the track sits in the row. */
export type SwitchToggleAt = 'start' | 'end';

export interface SwitchProps {
  checked?: boolean;
  /**
   * Fires with the NEXT checked state. The design system declares this as a DOM
   * `ChangeEvent<HTMLInputElement>`; the shared contract cannot carry a DOM type, so both
   * halves hand back the boolean the caller was reading off the event anyway.
   */
  onChange?: (checked: boolean) => void;
  /**
   * The switch's name. With a `description` it is set as the row's TITLE — body-sm at the medium
   * weight over the description — and without one it keeps the body size.
   */
  label?: string;
  /**
   * A second line under `label`, in the caption size and the secondary ink — what the setting
   * does (`SCR-M01-19`'s section rows). It sits INSIDE the hit box, so a tap on the words throws
   * the switch. It is the switch's description, never part of its name: web `aria-describedby`
   * on the input; the phone reads it after the name.
   */
  description?: string;
  /**
   * `'end'` puts the track at the row's end and gives the words the rest of the width, wrapping
   * — a settings row whose words lead. `'start'` (the default) is the track first, the row only
   * as wide as its words.
   */
  toggleAt?: SwitchToggleAt;
  /**
   * The switch's name when its words sit outside it — a row whose name carries an `Explainer`
   * beside it, which a label inside the switch could not hold. Given with `label`, it is the
   * spoken name on both platforms. Web: `aria-label` on the input.
   */
  ariaLabel?: string;
  disabled?: boolean;
  /**
   * **The caller's validation failure** — a required consent or confirmation flag that is why a send
   * refused. Danger ring on the track, danger words **under** the label (never inside it: a sentence
   * inside the `<label>` would toggle the switch when tapped), `aria-invalid` on the input, described
   * rather than announced. With an error present the control renders inside a column wrapper and
   * the platform `style` lands on that wrapper.
   */
  error?: ReactNode;
  id?: string;
}
