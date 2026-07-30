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
import type { RadioCardOption } from './common.js';

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
 * RadioCard — 4 shared props. Same pair of defects as Tabs, fixed the same way 2026-07-30:
 * `onChange` is required on both, and `RadioCardOption` has ONE definition in common.ts (its
 * `label`/`description` were ReactNode on web, string on RN).
 */
export interface RadioCardApi {
  options: RadioCardOption[];
  onChange: (value: string) => void;
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
