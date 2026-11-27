'use client';
import type { RoofScene, SunPosition } from '@heliogrid/domain';
import type { ThemePalette } from '@heliogrid/theme';
import { Html, Line } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { BackSide, Color, MathUtils, Object3D } from 'three';
import type { ClearGround } from './camera-limits';
import { fitMiddle, fitSpread, type SceneFit, type SunFrame, sunViewOf } from './camera-poses';

const RADIANS = MathUtils.DEG2RAD;
/**
 * The sky's dome: inside the camera's far plane (3 km), past the haze. The sky is drawn first and
 * under everything — the picture on the ground writes no depth, so it must come after.
 */
const SKY_DISTANCE = 1_500;
const SKY_ORDER = -10;
/** The path's dashes and the sun's disc, as shares of the path's radius. */
const DASH = 0.03;
const GAP = 0.02;
const DISC = 0.03;
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

/**
 * The sun's path arcs round the roofs as wide as they are across, so its ends come down beside
 * them, never on them, and the sun's view (`StudioCameraRig`) frames it whole, arching over the
 * house against the sky; a small house still gets a street's width of sky.
 */
const PATH_MIN_M = 30;
const PATH_MAX_M = 150;
const PATH_SHARE = 1;

/** Where the day's path stands: round the roofs' middle. */
export function pathRoom(fit: SceneFit | null) {
  const middle = fitMiddle(fit);
  const across = fit === null ? 0 : Math.hypot(fit.east - fit.west, fit.north - fit.south);
  const radiusM = Math.min(PATH_MAX_M, Math.max(PATH_MIN_M, across * PATH_SHARE));
  return { centre: { east: middle.east, north: middle.north }, radiusM };
}

/**
 * The day's path round the roofs and the sun's view's frame of it, where its noon sun stands;
 * `null` while the sun's bar is closed.
 */
export function useSunPath(
  fit: SceneFit | null,
  sky: { readonly path: readonly SunPosition[] } | null,
) {
  const path = sky?.path ?? null;
  return useMemo(() => {
    const room = pathRoom(fit);
    const noon = (path ?? []).reduce<SunPosition | null>(
      (high, point) =>
        high === null || point.elevationDegrees > high.elevationDegrees ? point : high,
      null,
    );
    const frame: SunFrame | null =
      noon === null
        ? null
        : {
            east: room.centre.east,
            north: room.centre.north,
            radiusM: room.radiusM,
            roofsSpreadM: fit === null ? 0 : fitSpread(fit),
            noonAzimuthDegrees: noon.azimuthDegrees,
            noonElevationDegrees: noon.elevationDegrees,
          };
    return { room, frame };
  }, [fit, path]);
}

/**
 * The calm sky over every view but the top (`T-M05-002a`): the scene's sky at the horizon, deeper
 * toward the zenith, both leaning to the page's colour so it sits in light and in dark. The far
 * ground fades into its horizon colour (the haze's), so ground and sky meet with no edge.
 */
const ZENITH_TO_LINE = 0.45;
const SKY_TO_PAGE = 0.35;
export function calmSkyOf(palette: ThemePalette): {
  readonly horizon: Color;
  readonly zenith: Color;
} {
  const page = new Color(palette.canvas);
  const horizon = new Color(palette['scene-sky']).lerp(page, SKY_TO_PAGE);
  const zenith = new Color(palette['scene-sky'])
    .lerp(new Color(palette['scene-line']), ZENITH_TO_LINE)
    .lerp(page, SKY_TO_PAGE);
  return { horizon, zenith };
}

/** The sky's dome: a gradient up from the horizon, drawn first and under everything. */
const CALM_SKY_SEGMENTS = 32;
/** How high above the horizon, as the sine of the angle, the sky reaches its zenith colour. */
const CALM_SKY_RISE = 0.6;
const CALM_SKY_VERTEX = `
varying vec3 vSeen;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vSeen = world.xyz - cameraPosition;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;
const CALM_SKY_FRAGMENT = `
uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform float uRise;
varying vec3 vSeen;
void main() {
  float up = clamp(normalize(vSeen).y / uRise, 0.0, 1.0);
  gl_FragColor = vec4(mix(uHorizon, uZenith, smoothstep(0.0, 1.0, up)), 1.0);
  #include <colorspace_fragment>
}`;

export function StudioCalmSky({ palette }: { palette: ThemePalette }) {
  const uniforms = useMemo(() => {
    const { horizon, zenith } = calmSkyOf(palette);
    return {
      uHorizon: { value: horizon },
      uZenith: { value: zenith },
      uRise: { value: CALM_SKY_RISE },
    };
  }, [palette]);
  return (
    <mesh renderOrder={SKY_ORDER} frustumCulled={false}>
      <sphereGeometry args={[SKY_DISTANCE, CALM_SKY_SEGMENTS, CALM_SKY_SEGMENTS]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={CALM_SKY_VERTEX}
        fragmentShader={CALM_SKY_FRAGMENT}
        side={BackSide}
        depthWrite={false}
        fog={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export interface SunHourMark {
  readonly sun: SunPosition;
  /** The hour, formatted by the market: the page's words, never drawn into the scene. */
  readonly label: string;
}

/**
 * The sun's scene (`T-M05-002`, part g, board G8): the day's path as a dashed arc over the site
 * with its hours and the sun's disc on it, under the calm sky every 3D view shares
 * (`StudioCalmSky`) — a physical sky turned toward the sun is a white glare at the horizon, which
 * read as an empty band over the ground.
 */
export function StudioSunSky({
  sun,
  path,
  hours,
  centre,
  radiusM: roomM,
  frame,
  free,
  clear,
  palette,
}: {
  /** The picked sun; `null` while it is under the horizon. */
  sun: SunPosition | null;
  path: readonly SunPosition[];
  hours: readonly SunHourMark[];
  centre: { readonly east: number; readonly north: number };
  radiusM: number;
  /** The sun's view's frame (`StudioCameraRig`): the path is drawn as wide as that view holds. */
  frame: SunFrame | null;
  free: { readonly top: number; readonly bottom: number };
  clear: ClearGround | null;
  palette: ThemePalette;
}) {
  const size = useThree((three) => three.size);
  const radiusM = frame === null ? roomM : sunViewOf(frame, size, free, clear).radiusM;
  const at = (point: SunPosition): [number, number, number] => {
    const [x, y, z] = towardSun(point);
    return [centre.east + x * radiusM, y * radiusM, -centre.north + z * radiusM];
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: `at` reads only the centre and radius named here
  const points = useMemo(() => path.map(at), [path, centre.east, centre.north, radiusM]);
  return (
    <>
      {points.length < 2 ? null : (
        <Line
          points={points}
          color={palette['scene-sun-noon']}
          lineWidth={PATH_PX}
          dashed
          dashSize={radiusM * DASH}
          gapSize={radiusM * GAP}
          toneMapped={false}
          // Far out in the sky, the path is never taken by the ground's haze.
          fog={false}
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

/** How far the sun's light stands from the roofs. */
const SUN_DISTANCE_M = 120;
/**
 * How deep the shadows' box reaches either side of the roofs along the sun's line: a tight depth
 * range keeps the shadow map's depth fine on every graphics chip, the site's tallest within it.
 */
const SHADOW_DEPTH_M = 80;
/**
 * The ground the sun's shadows cover: the roofs' own box with room for a tall roof's shadow round
 * it, within these, so the shadow map's pixels are spent on the house and its walls stay smooth.
 */
const SHADOW_HALF_MIN_M = 12;
const SHADOW_HALF_MAX_M = 60;
const SHADOW_ROOM_M = 4;
/** How far a shadow's test is pushed off the face it lies on, in metres: no wavy band on a wall. */
const SHADOW_NORMAL_BIAS = 0.03;

/** The roofs' ground and their tallest top: where the sun's shadows fall, and how far round. */
export function shadowRoomOf(scene: RoofScene, scale: number) {
  const points = scene.prisms.flatMap((prism) => prism.outer);
  if (points.length === 0) return { east: 0, north: 0, halfM: SHADOW_HALF_MAX_M };
  const easts = points.map((point) => point.east * scale);
  const norths = points.map((point) => point.north * scale);
  const west = Math.min(...easts);
  const east = Math.max(...easts);
  const south = Math.min(...norths);
  const north = Math.max(...norths);
  const tallest = Math.max(0, ...scene.prisms.map((prism) => prism.topM));
  const halfM = Math.hypot(east - west, north - south) / 2 + tallest + SHADOW_ROOM_M;
  return {
    east: (west + east) / 2,
    north: (south + north) / 2,
    halfM: Math.min(SHADOW_HALF_MAX_M, Math.max(SHADOW_HALF_MIN_M, halfM)),
  };
}

/**
 * The light: the sky's fill and the sun's strength. The fill is low enough that a pale wall in the
 * sun and one in shade read as two faces, never both clipped to white.
 */
const SKY_LIGHT = 0.6;
const SUN_LIGHT = 2.4;
/** Under this the sun's light warms toward sunrise's and sunset's colour. */
const WARM_BELOW_DEG = 18;
/**
 * The sun's light from where the sun stands, casting soft shadows over the site. Its shadow map
 * is as sharp as the view's detail allows; a new size is a new light, as three.js keeps a map once made.
 */
export function StudioSunLight({
  sun,
  palette,
  shadowMapPx,
  room,
  sunOpen,
  lidar,
}: {
  sun: SunPosition;
  palette: ThemePalette;
  shadowMapPx: number;
  /** Where the roofs stand and how far round them their shadows fall. */
  room: ReturnType<typeof shadowRoomOf>;
  /**
   * Shadows are cast only where they are what is shown — the sun's view and LiDAR. The picture
   * holds its own; elsewhere a cast shade over it is only ever a false one on some chips.
   */
  sunOpen: boolean;
  lidar: boolean;
}) {
  const casts = sunOpen || lidar;
  // The light looks at the roofs' middle: its shadow box is laid round them.
  const target = useMemo(() => new Object3D(), []);
  const azimuth = sun.azimuthDegrees * RADIANS;
  const elevation = sun.elevationDegrees * RADIANS;
  const across = Math.cos(elevation) * SUN_DISTANCE_M;
  const half = room.halfM;
  const warmth = 1 - Math.min(1, Math.max(0, sun.elevationDegrees / WARM_BELOW_DEG));
  const colour = new Color(palette['scene-mark']).lerp(
    new Color(palette['scene-sun-dawn']),
    warmth,
  );
  return (
    <>
      <hemisphereLight args={[palette['scene-sky'], palette['scene-ground'], SKY_LIGHT]} />
      <primitive object={target} position={[room.east, 0, -room.north]} />
      <directionalLight
        position={[
          room.east + Math.sin(azimuth) * across,
          Math.sin(elevation) * SUN_DISTANCE_M,
          -room.north - Math.cos(azimuth) * across,
        ]}
        target={target}
        intensity={SUN_LIGHT}
        color={colour}
        castShadow={casts}
        shadow-mapSize={[shadowMapPx, shadowMapPx]}
        shadow-camera-left={-half}
        shadow-camera-right={half}
        shadow-camera-top={half}
        shadow-camera-bottom={-half}
        shadow-camera-near={SUN_DISTANCE_M - SHADOW_DEPTH_M}
        shadow-camera-far={SUN_DISTANCE_M + SHADOW_DEPTH_M}
        shadow-bias={-0.0004}
        shadow-normalBias={SHADOW_NORMAL_BIAS}
      />
    </>
  );
}
