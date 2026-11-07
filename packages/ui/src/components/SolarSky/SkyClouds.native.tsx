import { type ThemePalette, theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { Circle, G, Rect } from 'react-native-svg';
import { type Fit, Layer, motion } from './SkyMotion.native';
import { CLOUD_BASE, CLOUD_PUFFS, CLOUDS } from './SolarSky.shapes';

/** The clouds drifting across on the longest cycle, out of step with each other. */
export function Clouds({
  fit,
  palette,
  night,
  running,
}: {
  fit: Fit;
  palette: ThemePalette;
  night: boolean;
  running: boolean;
}) {
  /* Light by day on the light sky; on the dark sky, or after sunset, a faint veil of the ink. */
  const veiled = night || palette === theme.palettes.dark;
  const fill = veiled ? palette['text-primary'] : palette.surface;
  return (
    <>
      {CLOUDS.map((cloud, i) => (
        <Cloud
          key={`${cloud.x}-${cloud.y}`}
          cloud={cloud}
          order={i}
          fit={fit}
          fill={fill}
          opacity={veiled ? 0.08 : 0.7}
          running={running}
        />
      ))}
    </>
  );
}

function Cloud({
  cloud,
  order,
  fit,
  fill,
  opacity,
  running,
}: {
  cloud: (typeof CLOUDS)[number];
  order: number;
  fit: Fit;
  fill: string;
  opacity: number;
  running: boolean;
}) {
  const drift = useRef(new Animated.Value(order % 2)).current;
  useEffect(() => {
    if (!running) {
      drift.stopAnimation();
      return;
    }
    const leg = (to: number) =>
      Animated.timing(drift, {
        toValue: to,
        duration: motion.ambient.drift * 2,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([leg(order % 2 ? 0 : 1), leg(order % 2)]));
    loop.start();
    return () => loop.stop();
  }, [drift, running, order]);
  const reach = theme.spacing['sp-8'] * fit.scale;
  const style = {
    transform: [
      { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-reach, reach] }) },
    ],
  };
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Layer fit={fit}>
        <G
          transform={`translate(${cloud.x} ${cloud.y}) scale(${cloud.size})`}
          fill={fill}
          fillOpacity={opacity}
        >
          {CLOUD_PUFFS.map(([dx, dy, r]) => (
            <Circle key={`${dx}-${dy}`} cx={dx} cy={dy} r={r} />
          ))}
          <Rect
            x={CLOUD_BASE.x}
            y={CLOUD_BASE.y}
            width={CLOUD_BASE.width}
            height={CLOUD_BASE.height}
            rx={CLOUD_BASE.height / 2}
          />
        </G>
      </Layer>
    </Animated.View>
  );
}
