import { theme } from '@heliogrid/theme';
import { useId } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
/* The primitive's NATIVE half is imported by path: tsc has no `moduleSuffixes` configured, so
   the barrel would hand this file the web signature. Metro resolves the explicit path
   identically, and no web bundler ever reads a .native.tsx. */
import { Text } from '../../primitives/Text/Text.native';
import type { LogoTileProps, WordmarkProps } from './Wordmark.types';

/** −0.03em, the system's own display tracking, expressed against the caller's size. */
const TRACKING = -0.03;

/** The brand gradient's three stops. RN cannot consume the CSS gradient string. */
const RAMP: readonly [string, string, string] = [
  theme.colors['iris-violet'],
  theme.colors['iris-blue'],
  theme.colors['iris-magenta'],
];

const GRID = 'Grid';

/**
 * WEB → RN MAPPING: the web half fills the word with `--gradient-brand` through
 * `background-clip: text`, which RN has no equivalent for without a masking library. The
 * iridescence is kept by ramping the four letters of "Grid" across the same three stops —
 * same hues, same direction, sampled per glyph instead of per pixel.
 */
function letterColour(index: number, count: number): string {
  const t = count > 1 ? index / (count - 1) : 0;
  if (t < 0.34) {
    return RAMP[0];
  }
  if (t < 0.67) {
    return RAMP[1];
  }
  return RAMP[2];
}

interface NativeWordmarkProps extends WordmarkProps {
  style?: StyleProp<TextStyle>;
}

interface NativeLogoTileProps extends LogoTileProps {
  style?: StyleProp<ViewStyle>;
}

function baseType(size: number, tone: WordmarkProps['tone']): TextStyle {
  return {
    fontFamily: theme.type.families.sans,
    fontWeight: '700',
    fontSize: size,
    lineHeight: size,
    letterSpacing: size * TRACKING,
    color: tone === 'onDark' ? theme.colors['text-inverse'] : theme.colors['text-primary'],
  };
}

/**
 * The HelioGrid wordmark. Geist Bold, −0.03em, iridescence on "Grid" only. No logo mark
 * exists — none was ever provided, and one is not invented here.
 */
export function Wordmark({ size = 22, tone = 'default', style }: NativeWordmarkProps) {
  const base = baseType(size, tone);
  if (tone === 'mono') {
    return <Text style={[base, style]}>HelioGrid</Text>;
  }
  return (
    <Text style={[base, style]}>
      Helio
      {GRID.split('').map((glyph, index) => (
        <Text key={glyph} style={[base, { color: letterColour(index, GRID.length) }]}>
          {glyph}
        </Text>
      ))}
    </Text>
  );
}

/** Gradient app tile — the rail/launcher mark. Radius follows the density, never a circle. */
export function LogoTile({ size = 40, radius = 12, style }: NativeLogoTileProps) {
  const gradientId = `hg-logo-tile-${useId()}`;
  const frame: ViewStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  };
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="HelioGrid"
      style={[frame, theme.elevation.e2, style]}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* 135deg = top-left → bottom-right, the same axis as --gradient-brand. */}
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={RAMP[0]} />
            <Stop offset="0.45" stopColor={RAMP[1]} />
            <Stop offset="1" stopColor={RAMP[2]} />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width={size}
          height={size}
          rx={radius}
          ry={radius}
          fill={`url(#${gradientId})`}
        />
      </Svg>
      <Text
        style={{
          fontFamily: theme.type.families.sans,
          fontWeight: '700',
          fontSize: Math.round(size * 0.45),
          letterSpacing: Math.round(size * 0.45) * TRACKING,
          color: theme.colors['text-inverse'],
        }}
      >
        H
      </Text>
    </View>
  );
}
