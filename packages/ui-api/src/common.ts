/**
 * Vocabulary shared across component APIs.
 *
 * These unions were written out identically in both implementations. Hoisting them here is
 * Law 4 applied to the component layer: one definition, imported by both platforms, so a new
 * member cannot land on web and be silently missing on RN.
 *
 * `ChipTone` is the clearest case — web declared the union literally while RN derived it with
 * `keyof typeof TONE_FG`. Both resolved to the same six members, but nothing enforced that.
 */

/** The two density modes (Expressive mobile / Functional desktop) — docs/10 §4. */
export type Density = 'expressive' | 'functional';

/** Chip and Badge tones. NOT the workflow status set — that is `WorkflowStatus`. */
export type ChipTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
