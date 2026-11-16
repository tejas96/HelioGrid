/**
 * A spring token as the web can play it: CSS has no spring, so its step response is sampled into a
 * `linear()` timing curve, and the time it takes to settle becomes its duration. The phone hands
 * the same token to `Animated.spring`, so both halves move on one spring.
 */
interface Spring {
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
}

/** Settled once it stays within half a percent of its end: a step no eye resolves. */
const REST = 0.005;
const STEP_S = 0.001;
const SAMPLES = 40;

/** The spring's position, from 0 towards 1, every millisecond until it rests. */
function stepResponse({ stiffness, damping, mass }: Spring): number[] {
  const positions = [0];
  let x = 0;
  let velocity = 0;
  let restingSince = 0;
  for (let i = 1; restingSince < 50 && i < 5000; i++) {
    velocity += ((stiffness * (1 - x) - damping * velocity) / mass) * STEP_S;
    x += velocity * STEP_S;
    positions.push(x);
    restingSince = Math.abs(1 - x) < REST ? restingSince + 1 : 0;
  }
  return positions.slice(0, positions.length - restingSince + 1);
}

export function springCurve(spring: Spring): { durationMs: number; easing: string } {
  const positions = stepResponse(spring);
  const last = positions.length - 1;
  const points = Array.from({ length: SAMPLES + 1 }, (_, n) =>
    n === SAMPLES ? 1 : Number((positions[Math.round((n / SAMPLES) * last)] ?? 1).toFixed(4)),
  );
  return { durationMs: last, easing: `linear(${points.join(',')})` };
}
