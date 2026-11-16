/**
 * Motion: calm, quick, and never in the way — OneOhm's web timings. Durations in ms; under reduced
 * motion each falls to a near-instant change, except `fade`. Springs drive the phone's
 * `Animated.spring` and, as a sampled `linear()` curve, the web's CSS.
 */
export const DURATION = {
  /** A state answering at once: a hover tint, a check. */
  instant: 80,
  /** A press sinking and rising; the sidebar folding. */
  fast: 140,
  /** Opacity alone, and the one duration reduced motion keeps: a fade carries nothing travelling. */
  fade: 120,
  micro: 120,
  standard: 220,
  emphasised: 320,
  ambient: 500,
  data: 850,
  /** An empty place's line drawing settling in (`EmptyScene`): slow enough to be seen, once. */
  scene: 1200,
} as const;

/**
 * Calm ambient light (`AmbientSky`) and the door's sky: long, slow cycles in ms. `settle` is how
 * long the sun takes to rise into its place; `install` the gap between two panels landing. The
 * rest are the loops a wait or a mark runs: a skeleton's light passing (`shimmer`) or breathing
 * (`pulse`, one way), a spinner's turn, an unknown operation's travel, a map pin's beacon, and the
 * offline scene's swell and sway.
 */
export const AMBIENT = {
  drift: 34000,
  breathe: 14000,
  sheen: 9000,
  flow: 2800,
  twinkle: 5200,
  settle: 2200,
  install: 70,
  shimmer: 1400,
  pulse: 700,
  spin: 700,
  indeterminate: 1150,
  beacon: 2000,
  swell: 8000,
  sway: 9000,
} as const;

/** Reduced motion: state still changes, quickly, with nothing travelling — and a fade still fades. */
export const REDUCED_DURATION: Readonly<Record<keyof typeof DURATION, number>> = {
  instant: 1,
  fast: 1,
  fade: DURATION.fade,
  micro: 1,
  standard: 1,
  emphasised: 1,
  ambient: 1,
  data: 1,
  scene: 1,
};

/** Cubic-bezier control points. `enter` is OneOhm's `outExpo`, `exit` its `in`. */
export const EASING = {
  standard: [0.2, 0, 0, 1],
  enter: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
  'out-quint': [0.22, 1, 0.36, 1],
  'in-out': [0.65, 0, 0.35, 1],
} as const;

/** `snappy` a control's thumb or a row settling; `layout` a sheet, a dialog, a toast; `gentle` a slow settle. */
export const SPRING = {
  snappy: { stiffness: 500, damping: 40, mass: 1 },
  layout: { stiffness: 380, damping: 32, mass: 1 },
  gentle: { stiffness: 170, damping: 26, mass: 1 },
} as const;

/** A list rises in, item by item, up to `maxItems`; the rest are there at once. */
export const STAGGER = { stepMs: 30, maxItems: 8, risePx: 6 } as const;

/** Where a menu or a popover starts: it pops from `popPx` below at `popScale`. */
export const ENTER = { popPx: 4, popScale: 0.98 } as const;

/** How far a pressed control sinks: a button to `scale`, a round icon control further, to `iconScale`. */
export const PRESS = { scale: 0.98, iconScale: 0.95, liftPx: 2 } as const;

/** A page skeleton appears only when a load runs longer than this, so a fast load never flashes. */
export const SKELETON_DELAY_MS = 150;

/** A hover's name tip waits this long, so a pointer passing over never flashes one. */
export const TIP_DELAY_MS = 350;
