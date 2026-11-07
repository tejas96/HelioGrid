import { type ThemePalette, theme } from '@heliogrid/theme';
import { useId, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { usePalette } from '../../primitives/Color/use-palette.native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import { AmbientSky } from '../AmbientSky/AmbientSky.native';
import { useAmbientRun } from '../AmbientSky/use-ambient-run.native';
import { Clouds } from './SkyClouds.native';
import {
  type Fit,
  LandingModule,
  Layer,
  Rays,
  SPARKS_PER_WIRE,
  Spark,
  Sun,
} from './SkyMotion.native';
import { ART_SHARE, arcPlace, hoursOf, meetFit, skyPhase } from './SolarSky.logic';
import {
  CROWNS,
  EQUIPMENT_STROKES,
  FRAME_STROKES,
  floorLines,
  GROUND_SHADOW,
  HOME_FILLS,
  HOME_STROKES,
  MODULES,
  SITE_STROKES,
  SKYLINE,
  SKYLINE_PANELS,
  STARS,
  SUN_ARC_PATH,
  WINDOWS,
  WIRES,
  wirePath,
} from './SolarSky.shapes';
import type { SolarSkyProps } from './SolarSky.types';

const FLOOR = floorLines(5, 9);

/**
 * The door's living sky on the phone. The still drawing is one SVG; each part that moves — a landing
 * module, its glint, the rays, the energy, the sun — is its own layer over it, moved by transform or
 * opacity on the UI thread, so nothing sets state per frame.
 */
export function SolarSky({ framing, hours: fixed }: SolarSkyProps) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const palette = usePalette();
  const running = useAmbientRun();
  const reduced = useReducedMotion();
  const [hours] = useState(() => fixed ?? hoursOf(new Date()));
  const phase = skyPhase(hours);
  const place = arcPlace(hours);
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox({ width, height });
  };
  const artHeight = box.height * ART_SHARE[framing];
  const fit = meetFit(box.width, artHeight);
  const art: Fit = { ...fit, dy: fit.dy + (box.height - artHeight), ...box };
  const day = phase === 'day';

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.sky}
      onLayout={onLayout}
    >
      <SkyGround palette={palette} night={!day} />
      <AmbientSky strength="door" />
      {box.width === 0 ? null : (
        <>
          {framing === 'door' ? (
            <Clouds fit={art} palette={palette} night={!day} running={running} />
          ) : null}
          <Layer fit={art}>
            <StillScene palette={palette} night={!day} />
          </Layer>
          {MODULES.map((module, i) => (
            <LandingModule
              key={module.outline}
              module={module}
              index={i}
              fit={art}
              palette={palette}
              reduced={reduced}
              glint={day && running}
            />
          ))}
          {day ? <Rays fit={art} place={place} palette={palette} reduced={reduced} /> : null}
          {day && running
            ? WIRES.flatMap((wire, w) =>
                Array.from({ length: SPARKS_PER_WIRE }, (_, k) => (
                  <Spark
                    // biome-ignore lint/suspicious/noArrayIndexKey: a fixed set of sparks per wire
                    key={`${w}-${k}`}
                    wire={wire}
                    order={k}
                    fit={art}
                    palette={palette}
                  />
                )),
              )
            : null}
          <Sun fit={art} place={place} night={!day} palette={palette} reduced={reduced} />
        </>
      )}
    </View>
  );
}

/** The sky's own light, in two layers: the panel's ground, then the logo's tint over its top. */
function SkyGround({ palette, night }: { palette: ThemePalette; night: boolean }) {
  const id = `hg-sky-${useId().replaceAll(':', '')}`;
  const tint = night ? theme.brand.ocean : theme.brand.teal;
  return (
    <Svg style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette['panel-deep']} />
          <Stop offset="0.58" stopColor={palette.panel} />
          <Stop offset="1" stopColor={palette.canvas} />
        </LinearGradient>
        <LinearGradient id={`${id}-t`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={tint} stopOpacity={night ? 0.26 : 0.18} />
          <Stop offset="0.6" stopColor={theme.brand.green} stopOpacity={night ? 0 : 0.06} />
          <Stop offset="1" stopColor={tint} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id}-g)`} />
      <Rect width="100%" height="100%" fill={`url(#${id}-t)`} />
    </Svg>
  );
}

function StillScene({ palette, night }: { palette: ThemePalette; night: boolean }) {
  const ink = palette['text-primary'];
  return (
    <G strokeLinecap="round" strokeLinejoin="round" fill="none">
      <Path
        d={SUN_ARC_PATH}
        stroke={ink}
        strokeOpacity={0.22}
        strokeWidth={1.2}
        strokeDasharray="2 7"
      />
      {night
        ? STARS.map(([x, y, r]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={ink} fillOpacity={0.55} />
          ))
        : null}
      {SKYLINE.map((d) => (
        <Path key={d} d={d} fill={ink} fillOpacity={0.06} />
      ))}
      {SKYLINE_PANELS.map((d) => (
        <Path key={d} d={d} fill={theme.brand.ocean} fillOpacity={0.32} />
      ))}
      <Ellipse
        cx={GROUND_SHADOW[0]}
        cy={GROUND_SHADOW[1]}
        rx={GROUND_SHADOW[2]}
        ry={GROUND_SHADOW[3]}
        fill={ink}
        fillOpacity={0.07}
      />
      {FLOOR.map((d) => (
        <Path key={d} d={d} stroke={palette.accent} strokeOpacity={0.16} strokeWidth={0.8} />
      ))}
      {SITE_STROKES.map((d) => (
        <Path key={d} d={d} stroke={ink} strokeOpacity={0.28} strokeWidth={1.3} />
      ))}
      {CROWNS.map(([cx, cy, r]) => (
        <Circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={r}
          stroke={ink}
          strokeOpacity={0.28}
          strokeWidth={1.3}
        />
      ))}
      {HOME_FILLS.map((d) => (
        <Path key={d} d={d} fill={palette.canvas} fillOpacity={0.72} />
      ))}
      {WINDOWS.map((d) => (
        <Path
          key={d}
          d={d}
          fill={night ? palette.sun : palette.accent}
          fillOpacity={night ? 0.6 : 0.14}
        />
      ))}
      {[...HOME_STROKES, ...FRAME_STROKES, ...EQUIPMENT_STROKES].map((d) => (
        <Path key={d} d={d} stroke={ink} strokeOpacity={0.62} strokeWidth={1.3} />
      ))}
      {WIRES.map((wire) => (
        <Path
          key={wirePath(wire)}
          d={wirePath(wire)}
          stroke={ink}
          strokeOpacity={0.4}
          strokeWidth={1.1}
        />
      ))}
    </G>
  );
}

const styles = StyleSheet.create({
  sky: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
});
