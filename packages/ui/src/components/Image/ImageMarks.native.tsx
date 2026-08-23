import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { ImageGlyphName } from './Image.missing';

/* The three marks the frame can draw, and the loading pulse. Split out of Image.native.tsx so the
   component file stays inside the 300-line law. */

export function Glyph({
  name,
  size,
  color,
}: {
  name: ImageGlyphName;
  size: number;
  color: string;
}) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'no-image' ? (
        <>
          <Rect x={3} y={4} width={18} height={16} rx={3} {...stroke} />
          <Path d="m5 17 4.5-4.5L13 16l2.5-2.5L21 19" {...stroke} />
          <Path d="m3 3 18 18" {...stroke} />
        </>
      ) : null}
      {name === 'no-cloud' ? (
        <>
          <Path d="M7 18a4 4 0 0 1 .6-8 6 6 0 0 1 11.3 1.6A3.5 3.5 0 0 1 18 18z" {...stroke} />
          <Path d="m3 3 18 18" {...stroke} />
        </>
      ) : null}
      {name === 'eye' ? (
        <>
          <Path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" {...stroke} />
          <Circle cx={12} cy={12} r={3} {...stroke} />
        </>
      ) : null}
    </Svg>
  );
}

/** The web half sweeps a gradient keyframe; RN has no CSS loop, so the sunken box pulses. */
export function Skeleton() {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value]);
  const opacity = value.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  return <Animated.View style={[styles.skeleton, { opacity }]} />;
}

const styles = StyleSheet.create({
  skeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors['canvas-sunken'],
  },
});
