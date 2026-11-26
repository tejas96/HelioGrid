'use client';
import type { SunPosition } from '@heliogrid/domain';
import type { ThemePalette } from '@heliogrid/theme';
import { Html, Line, Sky } from '@react-three/drei';
import { useMemo } from 'react';
import { MathUtils } from 'three';
import { fitMiddle, type SceneFit } from './camera-poses';

const RADIANS = MathUtils.DEG2RAD;
/**
 * The sky's dome: inside the camera's far plane (3 km), past the haze. The sky is drawn first and
 * under everything — the picture on the ground writes no depth, so it must come after.
 */
const SKY_DISTANCE = 1_500;
const SKY_ORDER = -10;
/** A clear day's air: haze near the horizon, a blue overhead (the POC's look). */
const TURBIDITY = 6;
const RAYLEIGH = 1.5;
const MIE = 0.005;
const MIE_G = 0.8;
/** The path's dashes and the sun's disc, as shares of the path's radius. */
const DASH = 0.03;
const GAP = 0.02;
const DISC = 0.02;
const PATH_PX = 2;
const DISC_SEGMENTS = 24;
/** The hours sit in the scene's layer, under the bars and sheets; drei's own reaches over them. */
const HOUR_LAYER: [number, number] = [1, 0];

/** A unit step toward the sun in the scene (x east, y up, z south). */
export function towardSun(sun: SunPosition): [number, number, number] {
  const azimuth = sun.azimuthDegrees * RADIANS;
  const elevation = sun.elevationDegrees * RADIANS;
  const across = Math.cos(elevation);
  return [Math.sin(azimuth) * across, Math.sin(elevation), -Math.cos(azimuth) * across];
}

/** The sun's path arcs over the roofs at their size, within these, metres. */
const PATH_MIN_M = 25;
const PATH_MAX_M = 120;
const PATH_SHARE = 0.9;

/** Where the day's path stands: over the roofs' middle, as wide as they are. */
export function pathRoom(fit: SceneFit | null) {
  const middle = fitMiddle(fit);
  const across = fit === null ? 0 : Math.hypot(fit.east - fit.west, fit.north - fit.south);
  const radiusM = Math.min(PATH_MAX_M, Math.max(PATH_MIN_M, across * PATH_SHARE));
  return { centre: { east: middle.east, north: middle.north }, radiusM };
}

export interface SunHourMark {
  readonly sun: SunPosition;
  /** The hour, formatted by the market: the page's words, never drawn into the scene. */
  readonly label: string;
}

/**
 * The sun's scene (`T-M05-002`, part g, board G8): the physical sky with the sun where it truly
 * stands, and the day's path as a dashed arc over the site with its hours and the sun's disc on it.
 */
export function StudioSunSky({
  sun,
  path,
  hours,
  centre,
  radiusM,
  palette,
}: {
  /** The picked sun; `null` while it is under the horizon. */
  sun: SunPosition | null;
  path: readonly SunPosition[];
  hours: readonly SunHourMark[];
  centre: { readonly east: number; readonly north: number };
  radiusM: number;
  palette: ThemePalette;
}) {
  const at = (point: SunPosition): [number, number, number] => {
    const [x, y, z] = towardSun(point);
    return [centre.east + x * radiusM, y * radiusM, -centre.north + z * radiusM];
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: `at` reads only the centre and radius named here
  const points = useMemo(() => path.map(at), [path, centre.east, centre.north, radiusM]);
  return (
    <>
      {/* A group's order sorts what it holds: the sky first. */}
      <group renderOrder={SKY_ORDER}>
        <Sky
          distance={SKY_DISTANCE}
          sunPosition={towardSun(sun ?? { azimuthDegrees: 180, elevationDegrees: -4 })}
          turbidity={TURBIDITY}
          rayleigh={RAYLEIGH}
          mieCoefficient={MIE}
          mieDirectionalG={MIE_G}
        />
      </group>
      {points.length < 2 ? null : (
        <Line
          points={points}
          color={palette['scene-sun-noon']}
          lineWidth={PATH_PX}
          dashed
          dashSize={radiusM * DASH}
          gapSize={radiusM * GAP}
          toneMapped={false}
        />
      )}
      {sun === null ? null : (
        <mesh position={at(sun)}>
          <sphereGeometry args={[radiusM * DISC, DISC_SEGMENTS, DISC_SEGMENTS]} />
          <meshBasicMaterial color={palette['scene-sun-disc']} toneMapped={false} fog={false} />
        </mesh>
      )}
      {hours.map((hour) => (
        <Html
          key={hour.label}
          position={at(hour.sun)}
          center
          className="hg-sun-hour-at"
          zIndexRange={HOUR_LAYER}
        >
          <span className="hg-sun-hour">{hour.label}</span>
        </Html>
      ))}
    </>
  );
}
