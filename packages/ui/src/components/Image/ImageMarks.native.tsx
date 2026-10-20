import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg from 'react-native-svg';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import type { ImageGlyphName } from './Image.missing';
import { IMAGE_GLYPH } from './Image.missing';

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
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ShellGlyphMarks name={IMAGE_GLYPH[name]} />
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
