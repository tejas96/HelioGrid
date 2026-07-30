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
 * Input — label is now `string` on both. It was ReactNode on web purely so a Lingui `<Trans>`
 * element could be passed; the call site now uses `i18n._()`, which extracts to the same msgid.
 */
export interface InputApi {
  label?: string;
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
 * Checkbox — label narrowed to `string` on web to match RN (see InputApi).
 */
export interface CheckboxApi {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

/**
 * Radio — label narrowed to `string` on web to match RN (see InputApi).
 */
export interface RadioApi {
  label?: string;
  checked?: boolean;
  name?: string;
  value?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Switch — label narrowed to `string` on web to match RN (see InputApi).
 */
export interface SwitchApi {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}
