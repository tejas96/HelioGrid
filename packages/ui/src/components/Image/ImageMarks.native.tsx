import { Animated, StyleSheet } from 'react-native';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { usePulse } from '../../primitives/use-pulse.native';
import type { ShellGlyphSize } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
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
  size: ShellGlyphSize;
  color: ThemeColor;
}) {
  return <ShellGlyph name={IMAGE_GLYPH[name]} size={size} ink={color} />;
}

/** The web half sweeps a gradient keyframe; RN has no CSS loop, so the sunken box pulses. */
export function Skeleton() {
  const opacity = usePulse();
  return <Animated.View style={[styles.skeleton, { opacity }]} />;
}

const styles = StyleSheet.create({
  skeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors['canvas-sunken'],
  },
});
