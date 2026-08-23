import type { ReactNode } from 'react';

export interface SwitchProps {
  checked?: boolean;
  /**
   * Fires with the NEXT checked state. The design system declares this as a DOM
   * `ChangeEvent<HTMLInputElement>`; the shared contract cannot carry a DOM type, so both
   * halves hand back the boolean the caller was reading off the event anyway.
   */
  onChange?: (checked: boolean) => void;
  label?: string;
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
