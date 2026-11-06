/**
 * Motion: calm, quick, and never in the way. Durations in ms; under reduced motion each falls to a
 * near-instant fade. Springs drive the phone's Reanimated worklets; the web reads the beziers.
 */
export const DURATION = {
  micro: 120,
  standard: 220,
  emphasised: 320,
  ambient: 500,
  data: 850,
} as const;

/** Reduced motion: state still changes, quickly, with nothing travelling. */
export const REDUCED_DURATION: Readonly<Record<keyof typeof DURATION, number>> = {
  micro: 1,
  standard: 1,
  emphasised: 1,
  ambient: 1,
  data: 1,
};

export const EASING = {
  standard: [0.2, 0, 0, 1],
  enter: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
  spring: [0.22, 1.18, 0.36, 1],
} as const;

export const SPRING = {
  snappy: { stiffness: 500, damping: 40, mass: 1 },
  layout: { stiffness: 380, damping: 32, mass: 1 },
  gentle: { stiffness: 170, damping: 26, mass: 1 },
} as const;

/** A list rises in, item by item, up to `maxItems`; the rest are there at once. */
export const STAGGER = { stepMs: 30, maxItems: 8, risePx: 6 } as const;

/** How far a pressed control sinks. */
export const PRESS = { scale: 0.97, liftPx: 2 } as const;

/** A page skeleton appears only when a load runs longer than this, so a fast load never flashes. */
export const SKELETON_DELAY_MS = 150;
