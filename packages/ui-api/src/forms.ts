/**
 * Forms — shared component API (ADR-0021 era, Task 32).
 *
 * Only props BOTH platforms already agree on are declared here: same name, equivalent type,
 * same optionality. Anything a platform owns alone (web DOM attributes, RN
 * ViewStyle/hitSlop) is absent by design — this is the shared surface, not the union.
 * Divergences found during extraction are recorded per interface so the omission is a
 * decision on the record, not an oversight.
 */
import type { ReactNode } from 'react';
import type { Density } from './common.js';

/**
 * Button — 8 shared props.
 *
 * NOT in the contract:
 *   - onClick — DRIFT: Same prop name, different handler signature: web inherits React's
 *   MouseEventHandler<HTMLButtonElement> (receives a MouseEvent); RN declares a
 *   zero-argument () => void wired to Pressable onPress. Optionality matches (both
 *   optional).
 */
export interface ButtonApi {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'lg' | 'md' | 'sm';
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
}

/**
 * IconButton — 4 shared props.
 *
 * NOT in the contract:
 *   - size — DRIFT: Web constrains size to the literal union 32 | 40 | 48 (kept on the
 *   checked scale, rendered as data-size); RN accepts any number and uses it directly as
 *   width/height plus hitSlop math. RN therefore accepts values web rejects at compile
 *   time. Optionality matches (both optional, both default 40).
 *   - onClick — DRIFT: Same name, different signature: inherited DOM
 *   MouseEventHandler<HTMLButtonElement> on web vs zero-argument () => void on RN (mapped
 *   to Pressable onPress). Both optional.
 */
export interface IconButtonApi {
  children: ReactNode;
  label: string;
  variant?: 'surface' | 'dark' | 'ghost';
  disabled?: boolean;
}

/**
 * Input — 10 shared props.
 *
 * NOT in the contract:
 *   - label — DRIFT: Type differs: web accepts any ReactNode (rendered inside <label>); RN
 *   accepts only string (rendered in AppText and reused as accessibilityLabel). Optionality
 *   matches (both optional).
 *   - value — DRIFT: Same name, wider type on web: the inherited DOM value accepts string |
 *   number | readonly string[]; RN accepts string only. Both optional.
 *   - onChange — DRIFT: Same name, different signature: web inherits
 *   ChangeEventHandler<HTMLInputElement> (receives a ChangeEvent); RN receives the new text
 *   string (wired to TextInput onChangeText). The RN file documents this as an explicit
 *   adaptation. Both optional.
 *   - type — DRIFT: Web inherits the full HTML input type space (date, file, checkbox,
 *   ...); RN constrains it to a 5-member union that drives keyboardType/secureTextEntry.
 *   Web accepts values RN cannot express. Both optional, both default 'text'.
 */
export interface InputApi {
  density?: Density;
  error?: string;
  success?: boolean;
  helper?: string;
  mono?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Checkbox — 4 shared props.
 *
 * NOT in the contract:
 *   - label — DRIFT: Same optionality (optional on both) but the TYPE differs: web accepts
 *   `ReactNode` (any renderable node), RN accepts only `string`. Web callers passing JSX
 *   have no RN equivalent.
 */
export interface CheckboxApi {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

/**
 * Radio — 5 shared props.
 *
 * NOT in the contract:
 *   - onChange — DRIFT: Same optionality but fundamentally different signatures: web is
 *   React's `ChangeEventHandler<HTMLInputElement>` (receives a DOM ChangeEvent; caller
 *   reads e.target.checked/value), RN is `(checked: boolean) => void` and fires with `true`
 *   only when the radio becomes selected (radios never untoggle on RN). No shared call
 *   signature exists. Note Checkbox and Switch use the value-based `(checked: boolean) =>
 *   void` on BOTH platforms — web Radio is the outlier.
 *   - label — DRIFT: Optional on both; type differs — web `ReactNode`, RN `string`.
 */
export interface RadioApi {
  checked?: boolean;
  name?: string;
  value?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Switch — 4 shared props.
 *
 * NOT in the contract:
 *   - label — DRIFT: Optional on both; type differs — web `ReactNode`, RN `string`.
 */
export interface SwitchApi {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}
