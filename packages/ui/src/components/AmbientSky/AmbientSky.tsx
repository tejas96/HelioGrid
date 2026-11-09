import { type CSSProperties, useRef } from 'react';
import { DARK_LIFT, LIGHT_FIELDS } from './AmbientSky.logic';
import type { AmbientSkyProps } from './AmbientSky.types';
import { useAmbientRun } from './use-ambient-run';

type CssVars = CSSProperties & Record<`--${string}`, string>;

/**
 * Slow light in the logo's colours, absolutely filling a relative parent. Each field drifts on its
 * own long cycle (`--amb-drift`), out of step with the others, and every one pauses together when
 * the box leaves the screen, the tab goes to the background or reduced motion is on.
 */
export function AmbientSky({ strength }: AmbientSkyProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const running = useAmbientRun(ref);
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="hg-ambient"
      data-strength={strength}
      data-running={running ? 'true' : 'false'}
      style={{ '--hg-amb-dark-lift': String(DARK_LIFT) } as CssVars}
    >
      {LIGHT_FIELDS[strength].map((field, index) => (
        <span
          key={field.hue}
          className="hg-ambient-light"
          data-hue={field.hue}
          style={
            {
              '--x': `${field.x * 100}%`,
              '--y': `${field.y * 100}%`,
              '--size': `${field.size * 100}%`,
              '--dx': `${field.drift[0] * 100}%`,
              '--dy': `${field.drift[1] * 100}%`,
              '--a': String(field.opacity),
              '--phase': String(index),
            } as CssVars
          }
        />
      ))}
    </span>
  );
}
