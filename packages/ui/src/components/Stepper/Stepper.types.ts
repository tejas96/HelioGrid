import type { TranslatedText } from '@heliogrid/contracts';

/** Not started / in progress / done / has errors — the four states M05-03 requires. */
export type StepState = 'not-started' | 'in-progress' | 'done' | 'errors';

export interface StepperStep {
  label: TranslatedText;
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
 * M05-03 compact mobile bar ("3 / 9 · Panel layout ‹ ›") that opens a step-list sheet ·
 * **bars** = one thin bar per step, those done and current filled, under a sheet's head — the
 * location only, read by no screen reader (the head names the step) · **numbered-bars** = the same
 * bars with each step's number and name under its bar, the current one marked, a panel's step
 * location (`SCR-M01-17`).
 */
export type StepperVariant =
  | 'progress'
  | 'numbered'
  | 'dots'
  | 'rail'
  | 'indicator'
  | 'bars'
  | 'numbered-bars';

/** Density mode — expressive is the brand's roomy default, functional the dense working set. */
export type StepperDensity = 'expressive' | 'functional';

/** Where the flow stands: the step reached, out of how many, and the flow's name when it has one. */
export interface StepCounterFacts {
  readonly current: number;
  readonly total: number;
  readonly flow?: string;
}

/** One step's state as a word: `errors` counts what is to fix when the step says how many. */
export interface StepStateFacts {
  readonly state: StepState;
  readonly errorCount?: number;
}

/** One step, spoken whole: its place, its name and its state. */
export interface StepSpokenFacts extends StepStateFacts {
  readonly current: number;
  readonly total: number;
  readonly name: string;
}

/** The compact bar, spoken whole: where the flow stands, the step's name and how many need fixing. */
export interface StepIndicatorFacts {
  readonly current: number;
  readonly total: number;
  readonly name: string;
  readonly errors: number;
}

/**
 * Every word the stepper draws or speaks on its own, in the reader's language (`packages/i18n`'s
 * `stepperWords`). Required: the stepper holds no word of its own, so a Hindi screen never reads an
 * English counter.
 */
export interface StepperWords {
  /** A step list's name when the flow gives no `label` — *Steps*. */
  steps: TranslatedText;
  /** A progress bar's, dot strip's or numbered strip's name when the flow gives no `label` — *Progress*. */
  progress: TranslatedText;
  /** The progress overline — *Step 2 of 5*, or *Setup · Step 2 of 5* with the flow's name. */
  counter: (facts: StepCounterFacts) => TranslatedText;
  /** A step's state under its name — *Done*, *In progress*, *Needs fixing*, *Not started*, *3 to fix*. */
  state: (facts: StepStateFacts) => TranslatedText;
  /** An optional step's state — *Done · optional*. */
  stateOptional: (facts: StepStateFacts) => TranslatedText;
  /** The mark beside an optional step's name — *Optional*. */
  optional: TranslatedText;
  /** One step's accessible name — *Step 2 of 5, Roof, in progress*. */
  spokenStep: (facts: StepSpokenFacts) => TranslatedText;
  /** The compact bar's arrows — *Previous step*, *Next step*. */
  previousStep: TranslatedText;
  nextStep: TranslatedText;
  /** The compact bar's error count — *2 to fix*. */
  toFix: (count: number) => TranslatedText;
  /** The compact bar's accessible name — *3 of 9, Panel layout*, then *, 2 to fix* when any step has errors. */
  spokenIndicator: (facts: StepIndicatorFacts) => TranslatedText;
}

export interface StepperProps {
  /** Every word the stepper says on its own — see `StepperWords`. */
  words: StepperWords;
  /** Step objects, or a bare name for a step that is only named. */
  steps: (StepperStep | TranslatedText)[];
  /** Zero-based index of the active step. */
  current?: number;
  variant?: StepperVariant;
  density?: StepperDensity;
  /** Flow name — the overline on `progress`, the rail heading, the accessible name elsewhere. */
  label?: TranslatedText;
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
  /** `Stepper`'s words — a step list draws the same rows. */
  words: StepperWords;
  steps: (StepperStep | TranslatedText)[];
  current?: number;
  onStepClick?: (index: number) => void;
  label?: TranslatedText;
  /** Same default and same meaning as `Stepper`'s. */
  reachability?: StepReachability;
}
