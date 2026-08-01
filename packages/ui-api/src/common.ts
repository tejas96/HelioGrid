import type { ReactNode } from 'react';

/**
 * Vocabulary shared across component APIs.
 *
 * These unions were written out identically in both implementations. Hoisting them here is
 * One definition per fact, applied to the component layer: imported by both platforms, so a new
 * member cannot land on web and be silently missing on RN.
 *
 * `ChipTone` is the clearest case — web declared the union literally while RN derived it with
 * `keyof typeof TONE_FG`. Both resolved to the same six members, but nothing enforced that.
 */

/** The two density modes (Expressive mobile / Functional desktop) — docs/10 §4. */
export type Density = 'expressive' | 'functional';

/** Chip and Badge tones. NOT the workflow status set — that is `WorkflowStatus`. */
export type ChipTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

/**
 * Option/item shapes for the selection controls.
 *
 * Defined here rather than twice: both platforms declared these locally and they had DRIFTED —
 * `label` was `ReactNode` on web and `string` on RN, so a shared screen could pass JSX that RN
 * cannot render. `string` is the honest intersection and every call site already used one.
 */
export interface TabItem {
  value: string;
  label: string;
}

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
  /** The one genuinely renderable slot — both platforms accept a node here. */
  icon?: ReactNode;
}
