import { useEffect, useId, useRef, useState } from 'react';
import { useReducedMotion } from '../../primitives/use-reduced-motion';
import { AmbientSky } from '../AmbientSky';
import { useAmbientRun } from '../AmbientSky/use-ambient-run';
import { SkyScene } from './SkyScene';
import { arcPlace, hoursOf, pointOnArc, skyPhase } from './SolarSky.logic';
import type { SolarSkyProps } from './SolarSky.types';
import { useSparkFlows, useSunRise } from './use-sky-motion';

/**
 * The door's living sky (`SolarSky.types.ts`), absolutely filling a relative parent. The landing
 * panels, the rays, the glints and the stars are CSS; the sun's rise along its arc and the energy
 * along the wires are transform-only Web Animations computed from the scene's own geometry.
 */
export function SolarSky({ framing, hours: fixed }: SolarSkyProps) {
  const box = useRef<HTMLDivElement>(null);
  const sun = useRef<SVGGElement>(null);
  const sparks = useRef<(SVGCircleElement | null)[]>([]);
  const glowId = `hg-sky-${useId().replaceAll(':', '')}`;
  const running = useAmbientRun(box);
  const reduced = useReducedMotion();
  /* The device's hour is read after the page has hydrated, never in the server's render, so both
     draw the same first frame: the light alone, then the scene with the sun rising into place. */
  const [hours, setHours] = useState<number | null>(fixed ?? null);
  useEffect(() => {
    if (fixed === undefined) setHours(hoursOf(new Date()));
  }, [fixed]);
  const phase = hours === null ? null : skyPhase(hours);
  const place = arcPlace(hours ?? 12);
  const rest = pointOnArc(place);

  useSunRise(sun, place, phase, reduced);
  useSparkFlows(sparks, phase, reduced, running);

  return (
    <div
      ref={box}
      aria-hidden="true"
      className="hg-sky"
      data-framing={framing}
      data-phase={phase ?? undefined}
      data-running={running ? 'true' : 'false'}
    >
      <AmbientSky strength="door" />
      {phase === null ? null : (
        <SkyScene
          framing={framing}
          phase={phase}
          rest={rest}
          glowId={glowId}
          sun={sun}
          sparks={sparks}
        />
      )}
    </div>
  );
}
