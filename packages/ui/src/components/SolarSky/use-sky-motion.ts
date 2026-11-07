import { theme } from '@heliogrid/theme';
import { type RefObject, useEffect, useRef } from 'react';
import { riseOffsets, type SkyPhase, wireRun } from './SolarSky.logic';
import { WIRES } from './SolarSky.shapes';

/** How many sparks run along each wire, a third of the flow cycle apart. */
export const SPARKS_PER_WIRE = 3;
const bezier = (b: readonly number[]) => `cubic-bezier(${b.join(',')})`;

/** The sun's one rise along its arc into its place for the hour, by transform. */
export function useSunRise(
  sun: RefObject<SVGGElement | null>,
  place: number,
  phase: SkyPhase | null,
  reduced: boolean,
): void {
  useEffect(() => {
    const el = sun.current;
    if (el === null || phase === null || reduced || typeof el.animate !== 'function') return;
    const rise = el.animate(
      riseOffsets(place).map(([x, y]) => ({ transform: `translate(${x}px, ${y}px)` })),
      {
        duration: theme.motion.ambient.settle,
        delay: theme.motion.durations.emphasised,
        easing: bezier(theme.motion.easings.enter),
        fill: 'backwards',
      },
    );
    return () => rise.cancel();
  }, [sun, place, phase, reduced]);
}

/**
 * By day, sparks of energy running the length of each wire on the long flow cycle — the one loop
 * here, paused whenever the sky may not run (off-screen, a hidden tab).
 */
export function useSparkFlows(
  sparks: RefObject<(SVGCircleElement | null)[]>,
  phase: SkyPhase | null,
  reduced: boolean,
  running: boolean,
): void {
  const flows = useRef<Animation[]>([]);
  useEffect(() => {
    if (phase !== 'day' || reduced) return;
    const flow = theme.motion.ambient.flow;
    flows.current = sparks.current.flatMap((el, index) => {
      if (el === null || typeof el.animate !== 'function') return [];
      const run = wireRun(WIRES[Math.floor(index / SPARKS_PER_WIRE)] ?? []);
      const frames = run.offsets.map(([x, y], i) => ({
        transform: `translate(${x}px, ${y}px)`,
        opacity: i === 0 || i === run.offsets.length - 1 ? 0 : 1,
        offset: run.stops[i],
      }));
      return [
        el.animate(frames, {
          duration: flow,
          delay: theme.motion.ambient.settle + ((index % SPARKS_PER_WIRE) * flow) / SPARKS_PER_WIRE,
          iterations: Number.POSITIVE_INFINITY,
          easing: 'linear',
          fill: 'backwards',
        }),
      ];
    });
    return () => {
      for (const anim of flows.current) anim.cancel();
      flows.current = [];
    };
  }, [sparks, phase, reduced]);

  useEffect(() => {
    for (const anim of flows.current) {
      if (running) anim.play();
      else anim.pause();
    }
  }, [running]);
}
