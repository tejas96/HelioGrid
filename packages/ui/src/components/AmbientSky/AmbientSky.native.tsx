import { theme } from '@heliogrid/theme';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Animated, Easing, type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { usePalette } from '../../primitives/Color/use-palette.native';
import { DARK_LIFT, LIGHT_FIELDS } from './AmbientSky.logic';
import type { AmbientSkyProps, LightField } from './AmbientSky.types';
import { useAmbientRun } from './use-ambient-run.native';

const HUES: Readonly<Record<LightField['hue'], string>> = {
  green: theme.brand.green,
  teal: theme.brand.teal,
  blue: theme.brand.blue,
  ocean: theme.brand.ocean,
};

/**
 * Slow light in the logo's colours, absolutely filling its parent. Each field drifts on the UI
 * thread (native driver, transform only) on its own long cycle and stops when reduced motion is on
 * or the app leaves the front.
 */
export function AmbientSky({ strength }: AmbientSkyProps) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const running = useAmbientRun();
  const dark = usePalette() === theme.palettes.dark;
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox({ width, height });
  };
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.sky}
      onLayout={onLayout}
    >
      {box.width === 0
        ? null
        : LIGHT_FIELDS[strength].map((field, index) => (
            <DriftingLight
              key={field.hue}
              field={field}
              index={index}
              width={box.width}
              height={box.height}
              lift={dark ? DARK_LIFT : 1}
              running={running}
            />
          ))}
    </View>
  );
}

interface DriftingLightProps {
  field: LightField;
  index: number;
  width: number;
  height: number;
  lift: number;
  running: boolean;
}

function DriftingLight({ field, index, width, height, lift, running }: DriftingLightProps) {
  const id = `hg-amb-${useId().replaceAll(':', '')}`;
  const progress = useRef(new Animated.Value(0)).current;
  const side = field.size * width;
  const half = theme.motion.ambient.drift;

  useEffect(() => {
    if (!running) {
      progress.stopAnimation();
      return;
    }
    const leg = (to: number) =>
      Animated.timing(progress, {
        toValue: to,
        duration: half,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([leg(1), leg(0)]));
    // Fields start out of step, as the web's negative delays place them.
    progress.setValue((index % 3) / 3);
    loop.start();
    return () => loop.stop();
  }, [running, progress, half, index]);

  const motion = useMemo(
    () => ({
      transform: [
        {
          translateX: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, field.drift[0] * side],
          }),
        },
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, field.drift[1] * side],
          }),
        },
        { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
      ],
    }),
    [progress, field, side],
  );

  return (
    <Animated.View
      style={[
        styles.light,
        {
          width: side,
          height: side,
          left: field.x * width - side / 2,
          top: field.y * height - side / 2,
        },
        motion,
      ]}
    >
      <Svg width={side} height={side}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={HUES[field.hue]} stopOpacity={field.opacity * lift} />
            <Stop offset="1" stopColor={HUES[field.hue]} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={side / 2} cy={side / 2} r={side / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sky: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  light: { position: 'absolute' },
});
