import type { ReactNode } from 'react';
import type { FieldOverrideSpec } from '../FieldOverride/FieldOverride.types';
import type { ValueSourceLevel, ValueSourceSpec } from '../ValueSource/ValueSource.types';

/** Density changes the SIZE only — both grounds are `--surface` at `--e2` (Q77).
 *  expressive = 52px, functional = 40px. */
export type InputDensity = 'expressive' | 'functional';

export interface InputProps {
  label?: string;
  value?: string;
  /**
   * The DS declares this as a DOM change event; the shared contract hands back the value instead,
   * so both platforms call it the same way. Ignored in `commitOnBlur` mode.
   */
  onChange?: (value: string) => void;
  placeholder?: string;
  /**
   * The DS passes this straight to the DOM `type`. Both platforms narrow it to the set that has a
   * native counterpart on each; anything else falls back to plain text.
   */
  type?: InputType;
  /** expressive = 52px, functional = 40px — size only, never the ground (Q77) */
  density?: InputDensity;
  /** error message — inset 1.5px danger ring + text below */
  error?: string;
  /** success = inset 1.5px success ring, no message */
  success?: boolean;
  helper?: string;
  disabled?: boolean;
  /** monospace value (IDs, kWh, coordinates, invoice numbers) */
  mono?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  /**
   * Commit-once mode (MS12-26 / MS3-26), opt-in: the field keeps a local draft and stops calling
   * `onChange` per keystroke.
   */
  commitOnBlur?: boolean;
  /**
   * Fires ONCE on blur or Enter, and only when the text actually changed. Always a string — numeric
   * entry with clamping, refusal and correction belongs to `NumberField`.
   */
  onCommit?: (value: string) => void;
  /**
   * A person replaced a derived default (`M05-72`). One treatment, rendered by `FieldOverride`:
   * marker → superseded value → reset, directly under the field and above helper/error text.
   */
  override?: FieldOverrideSpec | ReactNode;
  /**
   * Which layer supplied this value (`SCR-M01-15`), rendered by `ValueSource`. **Mutually exclusive
   * with `override`** — the field renders one or the other, never both.
   */
  attribution?: ValueSourceSpec | ValueSourceLevel | ReactNode;
  id?: string;
}

/** The keyboard/entry kinds both platforms can honour. */
export type InputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number';
