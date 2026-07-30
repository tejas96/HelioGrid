/**
 * Composites — shared component API (ADR-0021 era, Task 32).
 *
 * Only props BOTH platforms already agree on are declared here: same name, equivalent type,
 * same optionality. Anything a platform owns alone (web DOM attributes, RN
 * ViewStyle/hitSlop) is absent by design — this is the shared surface, not the union.
 * Divergences found during extraction are recorded per interface so the omission is a
 * decision on the record, not an oversight.
 */
import type { ReactNode } from 'react';

/**
 * OtpInput — 8 shared props.
 *
 * NOT in the contract:
 *   - style — DRIFT: Same name and same optionality on both, but the types are
 *   platform-native and non-equivalent: web `style?: CSSProperties` (applied to the root
 *   <fieldset> group wrapper) vs RN `style?: ViewStyle` (applied to the root View). This is
 *   a platform styling escape hatch, not a genuine API divergence — exclude it from the
 *   shared types-only parity contract rather than unifying it.
 */
export interface OtpInputApi {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  label: string;
}

/**
 * RadioCard — 2 shared props.
 *
 * NOT in the contract:
 *   - options — DRIFT: Prop name, optionality and written type text match
 *   (`RadioCardOption[]`), but `RadioCardOption` is a DIFFERENT type declared in each file.
 *   Web: `label: ReactNode`, `description?: ReactNode`. RN: `label: string`, `description?:
 *   string`. `value: string` and `icon?: ReactNode` are identical on both. A shared
 *   contract must pick one — RN cannot render arbitrary ReactNode as a card
 *   title/description.
 *   - onChange — DRIFT: Identical function type, different optionality: `onChange?` is
 *   OPTIONAL on web and REQUIRED on RN. Call sites written against the web type (omitting
 *   onChange) will not compile against the RN component.
 */
export interface RadioCardApi {
  value: string;
  label: string;
}

/**
 * StepIndicator — 3 shared props.
 */
export interface StepIndicatorApi {
  steps: number;
  current: number;
  label: string;
}

/**
 * BloomLayer — 1 shared prop.
 */
export interface BloomLayerApi {
  size?: number;
}

/**
 * Spinner — 2 shared props.
 */
export interface SpinnerApi {
  size?: 'md' | 'sm';
  tone?: 'onDark' | 'neutral';
}

/**
 * TextLink — 1 shared prop.
 */
export interface TextLinkApi {
  children: ReactNode;
}

/**
 * Wordmark — 1 shared prop.
 */
export interface WordmarkApi {
  size?: 'md' | 'sm';
}
