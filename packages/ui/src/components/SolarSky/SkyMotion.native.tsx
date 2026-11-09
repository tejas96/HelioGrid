import { type ThemePalette, theme } from '@heliogrid/theme';
import { type ReactNode, useEffect, useId, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { pointOnArc, riseOffsets, wireRun } from './SolarSky.logic';
import { type ModuleShape, moonPath, type Point, RAY_TARGETS, rayPath } from './SolarSky.shapes';

/**
 * The moving layers of the phone's door sky. Each is its own view over the still drawing, moved by
 * transform or opacity on the UI thread (native driver), so nothing sets state per frame.
 */

export const SPARKS_PER_WIRE = 3;
const SUN_GLOW = 44;
export const motion = theme.motion;

export interface Fit {
  readonly scale: number;
  readonly dx: number;
  readonly dy: number;
  readonly width: number;
  readonly height: number;
}

/** A layer the scene's size, in the scene's own units. */
export function Layer({ fit, children }: { fit: Fit; children: ReactNode }) {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width={fit.width}
      height={fit.height}
      viewBox={`${-fit.dx / fit.scale} ${-fit.dy / fit.scale} ${fit.width / fit.scale} ${fit.height / fit.scale}`}
    >
      {children}
    </Svg>
  );
}

interface LandingModuleProps {
  module: ModuleShape;
  index: number;
  fit: Fit;
  palette: ThemePalette;
  reduced: boolean;
  glint: boolean;
}

/** One module landing on the frame, once; then, by day, its glint passing on the long cycle. */
export function LandingModule({ module, index, fit, palette, reduced, glint }: LandingModuleProps) {
  const land = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      land.setValue(1);
      return;
    }
    const anim = Animated.timing(land, {
      toValue: 1,
      duration: motion.durations.emphasised,
      delay: motion.durations.emphasised + index * motion.ambient.install,
      easing: Easing.bezier(...motion.easings.spring),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [land, index, reduced]);

  useEffect(() => {
    if (!glint) {
      shine.stopAnimation();
      shine.setValue(0);
      return;
    }
    const sheen = motion.ambient.sheen;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(index * motion.ambient.install * 2),
        Animated.timing(shine, { toValue: 1, duration: sheen * 0.06, useNativeDriver: true }),
        Animated.timing(shine, { toValue: 0, duration: sheen * 0.1, useNativeDriver: true }),
        Animated.delay(sheen * 0.84 - index * motion.ambient.install * 2),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glint, shine, index]);

  const style = {
    opacity: land,
    transform: [
      { translateY: land.interpolate({ inputRange: [0, 1], outputRange: [-12 * fit.scale, 0] }) },
      { scale: land.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  };
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Layer fit={fit}>
        <Path
          d={module.outline}
          fill={theme.brand.ocean}
          stroke={theme.brand.blue}
          strokeWidth={0.8}
          strokeLinejoin="round"
        />
        <Path
          d={module.cells}
          stroke={theme.brand.teal}
          strokeOpacity={0.7}
          strokeWidth={0.6}
          fill="none"
        />
      </Layer>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: shine }]}>
        <Layer fit={fit}>
          <Path d={module.glint} fill={palette.sun} fillOpacity={0.85} />
        </Layer>
      </Animated.View>
    </Animated.View>
  );
}

interface PlacedProps {
  fit: Fit;
  place: number;
  palette: ThemePalette;
  reduced: boolean;
}

/** The two rays from where the sun rests to the row, shown once it has risen. */
export function Rays({ fit, place, palette, reduced }: PlacedProps) {
  const show = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return;
    const anim = Animated.timing(show, {
      toValue: 1,
      duration: motion.durations.ambient,
      delay: motion.ambient.settle,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [show, reduced]);
  const rest = pointOnArc(place);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: show }]}>
      <Layer fit={fit}>
        {RAY_TARGETS.map((to) => (
          <Path
            key={to.join('-')}
            d={rayPath(rest, to)}
            stroke={palette.sun}
            strokeOpacity={0.7}
            strokeWidth={1.2}
            strokeDasharray="3 6"
            strokeLinecap="round"
          />
        ))}
      </Layer>
    </Animated.View>
  );
}

/** A spark of energy running the length of one wire, on the long flow cycle. */
export function Spark({
  wire,
  order,
  fit,
  palette,
}: {
  wire: readonly Point[];
  order: number;
  fit: Fit;
  palette: ThemePalette;
}) {
  const run = useMemo(() => wireRun(wire), [wire]);
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const flow = motion.ambient.flow;
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: flow,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const start = setTimeout(() => loop.start(), (order * flow) / SPARKS_PER_WIRE);
    return () => {
      clearTimeout(start);
      loop.stop();
    };
  }, [progress, order]);
  const [x0, y0] = wire[0] ?? [0, 0];
  const size = 4.4 * fit.scale;
  const last = run.offsets.length - 1;
  const style = {
    left: fit.dx + x0 * fit.scale - size / 2,
    top: fit.dy + y0 * fit.scale - size / 2,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: palette['brand-green'],
    opacity: progress.interpolate({
      inputRange: [...run.stops],
      outputRange: run.stops.map((_, i) => (i === 0 || i === last ? 0 : 1)),
    }),
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [...run.stops],
          outputRange: run.offsets.map(([x]) => x * fit.scale),
        }),
      },
      {
        translateY: progress.interpolate({
          inputRange: [...run.stops],
          outputRange: run.offsets.map(([, y]) => y * fit.scale),
        }),
      },
    ],
  };
  return <Animated.View style={[styles.spark, style]} />;
}

/** The sun rising along its arc into its place for this hour — or, after dark, the moon at rest. */
export function Sun({ fit, place, night, palette, reduced }: PlacedProps & { night: boolean }) {
  const id = `hg-sun-${useId().replaceAll(':', '')}`;
  const rise = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return;
    const anim = Animated.timing(rise, {
      toValue: 1,
      duration: motion.ambient.settle,
      delay: motion.durations.emphasised,
      easing: Easing.bezier(...motion.easings.enter),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [rise, reduced]);
  const rest = pointOnArc(place);
  const path = riseOffsets(place);
  const inputRange = path.map((_, i) => i / (path.length - 1));
  const side = SUN_GLOW * 2 * fit.scale;
  const glow = night ? palette['text-primary'] : palette.sun;
  const style = {
    left: fit.dx + rest[0] * fit.scale - side / 2,
    top: fit.dy + rest[1] * fit.scale - side / 2,
    width: side,
    height: side,
    opacity: rise.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 1] }),
    transform: [
      {
        translateX: rise.interpolate({ inputRange, outputRange: path.map(([x]) => x * fit.scale) }),
      },
      {
        translateY: rise.interpolate({
          inputRange,
          outputRange: path.map(([, y]) => y * fit.scale),
        }),
      },
    ],
  };
  const c = SUN_GLOW;
  return (
    <Animated.View style={[styles.sun, style]}>
      <Svg width={side} height={side} viewBox={`0 0 ${c * 2} ${c * 2}`}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={glow} stopOpacity={night ? 0.16 : 0.55} />
            <Stop offset="1" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={c} cy={c} r={c} fill={`url(#${id})`} />
        {night ? (
          <Path d={moonPath([c, c])} fill={palette['text-primary']} fillOpacity={0.82} />
        ) : (
          <Circle cx={c} cy={c} r={12} fill={palette.sun} />
        )}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  spark: { position: 'absolute' },
  sun: { position: 'absolute' },
});
