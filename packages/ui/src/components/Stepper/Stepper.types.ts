/** Not started / in progress / done / has errors — the four states M05-03 requires. */
export type StepState = 'not-started' | 'in-progress' | 'done' | 'errors';

export interface StepperStep {
  label: string;
  optional?: boolean;
  /**
   * Omit and it is derived from `current` (before = done, at = in-progress, after = not-started).
   * Set it explicitly for `"errors"`, which no index can imply.
   */
  state?: StepState;
  /** Shown as "3 to fix" on an errored step. */
  errorCount?: number;
  /**
   * **Per-step override of `reachability`** — the one step a flow genuinely gates, or the one it
   * opens early. Wins over the mode either way. An errored step is reachable in every mode without
   * this, because marking a problem and then blocking the route to it is worse than not marking it.
   */
  reachable?: boolean;
}

/**
 * **Who decides which steps can be jumped to.**
 *
 * `free` (**the default**) — every step is reachable, in any order. This is `M06-22` (P0) for the
 * eleven-step proposal builder: *"Free navigation everywhere; validation at Generate ONLY; the
 * Next-disabled rule is killed"*. It is the default because a component that gates by inheritance
 * makes a policy decision no row asked it to make.
 *
 * **It is not "every flow unless it says otherwise" — the design studio is ruled the other way, at
 * P0.** `M05-05`: the studio keeps step gating, and `MS8-33` adds the clamp — an error-level
 * electrical issue blocks Next and makes the later steps unreachable. A studio surface passes
 * `reachability="entered"` plus per-step `reachable: false`, and says why in words.
 *
 * `entered` — **opt-in gating**: done, in-progress and errors are reachable, not-started is not.
 */
export type StepReachability = 'free' | 'entered';

/**
 * progress = overline + track (sheets, phone wizards) · numbered = horizontal with connectors ·
 * dots = minimal (onboarding) · **rail** = the M05-03 desktop step rail · **indicator** = the
 * M05-03 compact mobile bar ("3 / 9 · Panel layout ‹ ›") that opens a step-list sheet.
 */
export type StepperVariant = 'progress' | 'numbered' | 'dots' | 'rail' | 'indicator';

/** Density mode — expressive is the brand's roomy default, functional the dense working set. */
export type StepperDensity = 'expressive' | 'functional';

export interface StepperProps {
  /** Strings or step objects. */
  steps: (StepperStep | string)[];
  /** Zero-based index of the active step. */
  current?: number;
  variant?: StepperVariant;
  density?: StepperDensity;
  /** Flow name — the overline on `progress`, the rail heading, the accessible name elsewhere. */
  label?: string;
  /**
   * Jump to a step. **Every step is reachable by default** (`reachability="free"`). Gating is
   * opt-in per flow, and an errored step is reachable in every mode.
   */
  onStepClick?: (index: number) => void;
  /** `free` (default) or `entered`. Per-step `reachable` overrides it. */
  reachability?: StepReachability;
  /** `variant="indicator"` only: opens the step-list sheet. Without it the centre button is inert. */
  onOpenStepList?: () => void;
}

export interface StepListProps {
  steps: (StepperStep | string)[];
  current?: number;
  onStepClick?: (index: number) => void;
  label?: string;
  /** Same default and same meaning as `Stepper`'s. */
  reachability?: StepReachability;
}
