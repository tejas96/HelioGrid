import type { CSSProperties, RefObject } from 'react';
import type { SkyPhase } from './SolarSky.logic';
import {
  CLOUD_BASE,
  CLOUD_PUFFS,
  CLOUDS,
  CROWNS,
  EQUIPMENT_STROKES,
  FRAME_STROKES,
  floorLines,
  GROUND_SHADOW,
  HOME_FILLS,
  HOME_STROKES,
  MODULES,
  moonPath,
  type Point,
  RAY_TARGETS,
  rayPath,
  SCENE,
  SITE_STROKES,
  SKYLINE,
  SKYLINE_PANELS,
  STARS,
  SUN_ARC_PATH,
  WINDOWS,
  WIRES,
  wirePath,
} from './SolarSky.shapes';
import type { SkyFraming } from './SolarSky.types';
import { SPARKS_PER_WIRE } from './use-sky-motion';

type CssVars = CSSProperties & Record<`--${string}`, string>;

const FLOOR = floorLines(5, 9);

interface SkySceneProps {
  framing: SkyFraming;
  phase: SkyPhase;
  rest: Point;
  glowId: string;
  sun: RefObject<SVGGElement | null>;
  sparks: RefObject<(SVGCircleElement | null)[]>;
}

/**
 * The door's drawing for the hour once it is known: sky marks, the skyline, the home and its row of
 * modules, the wires, and the sun or the moon. Classes carry the look and the one-shot motion
 * (`SolarSky.css`); the sun and the sparks are moved from `use-sky-motion.ts` through their refs.
 */
export function SkyScene({ framing, phase, rest, glowId, sun, sparks }: SkySceneProps) {
  return (
    <svg
      className="hg-sky-art"
      viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
      preserveAspectRatio="xMidYMax meet"
      focusable="false"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0" className="hg-sky-glow-core" />
          <stop offset="1" className="hg-sky-glow-edge" />
        </radialGradient>
      </defs>
      <path className="hg-sky-arc" d={SUN_ARC_PATH} />
      {phase === 'night'
        ? STARS.map(([x, y, r], i) => (
            <circle
              key={`${x}-${y}`}
              className="hg-sky-star"
              cx={x}
              cy={y}
              r={r}
              style={{ '--i': String(i) } as CssVars}
            />
          ))
        : null}
      {(framing === 'door' ? CLOUDS : []).map((cloud, i) => (
        <g
          key={`${cloud.x}-${cloud.y}`}
          className="hg-sky-cloud"
          style={{ '--i': String(i) } as CssVars}
        >
          <g transform={`translate(${cloud.x} ${cloud.y}) scale(${cloud.size})`}>
            {CLOUD_PUFFS.map(([dx, dy, r]) => (
              <circle key={`${dx}-${dy}`} cx={dx} cy={dy} r={r} />
            ))}
            <rect
              x={CLOUD_BASE.x}
              y={CLOUD_BASE.y}
              width={CLOUD_BASE.width}
              height={CLOUD_BASE.height}
              rx={CLOUD_BASE.height / 2}
            />
          </g>
        </g>
      ))}
      <g className="hg-sky-skyline">
        {SKYLINE.map((d) => (
          <path key={d} d={d} />
        ))}
        {SKYLINE_PANELS.map((d) => (
          <path key={d} className="hg-sky-skyline-panel" d={d} />
        ))}
      </g>
      <ellipse
        className="hg-sky-shadow"
        cx={GROUND_SHADOW[0]}
        cy={GROUND_SHADOW[1]}
        rx={GROUND_SHADOW[2]}
        ry={GROUND_SHADOW[3]}
      />
      <g className="hg-sky-floor">
        {FLOOR.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g className="hg-sky-line hg-sky-faint">
        {SITE_STROKES.map((d) => (
          <path key={d} d={d} />
        ))}
        {CROWNS.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      <g className="hg-sky-walls">
        {HOME_FILLS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {WINDOWS.map((d) => (
        <path key={d} className="hg-sky-window" d={d} />
      ))}
      <g className="hg-sky-line">
        {HOME_STROKES.map((d) => (
          <path key={d} d={d} />
        ))}
        {FRAME_STROKES.map((d) => (
          <path key={d} d={d} />
        ))}
        {EQUIPMENT_STROKES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g className="hg-sky-wires">
        {WIRES.map((wire) => (
          <path key={wirePath(wire)} d={wirePath(wire)} />
        ))}
      </g>
      {MODULES.map((module, i) => (
        <g key={module.outline} className="hg-sky-module" style={{ '--i': String(i) } as CssVars}>
          <path className="hg-sky-module-face" d={module.outline} />
          <path className="hg-sky-module-cells" d={module.cells} />
          {phase === 'day' ? <path className="hg-sky-glint" d={module.glint} /> : null}
        </g>
      ))}
      {phase === 'day'
        ? RAY_TARGETS.map((to) => (
            <path key={to.join('-')} className="hg-sky-ray" d={rayPath(rest, to)} />
          ))
        : null}
      {phase === 'day'
        ? WIRES.flatMap((wire, w) =>
            Array.from({ length: SPARKS_PER_WIRE }, (_, k) => {
              const index = w * SPARKS_PER_WIRE + k;
              const [x, y] = wire[0] ?? [0, 0];
              return (
                <circle
                  key={index}
                  ref={(el) => {
                    sparks.current[index] = el;
                  }}
                  className="hg-sky-spark"
                  cx={x}
                  cy={y}
                  r={2.2}
                />
              );
            }),
          )
        : null}
      <g ref={sun} className="hg-sky-sun">
        <circle cx={rest[0]} cy={rest[1]} r={44} fill={`url(#${glowId})`} />
        {phase === 'day' ? (
          <circle className="hg-sky-sun-core" cx={rest[0]} cy={rest[1]} r={12} />
        ) : (
          <path className="hg-sky-moon" d={moonPath(rest)} />
        )}
      </g>
    </svg>
  );
}
